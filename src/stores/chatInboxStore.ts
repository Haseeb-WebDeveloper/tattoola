import { fetchConversationsPage, subscribeConversations } from "@/services/chat.service";
import { supabase } from "@/utils/supabase";
import { create } from "zustand";
import { loadJSON, saveJSON } from "./mmkv";

type Conversation = any;
type UserCache = Record<
  string,
  { id: string; username?: string; firstName?: string; lastName?: string; avatar?: string }
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
  conversationsById: loadJSON(KEY, { conversationsById: {}, order: [] }).conversationsById || {},
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

      set({ conversationsById: byId, order, cursor: nextCursor, loading: false, userCache });
      saveJSON(KEY, { conversationsById: byId, order });
    } catch (e: any) {
      set({ loading: false, error: e?.message || "Failed to load" });
    }
  },

  async loadMore(userId) {
    const cursor = get().cursor;
    if (!cursor) return;

    try {
      const { items, nextCursor } = await fetchConversationsPage(userId, cursor);
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
        c.peerName && c.peerName !== "Unknown" ? c.peerName : existing?.peerName || c.peerName,
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
          console.log("📊 conversation_users UPDATE", payload.new);

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
                const { enrichConversationForUser } = await import("@/services/chat.service");
                const enriched = enrichConversationForUser(data as any, userId);
                get().upsertConversation(enriched);
              }
            } catch (err) {
              console.error("Failed to load conversation", err);
            }
          } else {
            get().upsertConversation({ ...conv, unreadCount });
          }
        }
      )
      .subscribe();

    const combinedUnsub = () => {
      unsub();
      supabase.removeChannel(cuChannel);
    };

    set({
      unsubscribe: combinedUnsub,
      presenceUnsub: undefined,
      currentRealtimeUserId: userId,
    });

    console.log("📬 [INBOX REALTIME] Realtime setup complete for userId:", userId);
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

    set({ unsubscribe: undefined, presenceUnsub: undefined, currentRealtimeUserId: undefined });
  },
}));

export const useTotalUnreadCount = () =>
  useChatInboxStore((state) => {
    return Object.values(state.conversationsById).reduce((sum, conv) => {
      const unread = conv?.unreadCount || 0;
      return sum + (unread > 0 ? unread : 0);
    }, 0);
  });
