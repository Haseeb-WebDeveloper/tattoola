import { fetchMessagesPage, getTypingChannel, markReadUpTo, sendMessage, subscribeMessages } from "@/services/chat.service";
import { supabase } from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { loadJSON, saveJSON } from "./mmkv";

type Message = any;

type ThreadState = {
  messagesByConv: Record<string, Message[]>; // newest last for render
  cursors: Record<string, { createdAt: string; id: string } | undefined>;
  loadingByConv: Record<string, boolean>;
  typingPeers: Record<string, boolean>; // convId -> peer typing
  unsubByConv: Record<string, () => void>;
  activeSubs: Record<string, boolean>; // guard against double subscribe
  seenMessageIds: Record<string, Record<string, boolean>>; // convId -> { messageId: true }
  currentUserId?: string; // Track current user for receipt queries
  loadLatest(conversationId: string, userId?: string): Promise<void>;
  loadOlder(conversationId: string, userId?: string): Promise<void>;
  optimisticSend(params: { conversationId: string; senderId: string; type: string; text?: string; mediaUrl?: string }): Promise<{ tempId: string }>;
  confirmSend(conversationId: string, tempId: string, serverRow?: any): void;
  subscribe(conversationId: string, userId?: string): void;
  unsubscribe(conversationId: string): void;
  markRead(conversationId: string, userId: string): Promise<void>;
  setTyping(conversationId: string, isTyping: boolean): void;
  refreshReceipts(conversationId: string, userId: string): Promise<void>;
};

const KEY = "thread-cache-v1";

