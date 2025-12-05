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
      
      
      // Fetch receipts for messages in this conversation
      if (userId) {
        const messageIds = list.map((m: any) => m.id).filter(Boolean);
        if (messageIds.length > 0) {
          const { data: receipts } = await supabase
            .from("message_receipts")
            .select("messageId, status")
            .in("messageId", messageIds)
            .neq("userId", userId); // Get receipts from other users
          
          // Map receipts to messages
          const receiptMap = new Map(receipts?.map(r => [r.messageId, r.status]) || []);
          list.forEach((m: any) => {
            m.receiptStatus = receiptMap.get(m.id) || 'DELIVERED';
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
    
    
    // Fetch receipts for older messages
    if (userId) {
      const messageIds = older.map((m: any) => m.id).filter(Boolean);
      if (messageIds.length > 0) {
        const { data: receipts } = await supabase
          .from("message_receipts")
          .select("messageId, status")
          .in("messageId", messageIds)
          .neq("userId", userId);
        
        const receiptMap = new Map(receipts?.map(r => [r.messageId, r.status]) || []);
        older.forEach((m: any) => {
          m.receiptStatus = receiptMap.get(m.id) || 'DELIVERED';
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
      content: text || mediaUrl || "",
      messageType: type,
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
        
        // Fetch receipt status for this message if current user is available
        const currentUserId = get().currentUserId || userId;
        if (currentUserId && row.senderId === currentUserId) {
          const { data: receipt } = await supabase
            .from("message_receipts")
            .select("status")
            .eq("messageId", row.id)
            .neq("userId", currentUserId)
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
    const receiptChannel = supabase
      .channel(`receipts-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message_receipts",
        },
        (payload) => {
          const { messageId, status } = payload.new as any;
          // Update the receipt status for this message
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
        (payload) => {
          const updatedMessage = payload.new as any;
          const currentUserId = get().currentUserId || userId;
          
          // Update the message with new data (including isRead)
          // If message is now read AND it was sent BY current user, update receiptStatus too
          set((s) => {
            const messages = s.messagesByConv[conversationId] || [];
            const updated = messages.map((m: any) => {
              if (m.id === updatedMessage.id) {
                const newData: any = { ...m, isRead: updatedMessage.isRead };
                // If this message was SENT by me and it's now read, update receiptStatus
                if (updatedMessage.isRead && m.senderId === currentUserId) {
                  newData.receiptStatus = 'READ';
                }
                return newData;
              }
              return m;
            });
            return {
              messagesByConv: { ...s.messagesByConv, [conversationId]: updated },
            };
          });
          saveJSON(KEY, { messagesByConv: get().messagesByConv });
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
    const list = get().messagesByConv[conversationId] || [];
    const newest = list[list.length - 1];
    if (newest?.id) await markReadUpTo(conversationId, userId, newest.id);
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
    const messages = get().messagesByConv[conversationId] || [];
    const messageIds = messages.map((m: any) => m.id).filter(Boolean);
    
    if (messageIds.length === 0) return;
    
    const { data: receipts } = await supabase
      .from("message_receipts")
      .select("messageId, status")
      .in("messageId", messageIds)
      .neq("userId", userId);
    
    const receiptMap = new Map(receipts?.map(r => [r.messageId, r.status]) || []);
    
    set((s) => {
      const updated = messages.map((m: any) => ({
        ...m,
        receiptStatus: receiptMap.get(m.id) || m.receiptStatus || 'DELIVERED',
      }));
      return {
        messagesByConv: { ...s.messagesByConv, [conversationId]: updated },
      };
    });
    saveJSON(KEY, { messagesByConv: get().messagesByConv });
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


