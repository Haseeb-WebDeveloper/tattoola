import {
  fetchConversationsPage,
  subscribeConversations,
} from "@/services/chat.service";
import { supabase } from "@/utils/supabase";
import { create } from "zustand";
import { loadJSON, saveJSON } from "./mmkv";

type Conversation = any;
type UserCache = Record<
  string,
  {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }
>;

type InboxState = {
  conversationsById: Record<string, Conversation>;
  order: string[];
  cursor?: { lastMessageAt: string; id: string };
  loading: boolean;
  error?: string | null;
  unsubscribe?: () => void;
  presenceUnsub?: () => void;
  currentRealtimeUserId?: string;
  userCache: UserCache;
  loadFirstPage(userId: string): Promise<void>;
  loadMore(userId: string): Promise<void>;
  upsertConversation(c: Conversation): void;
  startRealtime(userId: string): void;
  stopRealtime(): void;
};

const KEY = "inbox-cache-v1";

export const useChatInboxStore = create<InboxState>((set, get) => ({
  conversationsById:
    loadJSON(KEY, { conversationsById: {}, order: [] }).conversationsById || {},
  order: loadJSON(KEY, { conversationsById: {}, order: [] }).order || [],
  cursor: undefined,
  loading: false,
  error: null,
  unsubscribe: undefined,
  presenceUnsub: undefined,
  currentRealtimeUserId: undefined,
  userCache: {},

  async loadFirstPage(userId) {
    set({ loading: true, error: null });
    try {
      const { items, nextCursor } = await fetchConversationsPage(userId);
      const byId: Record<string, Conversation> = {};
      const order = items.map((c: any) => c.id);
      const userCache = { ...get().userCache };

      for (const c of items) {
        byId[c.id] = c;

        if (c.peerId && c.peerName) {
          userCache[c.peerId] = {
            id: c.peerId,
            username: c.peerName,
            firstName: c.peerName.split(" ")[0],
            lastName: c.peerName.split(" ")[1],
            avatar: c.peerAvatar,
          };
        }
      }

      set({
        conversationsById: byId,
        order,
        cursor: nextCursor,
        loading: false,
        userCache,
      });
      saveJSON(KEY, { conversationsById: byId, order });
    } catch (e: any) {
      set({ loading: false, error: e?.message || "Failed to load" });
    }
  },

  async loadMore(userId) {
    const cursor = get().cursor;
    if (!cursor) return;

    try {
      const { items, nextCursor } = await fetchConversationsPage(
        userId,
        cursor
      );
      const byId = { ...get().conversationsById };
      const addIds: string[] = [];

      for (const c of items) {
        byId[c.id] = c;
        addIds.push(c.id);
      }

      const order = [...get().order, ...addIds];
      set({ conversationsById: byId, order, cursor: nextCursor });
      saveJSON(KEY, { conversationsById: byId, order });
    } catch {}
  },

  upsertConversation(c) {
    const existing = get().conversationsById[c.id];
    const userCache = get().userCache;

    const merged = {
      ...(existing || {}),
      ...c,
      peerName:
        c.peerName && c.peerName !== "Unknown"
          ? c.peerName
          : existing?.peerName || c.peerName,
      peerAvatar: c.peerAvatar || existing?.peerAvatar,
      peerId: c.peerId || existing?.peerId,
    };

    if (merged.peerId && (!merged.peerName || merged.peerName === "Unknown")) {
      if (userCache[merged.peerId]) {
        const cached = userCache[merged.peerId];
        merged.peerName =
          `${cached.firstName || ""} ${cached.lastName || ""}`.trim() ||
          cached.username ||
          merged.peerName;

        merged.peerAvatar = cached.avatar || merged.peerAvatar;
      }
    }

    const byId = { ...get().conversationsById, [c.id]: merged };
    let order = get().order.filter((id) => id !== c.id);
    order = [c.id, ...order];

    set({ conversationsById: byId, order });
    saveJSON(KEY, { conversationsById: byId, order });
  },

  startRealtime(userId) {
    console.log("📬 [INBOX REALTIME] Starting realtime for userId:", userId);

    const current = get().currentRealtimeUserId;

    if (current === userId && get().unsubscribe) {
      return;
    }

    if (current && current !== userId) {
      get().stopRealtime();
    }

    const unsub = subscribeConversations(userId, {
      onInsert: (row) => get().upsertConversation(row),
      onUpdate: (row) => get().upsertConversation(row),
    });

    const cuChannel = supabase
      .channel(`conv-users-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_users",
          filter: `userId=eq.${userId}`,
        },
        async (payload) => {
          // console.log("📊 conversation_users UPDATE", payload.new);

          const { conversationId, unreadCount } = payload.new as any;
          const conv = get().conversationsById[conversationId];

          if (!conv) {
            console.log("🔄 Loading conversation into inbox", conversationId);

            try {
              const { data } = await supabase
                .from("conversations")
                .select(
                  `
                    id, artistId, loverId, status, lastMessageAt, lastMessageId, updatedAt,
                    artist:artistId ( id, username, firstName, lastName, avatar ),
                    lover:loverId   ( id, username, firstName, lastName, avatar ),
                    conversation_users ( userId, unreadCount, deletedAt ),
                    lastMessage:lastMessageId ( id, senderId, receiverId, content, messageType, createdAt, mediaUrl, isRead )
                  `
                )
                .eq("id", conversationId)
                .maybeSingle();

              if (data) {
                // Fetch receipt for the last message
                let lastMessageReceipt = null;
                if (data.lastMessage) {
                  const receiptUserId =
                    data.lastMessage.senderId === userId
                      ? data.lastMessage.receiverId
                      : userId;

                  const { data: receipt } = await supabase
                    .from("message_receipts")
                    .select("status")
                    .eq("messageId", data.lastMessageId)
                    .eq("userId", receiptUserId)
                    .maybeSingle();

                  lastMessageReceipt = receipt;
                }

                const { enrichConversationForUser } = await import(
                  "@/services/chat.service"
                );
                const enriched = enrichConversationForUser(
                  { ...data, lastMessageReceipt },
                  userId
                );
                get().upsertConversation(enriched);
              }
            } catch (err) {
              console.error("Failed to load conversation", err);
            }
          } else {
            // Conversation exists, update it with new unreadCount
            // Also refresh the conversation data to get the latest message
            try {
              const { data } = await supabase
                .from("conversations")
                .select(
                  `
                    id, artistId, loverId, status, lastMessageAt, lastMessageId, updatedAt,
                    artist:artistId ( id, username, firstName, lastName, avatar ),
                    lover:loverId   ( id, username, firstName, lastName, avatar ),
                    conversation_users ( userId, unreadCount, deletedAt ),
                    lastMessage:lastMessageId ( id, senderId, receiverId, content, messageType, createdAt, mediaUrl, isRead )
                  `
                )
                .eq("id", conversationId)
                .maybeSingle();

              if (data) {
                // Fetch receipt for the last message
                let lastMessageReceipt = null;
                if (data.lastMessage) {
                  const receiptUserId =
                    data.lastMessage.senderId === userId
                      ? data.lastMessage.receiverId
                      : userId;

                  const { data: receipt } = await supabase
                    .from("message_receipts")
                    .select("status")
                    .eq("messageId", data.lastMessageId)
                    .eq("userId", receiptUserId)
                    .maybeSingle();

                  lastMessageReceipt = receipt;
                }

                const { enrichConversationForUser } = await import(
                  "@/services/chat.service"
                );
                const enriched = enrichConversationForUser(
                  { ...data, lastMessageReceipt },
                  userId
                );
                get().upsertConversation(enriched);
              }
            } catch (err) {
              console.error("Failed to refresh conversation", err);
              // Fallback to just updating unreadCount
              get().upsertConversation({ ...conv, unreadCount });
            }
          }
        }
      )
      .subscribe();

    // RECEIPT UPDATES - Subscribe to message_receipts to update lastMessageIsRead in real-time
    const receiptChannel = supabase
      .channel(`inbox-receipts-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_receipts",
        },
        async (payload) => {
          const {
            messageId,
            status,
            userId: receiptUserId,
          } = payload.new as any;

          console.log(
            "📗 [INBOX] Receipt inserted - messageId:",
            messageId,
            "status:",
            status,
            "receiptUserId:",
            receiptUserId,
            "currentUserId:",
            userId
          );

          // Find which conversation this message belongs to
          const conversations = get().conversationsById;

          for (const [convId, conv] of Object.entries(conversations)) {
            // Check if this receipt is for the last message in this conversation
            if (conv.lastMessage?.id === messageId) {
              // Case 1: Current user SENT the message → check receipt for receiver
              if (
                conv.lastMessageSentByMe &&
                conv.lastMessage?.senderId === userId &&
                conv.lastMessage?.receiverId === receiptUserId
              ) {
                console.log(
                  "📗 [INBOX] ✅ Sender view - Receipt created for receiver"
                );
                get().upsertConversation({
                  ...conv,
                  lastMessageIsRead: status === "READ",
                });
                break;
              }

              // Case 2: Current user RECEIVED the message → receipt is for me
              if (
                !conv.lastMessageSentByMe &&
                conv.lastMessage?.receiverId === userId &&
                receiptUserId === userId
              ) {
                console.log(
                  "📗 [INBOX] ✅ Receiver view - Receipt created for me (new message arrived)"
                );
                get().upsertConversation({
                  ...conv,
                  lastMessageIsRead: status === "READ",
                });
                break;
              }
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message_receipts",
        },
        async (payload) => {
          const {
            messageId,
            status,
            userId: receiptUserId,
          } = payload.new as any;

          console.log(
            "📗 [INBOX] Receipt updated - messageId:",
            messageId,
            "status:",
            status,
            "receiptUserId:",
            receiptUserId,
            "currentUserId:",
            userId
          );

          // Find which conversation this message belongs to
          const conversations = get().conversationsById;

          for (const [convId, conv] of Object.entries(conversations)) {
            // Check if this receipt is for the last message in this conversation
            if (conv.lastMessage?.id === messageId) {
              // Case 1: Current user SENT the message → check if receiver read it
              if (
                conv.lastMessageSentByMe &&
                conv.lastMessage?.senderId === userId &&
                conv.lastMessage?.receiverId === receiptUserId
              ) {
                console.log(
                  "📗 [INBOX] ✅ Sender view - Receiver read message"
                );
                get().upsertConversation({
                  ...conv,
                  lastMessageIsRead: status === "READ",
                });
                break;
              }

              // Case 2: Current user RECEIVED the message → update if it's marked as read
              // (This handles when the receiver themselves reads their own messages)
              if (
                !conv.lastMessageSentByMe &&
                conv.lastMessage?.receiverId === userId &&
                receiptUserId === userId
              ) {
                console.log("📗 [INBOX] ✅ Receiver view - I read the message");
                get().upsertConversation({
                  ...conv,
                  lastMessageIsRead: status === "READ",
                });
                break;
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("📗 [INBOX] Receipt channel status:", status);
      });

    const combinedUnsub = () => {
      unsub();
      supabase.removeChannel(cuChannel);
      supabase.removeChannel(receiptChannel);
    };

    set({
      unsubscribe: combinedUnsub,
      presenceUnsub: undefined,
      currentRealtimeUserId: userId,
    });

    //console.log("📬 [INBOX REALTIME] Realtime setup complete for userId:", userId);
  },

  stopRealtime() {
    console.log("📬 [INBOX REALTIME] Stopping realtime...");

    const unsub = get().unsubscribe;
    if (unsub) {
      try {
        unsub();
      } catch (err) {
        console.error("Error unsubscribing:", err);
      }
    }

    set({
      unsubscribe: undefined,
      presenceUnsub: undefined,
      currentRealtimeUserId: undefined,
    });
  },
}));

export const useTotalUnreadCount = () =>
  useChatInboxStore((state) => {
    return Object.values(state.conversationsById).reduce((sum, conv) => {
      const unread = conv?.unreadCount || 0;
      return sum + (unread > 0 ? unread : 0);
    }, 0);
  });
