import { fetchMessagesPage, getTypingChannel, markReadUpTo, sendMessage, subscribeMessages } from "@/services/chat.service";
import { MessageType } from "@/types/chat";
import { supabase } from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { loadJSON, saveJSON } from "./mmkv";

type Message = any;

type ThreadState = {
  messagesByConv: Record<string, Message[]>;
  cursors: Record<string, { createdAt: string; id: string } | undefined>;
  loadingByConv: Record<string, boolean>;
  typingPeers: Record<string, boolean>;
  unsubByConv: Record<string, () => void>;
  activeSubs: Record<string, boolean>;
  seenMessageIds: Record<string, Record<string, boolean>>;
  currentUserId?: string;
  loadLatest(conversationId: string, userId?: string): Promise<void>;
  loadOlder(conversationId: string, userId?: string): Promise<void>;
  optimisticSend(params: { conversationId: string; senderId: string; type: MessageType; text?: string; mediaUrl?: string }): Promise<{ tempId: string }>;
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

  
  // LOAD LATEST
  
  async loadLatest(conversationId, userId) {
    set((s) => ({ loadingByConv: { ...s.loadingByConv, [conversationId]: true }, currentUserId: userId }));

    try {
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
      const list = (items || []).slice().reverse();

      list.forEach((m: any) => {
        if (m.messageType && !m.type) m.type = m.messageType;
      });

      if (userId) {
        const sentMessageIds = list.filter((m) => m.senderId === userId).map((m) => m.id);

        if (sentMessageIds.length > 0) {
          const { data: receipts } = await supabase
            .from("message_receipts")
            .select("messageId, status, userId")
            .in("messageId", sentMessageIds);

          const messageReceiverMap = new Map(list.filter((m) => m.senderId === userId).map((m) => [m.id, m.receiverId]));

          const validReceipts = (receipts || []).filter((r) => {
            const receiverId = messageReceiverMap.get(r.messageId);
            return receiverId && r.userId === receiverId;
          });

          const receiptMap = new Map(validReceipts.map((r) => [r.messageId, r.status]));

          list.forEach((m) => {
            m.receiptStatus = m.senderId === userId ? receiptMap.get(m.id) || "DELIVERED" : "DELIVERED";
          });
        }
      }

      const seen: Record<string, boolean> = {};
      list.forEach((m) => (m.id ? (seen[m.id] = true) : null));

      set((s) => ({
        messagesByConv: { ...s.messagesByConv, [conversationId]: list },
        cursors: { ...s.cursors, [conversationId]: nextCursor },
        loadingByConv: { ...s.loadingByConv, [conversationId]: false },
        seenMessageIds: { ...s.seenMessageIds, [conversationId]: seen },
      }));

      saveJSON(KEY, { messagesByConv: get().messagesByConv });
    } catch (e) {
      set((s) => ({ loadingByConv: { ...s.loadingByConv, [conversationId]: false } }));
    }
  },

  
  // LOAD OLDER
  
  async loadOlder(conversationId, userId) {
    const cursor = get().cursors[conversationId];
    if (!cursor) return;

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

    older.forEach((m) => {
      if (m.messageType && !m.type) m.type = m.messageType;
    });

    if (userId) {
      const sentMessageIds = older.filter((m) => m.senderId === userId).map((m) => m.id);

      if (sentMessageIds.length > 0) {
        const { data: receipts } = await supabase
          .from("message_receipts")
          .select("messageId, status, userId")
          .in("messageId", sentMessageIds);

        const messageReceiverMap = new Map(
          older.filter((m) => m.senderId === userId).map((m) => [m.id, m.receiverId])
        );

        const validReceipts = (receipts || []).filter((r) => {
          const receiverId = messageReceiverMap.get(r.messageId);
          return receiverId && r.userId === receiverId;
        });

        const receiptMap = new Map(validReceipts.map((r) => [r.messageId, r.status]));

        older.forEach((m) => {
          m.receiptStatus = m.senderId === userId ? receiptMap.get(m.id) || "DELIVERED" : "DELIVERED";
        });
      }
    }

    set((s) => {
      const existing = s.messagesByConv[conversationId] || [];
      const existingIds = new Set(existing.map((m) => m.id));

      const newMessages = older.filter((m) => !existingIds.has(m.id));

      const seen = { ...(s.seenMessageIds[conversationId] || {}) };
      newMessages.forEach((m) => (m.id ? (seen[m.id] = true) : null));

      return {
        messagesByConv: { ...s.messagesByConv, [conversationId]: [...newMessages, ...existing] },
        cursors: { ...s.cursors, [conversationId]: nextCursor },
        seenMessageIds: { ...s.seenMessageIds, [conversationId]: seen },
      };
    });

    saveJSON(KEY, { messagesByConv: get().messagesByConv });
  },

  
  // OPTIMISTIC SEND
  
  async optimisticSend({ conversationId, senderId, type, text, mediaUrl }) {
    const clientId = uuidv4();
    const temp: any = {
      id: clientId,
      conversationId,
      senderId,
      content: text || "",
      messageType: type,
      type,
      mediaUrl: mediaUrl || null,
      createdAt: new Date().toISOString(),
      _optimistic: true,
      receiptStatus: "DELIVERED",
    };

    set((s) => {
      const existing = s.messagesByConv[conversationId] || [];
      const updated = [...existing, temp];
      const seen = s.seenMessageIds[conversationId] || {};

      return {
        messagesByConv: { ...s.messagesByConv, [conversationId]: updated },
        seenMessageIds: { ...s.seenMessageIds, [conversationId]: { ...seen, [clientId]: true } },
      };
    });

    saveJSON(KEY, { messagesByConv: get().messagesByConv });

    try {
      await sendMessage({ id: clientId, conversationId, senderId, type, text, mediaUrl });
    } catch {}

    return { tempId: clientId };
  },

  // CONFIRM SEND
  confirmSend(conversationId, tempId, serverRow) {
    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [conversationId]: s.messagesByConv[conversationId].map((m) =>
          m.id === tempId ? { ...serverRow, _optimistic: false } : m
        ),
      },
    }));

    saveJSON(KEY, { messagesByConv: get().messagesByConv });
  },

  
  // SUBSCRIBE
  
  subscribe(conversationId, userId) {
    if (get().activeSubs[conversationId]) return;

    set((s) => ({ activeSubs: { ...s.activeSubs, [conversationId]: true } }));

    // INSERT EVENTS
    const unsub = subscribeMessages(conversationId, {
      onInsert: async (row) => {
        const seen = get().seenMessageIds[conversationId] || {};
        if (row.id && seen[row.id]) return;

        const existing = get().messagesByConv[conversationId] || [];
        if (existing.some((m) => m.id === row.id)) {
          set((s) => ({
            seenMessageIds: {
              ...s.seenMessageIds,
              [conversationId]: { ...(s.seenMessageIds[conversationId] || {}), [row.id]: true },
            },
          }));
          return;
        }

        if (row.messageType && !row.type) row.type = row.messageType;

        const currentUserId = get().currentUserId || userId;
        if (currentUserId && row.senderId === currentUserId) {
          const { data: receipt } = await supabase
            .from("message_receipts")
            .select("status, userId")
            .eq("messageId", row.id)
            .eq("userId", row.receiverId)
            .maybeSingle();

          row.receiptStatus = receipt?.status || "DELIVERED";
        } else {
          row.receiptStatus = "DELIVERED";
        }

        set((s) => {
          const nextSeen = { ...(s.seenMessageIds[conversationId] || {}), [row.id]: true };
          const messages = s.messagesByConv[conversationId] || [];
          return {
            messagesByConv: { ...s.messagesByConv, [conversationId]: [...messages, row] },
            seenMessageIds: { ...s.seenMessageIds, [conversationId]: nextSeen },
          };
        });

        saveJSON(KEY, { messagesByConv: get().messagesByConv });
      },
    });

    // RECEIPT UPDATES
    // RECEIPT UPDATES - Subscribe globally but filter locally
    const receiptChannel = supabase
      .channel(`receipts-${conversationId}-${Date.now()}`) // Add timestamp to avoid conflicts
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message_receipts",
        },
        async (payload) => {
          const { messageId, status, userId: receiptUserId } = payload.new;
          const currentUserId = get().currentUserId || userId;
    
          const messages = get().messagesByConv[conversationId] || [];
          const message = messages.find((m) => m.id === messageId);
    
          // Check if this receipt belongs to a message in this conversation
          if (message && message.conversationId === conversationId && message.senderId === currentUserId) {
            console.log("📗 Receipt updated in real-time:", messageId, status);
            
            set((s) => ({
              messagesByConv: {
                ...s.messagesByConv,
                [conversationId]: messages.map((m) =>
                  m.id === messageId ? { ...m, receiptStatus: status } : m
                ),
              },
            }));
    
            saveJSON(KEY, { messagesByConv: get().messagesByConv });
            return;
          }
    
          // If message not found in memory, verify it belongs to this conversation
          if (!message) {
            const { data: msgData } = await supabase
              .from("messages")
              .select("id, conversationId, senderId")
              .eq("id", messageId)
              .eq("conversationId", conversationId)
              .maybeSingle();
    
            if (msgData && msgData.senderId === currentUserId) {
              console.log("📗 Receipt updated for message not in memory, refreshing...");
              get().refreshReceipts(conversationId, currentUserId);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Receipt channel status:", status);
      });

    // MESSAGE UPDATES (isRead changes)
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
          const updatedMessage = payload.new;

          set((s) => {
            const messages = s.messagesByConv[conversationId] || [];
            return {
              messagesByConv: {
                ...s.messagesByConv,
                [conversationId]: messages.map((m) =>
                  m.id === updatedMessage.id ? { ...m, isRead: updatedMessage.isRead } : m
                ),
              },
            };
          });

          saveJSON(KEY, { messagesByConv: get().messagesByConv });

          if (updatedMessage.isRead) {
            const messages = get().messagesByConv[conversationId] || [];
            const msg = messages.find((m) => m.id === updatedMessage.id);
            const currentUserId = get().currentUserId || userId;

            if (msg && msg.senderId === currentUserId) {
              const { data: receipt } = await supabase
                .from("message_receipts")
                .select("status")
                .eq("messageId", msg.id)
                .eq("userId", msg.receiverId)
                .maybeSingle();

              if (receipt) {
                set((s) => ({
                  messagesByConv: {
                    ...s.messagesByConv,
                    [conversationId]: messages.map((m) =>
                      m.id === msg.id ? { ...m, receiptStatus: receipt.status } : m
                    ),
                  },
                }));
                saveJSON(KEY, { messagesByConv: get().messagesByConv });
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

    set((s) => ({
      unsubByConv: { ...s.unsubByConv, [conversationId]: combinedUnsub },
    }));
  },

  
  // UNSUBSCRIBE
  
  unsubscribe(conversationId) {
    const u = get().unsubByConv[conversationId];
    if (u) {
      try {
        u();
      } catch {}
    }

    set((s) => ({
      unsubByConv: { ...s.unsubByConv, [conversationId]: undefined },
      activeSubs: { ...s.activeSubs, [conversationId]: false },
    }));
  },

  
  // MARK READ
  
  async markRead(conversationId, userId) {
    const list = get().messagesByConv[conversationId] || [];
    const newest = list[list.length - 1];

    if (newest?.id) {
      await markReadUpTo(conversationId, userId, newest.id);
      setTimeout(() => {
        get().refreshReceipts(conversationId, userId);
      }, 500);
    }
  },

  
  // TYPING
  
  setTyping(conversationId, isTyping) {
    const channel = getTypingChannel(conversationId);
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED" && isTyping) {
        await channel.track({ typing: true, at: Date.now() });
        setTimeout(() => channel.untrack(), 3000);
      }
    });
  },

  
  // REFRESH RECEIPTS
  
  async refreshReceipts(conversationId, userId) {
    const messages = get().messagesByConv[conversationId] || [];

    const ids = messages.filter((m) => m.senderId === userId).map((m) => m.id);

    const { data: receipts } = await supabase
      .from("message_receipts")
      .select("messageId, status, userId")
      .in("messageId", ids);

    const messageReceiverMap = new Map(
      messages.filter((m) => m.senderId === userId).map((m) => [m.id, m.receiverId])
    );

    const valid = (receipts || []).filter((r) => {
      const receiverId = messageReceiverMap.get(r.messageId);
      return receiverId && r.userId === receiverId;
    });

    const receiptMap = new Map(valid.map((r) => [r.messageId, r.status]));

    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [conversationId]: messages.map((m) =>
          m.senderId === userId ? { ...m, receiptStatus: receiptMap.get(m.id) || "DELIVERED" } : m
        ),
      },
    }));

    saveJSON(KEY, { messagesByConv: get().messagesByConv });
  },
}));


// STRICT MODE DOUBLE-SUB FIX

const activeConversationChannels = new Set<string>();

const originalSubscribe = useChatThreadStore.getState().subscribe;

useChatThreadStore.setState({
  subscribe: (conversationId: string) => {
    if (activeConversationChannels.has(conversationId)) return;
    activeConversationChannels.add(conversationId);
    originalSubscribe(conversationId);
  },
} as any);

const baseUnsubscribe = (conversationId: string) => {
  const u = useChatThreadStore.getState().unsubByConv[conversationId];
  if (u) {
    try {
      u();
    } catch {}
  }

  activeConversationChannels.delete(conversationId);

  useChatThreadStore.setState((s) => ({
    unsubByConv: { ...s.unsubByConv, [conversationId]: undefined },
    activeSubs: { ...s.activeSubs, [conversationId]: false },
  }));
};

useChatThreadStore.setState({ unsubscribe: baseUnsubscribe } as any);