export const useChatThreadStore = create<ThreadState>((set, get) => ({
  messagesByConv: loadJSON(KEY, { messagesByConv: {} }).messagesByConv || {},
  cursors: {},
  loadingByConv: {},
  typingPeers: {},
  unsubByConv: {},
  activeSubs: {},
  seenMessageIds: {},
  currentUserId: undefined,
  async loadLatest(conversationId, userId) {
    set((s) => ({ loadingByConv: { ...s.loadingByConv, [conversationId]: true }, currentUserId: userId }));
    try {
      // Fetch user's deletedAt timestamp
      let deletedAt: string | undefined;
      if (userId) {
        const { data: cuData } = await supabase
          .from("conversation_users")
          .select("deletedAt")
          .eq("conversationId", conversationId)
          .eq("userId", userId)
          .maybeSingle();
        deletedAt = cuData?.deletedAt || undefined;
      }
      
      const { items, nextCursor } = await fetchMessagesPage(conversationId, undefined, deletedAt);
      // Database returns newest first, reverse to get oldest first for display
      const list = (items || []).slice().reverse();
      
      // Normalize message type field (database uses messageType, UI uses type)
      list.forEach((m: any) => {
        if (m.messageType && !m.type) {
          m.type = m.messageType;
        }
      });
      
      
      // Fetch receipts for messages sent by current user (to see if receiver read them)
      if (userId) {
        // Only get message IDs for messages sent by current user
        const sentMessageIds = list
          .filter((m: any) => m.senderId === userId)
          .map((m: any) => m.id)
          .filter(Boolean);
        
        if (sentMessageIds.length > 0) {
          const { data: receipts } = await supabase
            .from("message_receipts")
            .select("messageId, status, userId")
            .in("messageId", sentMessageIds);
          
          // Create a map of messageId -> receiverId for sent messages
          const messageReceiverMap = new Map(
            list
              .filter((m: any) => m.senderId === userId)
              .map((m: any) => [m.id, m.receiverId])
          );
          
          // Filter receipts to only include those where receipt.userId matches message.receiverId
          // This handles both normal messages and self-messages correctly
          const validReceipts = (receipts || []).filter((r: any) => {
            const receiverId = messageReceiverMap.get(r.messageId);
            return receiverId && r.userId === receiverId;
          });
          
          // Map receipts to messages
          const receiptMap = new Map(validReceipts.map(r => [r.messageId, r.status]));
          list.forEach((m: any) => {
            // Only set receiptStatus for messages sent by current user
            if (m.senderId === userId) {
              m.receiptStatus = receiptMap.get(m.id) || 'DELIVERED';
            } else {
              // For received messages, receiptStatus is not used (we use isRead instead)
              m.receiptStatus = 'DELIVERED';
            }
          });
        } else {
          // No sent messages, set default receiptStatus
          list.forEach((m: any) => {
            m.receiptStatus = 'DELIVERED';
          });
        }
      }
      
      // Build seen map from loaded messages to prevent duplicates from realtime
      const seen: Record<string, boolean> = {};
      list.forEach((m: any) => {
        if (m.id) seen[m.id] = true;
      });
      
      // Clear any existing messages and set fresh list
      set((s) => ({
        messagesByConv: { ...s.messagesByConv, [conversationId]: list },
        cursors: { ...s.cursors, [conversationId]: nextCursor },
        loadingByConv: { ...s.loadingByConv, [conversationId]: false },
        seenMessageIds: { ...s.seenMessageIds, [conversationId]: seen }, // Replace, don't merge
      }));
      saveJSON(KEY, { messagesByConv: get().messagesByConv });
    } catch (e) {
      console.error("❌ Error loading messages:", e);
      set((s) => ({ loadingByConv: { ...s.loadingByConv, [conversationId]: false } }));
    }
  },
  async loadOlder(conversationId, userId) {
    const cursor = get().cursors[conversationId];
    if (!cursor) return;
    
    // Fetch user's deletedAt timestamp
    let deletedAt: string | undefined;
    if (userId) {
      const { data: cuData } = await supabase
        .from("conversation_users")
        .select("deletedAt")
        .eq("conversationId", conversationId)
        .eq("userId", userId)
        .maybeSingle();
      deletedAt = cuData?.deletedAt || undefined;
    }
    
    const { items, nextCursor } = await fetchMessagesPage(conversationId, cursor, deletedAt);
    const older = (items || []).slice().reverse();
    
    // Normalize message type field (database uses messageType, UI uses type)
    older.forEach((m: any) => {
      if (m.messageType && !m.type) {
        m.type = m.messageType;
      }
    });
    
    
    // Fetch receipts for older messages sent by current user
    if (userId) {
      // Only get message IDs for messages sent by current user
      const sentMessageIds = older
        .filter((m: any) => m.senderId === userId)
        .map((m: any) => m.id)
        .filter(Boolean);
      
      if (sentMessageIds.length > 0) {
        const { data: receipts } = await supabase
          .from("message_receipts")
          .select("messageId, status, userId")
          .in("messageId", sentMessageIds);
        
        // Create a map of messageId -> receiverId for sent messages
        const messageReceiverMap = new Map(
          older
            .filter((m: any) => m.senderId === userId)
            .map((m: any) => [m.id, m.receiverId])
        );
        
        // Filter receipts to only include those where receipt.userId matches message.receiverId
        // This handles both normal messages and self-messages correctly
        const validReceipts = (receipts || []).filter((r: any) => {
          const receiverId = messageReceiverMap.get(r.messageId);
          return receiverId && r.userId === receiverId;
        });
        
        const receiptMap = new Map(validReceipts.map(r => [r.messageId, r.status]));
        older.forEach((m: any) => {
          // Only set receiptStatus for messages sent by current user
          if (m.senderId === userId) {
            m.receiptStatus = receiptMap.get(m.id) || 'DELIVERED';
          } else {
            // For received messages, receiptStatus is not used (we use isRead instead)
            m.receiptStatus = 'DELIVERED';
          }
        });
      } else {
        // No sent messages, set default receiptStatus
        older.forEach((m: any) => {
          m.receiptStatus = 'DELIVERED';
        });
      }
    }
    
    set((s) => {
      const existing = s.messagesByConv[conversationId] || [];
      const existingIds = new Set(existing.map((m: any) => m.id));
      
      // Only add messages that don't already exist
      const newMessages = older.filter((m: any) => !existingIds.has(m.id));
      
      // Mark new messages as seen
      const seen = { ...s.seenMessageIds[conversationId] || {} };
      newMessages.forEach((m: any) => {
        if (m.id) seen[m.id] = true;
      });
      
      return {
        messagesByConv: { ...s.messagesByConv, [conversationId]: [...newMessages, ...existing] },
        cursors: { ...s.cursors, [conversationId]: nextCursor },
        seenMessageIds: { ...s.seenMessageIds, [conversationId]: seen },
      };
    });
    saveJSON(KEY, { messagesByConv: get().messagesByConv });
  },
  async optimisticSend({ conversationId, senderId, type, text, mediaUrl }) {
    // Use a stable client-generated id for idempotency, so any accidental double-send fails on PK
    const clientId = uuidv4();
    const temp: any = {
      id: clientId,
      conversationId,
      senderId,
      content: text || "", // Only put text in content, never put mediaUrl here
      messageType: type, // Database field name
      type: type, // UI field name (used by MessageItem component)
      mediaUrl: mediaUrl || null, // Set mediaUrl separately so image renders correctly
      createdAt: new Date().toISOString(),
      _optimistic: true,
      receiptStatus: 'DELIVERED',
    };
    set((s) => {
      const existingMessages = s.messagesByConv[conversationId] || [];
      // Simply append to end - no sorting needed, messages are chronological
      const updatedMessages = [...existingMessages, temp];
      
      // Mark this message as seen to prevent duplicates from realtime
      const seen = s.seenMessageIds[conversationId] || {};
      const updatedSeen = { ...seen, [clientId]: true };
      
      return {
        messagesByConv: { ...s.messagesByConv, [conversationId]: updatedMessages },
        seenMessageIds: { ...s.seenMessageIds, [conversationId]: updatedSeen },
      };
    });
    saveJSON(KEY, { messagesByConv: get().messagesByConv });
    try {
      await sendMessage({ id: clientId, conversationId, senderId, type: type as any, text, mediaUrl });
    } catch (e) {
      // keep optimistic; UI can show retry if needed
    }
    return { tempId: clientId };
  },
  confirmSend(conversationId, tempId, serverRow) {
    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [conversationId]: (s.messagesByConv[conversationId] || []).map((m: any) => (m.id === tempId ? { ...serverRow, _optimistic: false } : m)),
      },
    }));
    saveJSON(KEY, { messagesByConv: get().messagesByConv });
  },
  subscribe(conversationId, userId) {
    // Guard: if already subscribed (or in-flight), do nothing
    if (get().activeSubs[conversationId]) {
      return;
    }
    set((s) => ({ activeSubs: { ...s.activeSubs, [conversationId]: true } }));
    const unsub = subscribeMessages(conversationId, {
      onInsert: async (row) => {
        
        // Check for duplicate before updating state
        const seen = get().seenMessageIds[conversationId] || {};
        if (row?.id && seen[row.id]) {
          return; // Don't update state at all
        }
        
        // Double-check if message already exists in array
        const existing = get().messagesByConv[conversationId] || [];
        const alreadyExists = existing.some((m: any) => m.id === row.id);
        if (alreadyExists) {
          // Still mark as seen
          set((s) => ({
            seenMessageIds: { ...s.seenMessageIds, [conversationId]: { ...s.seenMessageIds[conversationId] || {}, [row.id]: true } },
          }));
          return;
        }
        
        // Normalize message type field (database uses messageType, UI uses type)
        if (row.messageType && !row.type) {
          row.type = row.messageType;
        }
        
        // Fetch receipt status for this message if current user is available
        const currentUserId = get().currentUserId || userId;
        if (currentUserId && row.senderId === currentUserId) {
          // Fetch receipt where userId matches the message's receiverId (handles self-messages)
          const { data: receipt } = await supabase
            .from("message_receipts")
            .select("status, userId")
            .eq("messageId", row.id)
            .eq("userId", row.receiverId) // Receipt belongs to the receiver
            .maybeSingle();
          row.receiptStatus = receipt?.status || 'DELIVERED';
        } else {
          row.receiptStatus = 'DELIVERED';
        }
        
        
        // Clear deletedAt if user has deleted this conversation (conversation reappears)
        const clearDeletedAt = async () => {
          if (userId) {
            const { data: cuData } = await supabase
              .from("conversation_users")
              .select("deletedAt")
              .eq("conversationId", conversationId)
              .eq("userId", userId)
              .maybeSingle();
            
            if (cuData?.deletedAt) {
              await supabase
                .from("conversation_users")
                .update({ deletedAt: null })
                .eq("conversationId", conversationId)
                .eq("userId", userId);
            }
          }
        };
        clearDeletedAt().catch(console.error);
        
        set((s) => {
          const nextSeen = { ...s.seenMessageIds[conversationId] || {}, [row.id]: true };
          const messages = s.messagesByConv[conversationId] || [];
          // Simply append - messages arrive in chronological order
          const next = [...messages, row];
          return {
            messagesByConv: { ...s.messagesByConv, [conversationId]: next },
            seenMessageIds: { ...s.seenMessageIds, [conversationId]: nextSeen },
          };
        });
        saveJSON(KEY, { messagesByConv: get().messagesByConv });
      },
    });
    
    // Subscribe to receipt updates
    // Note: message_receipts doesn't have conversationId, so we verify message belongs to this conversation
    const receiptChannel = supabase
      .channel(`receipts-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message_receipts",
        },
        async (payload) => {
          const { messageId, status, userId: receiptUserId } = payload.new as any;
          const currentUserId = get().currentUserId || userId;
          
          console.log("🔔 [receiptSubscription] Receipt update received:", {
            messageId,
            status,
            receiptUserId,
            currentUserId,
            conversationId,
          });
          
          // Only process receipts from other users (not our own)
          if (receiptUserId === currentUserId) {
            console.log("⏭️ [receiptSubscription] Skipping - receipt is from current user");
            return;
          }
          
          // Verify this message belongs to this conversation and was sent by current user
          // Only update receipt status for messages we sent (to see if peer read them)
          const messages = get().messagesByConv[conversationId] || [];
          const message = messages.find((m: any) => m.id === messageId);
          
          // If message is in local state and was sent by current user, update immediately
          if (message && message.senderId === currentUserId) {
            console.log(`✅ [receiptSubscription] Updating message ${messageId} receiptStatus to ${status}`);
            set((s) => {
              const messages = s.messagesByConv[conversationId] || [];
              const updated = messages.map((m: any) =>
                m.id === messageId ? { ...m, receiptStatus: status } : m
              );
              return {
                messagesByConv: { ...s.messagesByConv, [conversationId]: updated },
              };
            });
            saveJSON(KEY, { messagesByConv: get().messagesByConv });
            return;
          }
          
          // If message not in local state, verify it belongs to this conversation via DB query
          // This handles cases where receipt update arrives before message is loaded
          if (!message) {
            console.log(`🔍 [receiptSubscription] Message ${messageId} not in local state, checking DB...`);
            const { data: msgData } = await supabase
              .from("messages")
              .select("id, conversationId, senderId")
              .eq("id", messageId)
              .eq("conversationId", conversationId)
              .maybeSingle();
            
            if (msgData && msgData.senderId === currentUserId) {
              console.log(`✅ [receiptSubscription] Message belongs to conversation, refreshing receipts`);
              // Message belongs to this conversation and was sent by us
              // Refresh receipts to update all messages, including this one when it loads
              get().refreshReceipts(conversationId, currentUserId).catch(console.error);
            } else {
              console.log(`⚠️ [receiptSubscription] Message ${messageId} doesn't belong to this conversation or wasn't sent by current user`);
            }
          } else {
            console.log(`⚠️ [receiptSubscription] Message ${messageId} found but senderId (${message.senderId}) !== currentUserId (${currentUserId})`);
          }
        }
      )
      .subscribe();
    
    // Subscribe to messages table updates to catch isRead changes
    const messagesChannel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversationId=eq.${conversationId}`,
        },
        async (payload) => {
          const updatedMessage = payload.new as any;
          const currentUserId = get().currentUserId || userId;
          
          console.log("🔔 [messagesSubscription] Message update received:", {
            messageId: updatedMessage.id,
            isRead: updatedMessage.isRead,
            conversationId,
            currentUserId,
          });
          
          // Update the message with new data (including isRead)
          set((s) => {
            const messages = s.messagesByConv[conversationId] || [];
            const updated = messages.map((m: any) => {
              if (m.id === updatedMessage.id) {
                console.log(`🔄 [messagesSubscription] Updating message ${m.id} isRead: ${m.isRead} -> ${updatedMessage.isRead}`);
                return { ...m, isRead: updatedMessage.isRead };
              }
              return m;
            });
            return {
              messagesByConv: { ...s.messagesByConv, [conversationId]: updated },
            };
          });
          saveJSON(KEY, { messagesByConv: get().messagesByConv });
          
          // If message is now read AND it was sent BY current user, refresh receipt status
          // This ensures receipt status is updated when peer reads the message
          if (updatedMessage.isRead) {
            const messages = get().messagesByConv[conversationId] || [];
            const message = messages.find((m: any) => m.id === updatedMessage.id);
            console.log(`📖 [messagesSubscription] Message ${updatedMessage.id} marked as read. Checking if sent by current user...`, {
              messageFound: !!message,
              senderId: message?.senderId,
              currentUserId,
            });
            
            if (message && message.senderId === currentUserId) {
              console.log(`✅ [messagesSubscription] Message was sent by current user, fetching receipt status...`);
              // Fetch the actual receipt status from message_receipts table
              // Receipt belongs to the receiver, so query by receiverId (handles self-messages)
              const { data: receipt, error: receiptError } = await supabase
                .from("message_receipts")
                .select("status")
                .eq("messageId", updatedMessage.id)
                .eq("userId", message.receiverId) // Receipt belongs to the receiver
                .maybeSingle();
              
              if (receiptError) {
                console.error("❌ [messagesSubscription] Error fetching receipt:", receiptError);
              } else if (receipt) {
                console.log(`✅ [messagesSubscription] Found receipt for message ${updatedMessage.id}: ${receipt.status}`);
                set((s) => {
                  const messages = s.messagesByConv[conversationId] || [];
                  const updated = messages.map((msg: any) =>
                    msg.id === updatedMessage.id
                      ? { ...msg, receiptStatus: receipt.status }
                      : msg
                  );
                  return {
                    messagesByConv: { ...s.messagesByConv, [conversationId]: updated },
                  };
                });
                saveJSON(KEY, { messagesByConv: get().messagesByConv });
              } else {
                console.log(`⚠️ [messagesSubscription] No receipt found for message ${updatedMessage.id}`);
              }
            }
          }
        }
      )
      .subscribe();
    
    const combinedUnsub = () => {
      unsub();
      supabase.removeChannel(receiptChannel);
      supabase.removeChannel(messagesChannel);
    };
    
    set((s) => ({ unsubByConv: { ...s.unsubByConv, [conversationId]: combinedUnsub } }));
  },
  unsubscribe(conversationId) {
    const u = get().unsubByConv[conversationId];
    if (u) {
      try { u(); } catch {}
    }
    set((s) => ({
      unsubByConv: { ...s.unsubByConv, [conversationId]: undefined as any },
      activeSubs: { ...s.activeSubs, [conversationId]: false },
    }));
  },
  async markRead(conversationId, userId) {
    console.log("🟡 [markRead] Called", { conversationId, userId });
    const list = get().messagesByConv[conversationId] || [];
    const newest = list[list.length - 1];
    console.log(`📨 [markRead] Messages in conversation: ${list.length}, newest message ID: ${newest?.id}`);
    
    if (newest?.id) {
      await markReadUpTo(conversationId, userId, newest.id);
      // Refresh receipts after marking as read to catch any updates
      // This ensures receipt status is updated even if subscription missed it
      setTimeout(() => {
        console.log("⏰ [markRead] Scheduling refreshReceipts after 500ms");
        get().refreshReceipts(conversationId, userId).catch(console.error);
      }, 500);
    } else {
      console.log("⚠️ [markRead] No newest message found, skipping markReadUpTo");
    }
  },
  setTyping(conversationId, isTyping) {
    const channel = getTypingChannel(conversationId);
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED" && isTyping) {
        await channel.track({ typing: true, at: Date.now() });
        setTimeout(() => channel.untrack(), 3000);
      }
    });
  },
  async refreshReceipts(conversationId, userId) {
    console.log("🟢 [refreshReceipts] Called", { conversationId, userId });
    const messages = get().messagesByConv[conversationId] || [];
    console.log(`📨 [refreshReceipts] Total messages in conversation: ${messages.length}`);
    
    // Only get message IDs for messages sent by current user (we only care about receipts for our sent messages)
    const sentMessageIds = messages
      .filter((m: any) => m.senderId === userId)
      .map((m: any) => m.id)
      .filter(Boolean);
    
    console.log(`📤 [refreshReceipts] Found ${sentMessageIds.length} sent messages:`, sentMessageIds);
    
    if (sentMessageIds.length === 0) {
      console.log("⚠️ [refreshReceipts] No sent messages, returning early");
      return;
    }
    
    // Fetch receipts for messages we sent
    // Receipts are created for the receiver, so we need to get receipts where:
    // - For normal messages: receipt.userId = message.receiverId (which != currentUserId)
    // - For self-messages: receipt.userId = message.receiverId (which == currentUserId)
    // So we need to fetch receipts and then filter by matching receiverId
    const { data: receipts, error: receiptsError } = await supabase
      .from("message_receipts")
      .select("messageId, status, userId")
      .in("messageId", sentMessageIds);
    
    if (receiptsError) {
      console.error("❌ [refreshReceipts] Error fetching receipts:", receiptsError);
    } else {
      console.log(`📥 [refreshReceipts] Fetched ${receipts?.length || 0} receipts (before filtering):`, receipts);
    }
    
    // Create a map of messageId -> receiverId for sent messages
    const messageReceiverMap = new Map(
      messages
        .filter((m: any) => m.senderId === userId)
        .map((m: any) => [m.id, m.receiverId])
    );
    
    // Filter receipts to only include those where receipt.userId matches message.receiverId
    // This handles both normal messages and self-messages correctly
    const validReceipts = (receipts || []).filter((r: any) => {
      const receiverId = messageReceiverMap.get(r.messageId);
      return receiverId && r.userId === receiverId;
    });
    
    console.log(`📥 [refreshReceipts] Valid receipts (after filtering by receiverId):`, validReceipts);
    
    const receiptMap = new Map(validReceipts.map(r => [r.messageId, r.status]));
    
    // Log receipt status for each sent message
    sentMessageIds.forEach((msgId: string) => {
      const status = receiptMap.get(msgId) || 'DELIVERED';
      const receiverId = messageReceiverMap.get(msgId);
      console.log(`📊 [refreshReceipts] Message ${msgId} (receiverId: ${receiverId}): receiptStatus = ${status}`);
    });
    
    set((s) => {
      const updated = messages.map((m: any) => {
        // Only update receiptStatus for messages sent by current user
        if (m.senderId === userId) {
          const newStatus = receiptMap.get(m.id) || 'DELIVERED';
          if (m.receiptStatus !== newStatus) {
            console.log(`🔄 [refreshReceipts] Updating message ${m.id} receiptStatus: ${m.receiptStatus} -> ${newStatus}`);
          }
          return {
            ...m,
            receiptStatus: newStatus,
          };
        }
        // For received messages, keep existing receiptStatus (not used, but preserve it)
        return m;
      });
      return {
        messagesByConv: { ...s.messagesByConv, [conversationId]: updated },
      };
    });
    saveJSON(KEY, { messagesByConv: get().messagesByConv });
    console.log("✅ [refreshReceipts] Completed");
  },
}));

// Module-level guard to prevent double realtime subscriptions in dev StrictMode
const activeConversationChannels = new Set<string>();

// Monkey-patch subscribe to also use module-level guard
const originalSubscribe = useChatThreadStore.getState().subscribe;
useChatThreadStore.setState({
  subscribe: (conversationId: string) => {
    if (activeConversationChannels.has(conversationId)) {
      return;
    }
    activeConversationChannels.add(conversationId);
    originalSubscribe(conversationId);
  },
  unsubscribe: (conversationId: string) => {
    const s = useChatThreadStore.getState();
    s.unsubscribe(conversationId as any); // will be overwritten next line
  },
} as any);

// Properly override unsubscribe to remove from module guard and state
const baseUnsubscribe = (conversationId: string) => {
  const u = useChatThreadStore.getState().unsubByConv[conversationId];
  if (u) {
    try { u(); } catch {}
  }
  activeConversationChannels.delete(conversationId);
  useChatThreadStore.setState((s) => ({
    unsubByConv: { ...s.unsubByConv, [conversationId]: undefined as any },
    activeSubs: { ...s.activeSubs, [conversationId]: false },
  }));
};
useChatThreadStore.setState({ unsubscribe: baseUnsubscribe } as any);


