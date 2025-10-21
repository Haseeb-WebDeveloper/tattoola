import { fetchConversationsPage, subscribeConversations } from "@/services/chat.service";
import { supabase } from "@/utils/supabase";
import { create } from "zustand";
import { loadJSON, saveJSON } from "./mmkv";

type Conversation = any;
type UserCache = Record<string, { id: string; username?: string; firstName?: string; lastName?: string; avatar?: string }>;

type InboxState = {
  conversationsById: Record<string, Conversation>;
  order: string[]; // conversationIds sorted by lastMessageAt desc
  cursor?: { lastMessageAt: string; id: string };
  loading: boolean;
  error?: string | null;
  unsubscribe?: () => void;
  presenceUnsub?: () => void;
  currentRealtimeUserId?: string; // Track which user is currently subscribed
  userCache: UserCache; // Cache user data to prevent "Unknown" issues
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
      const userCache: UserCache = { ...get().userCache };
      
      for (const c of items) {
        byId[c.id] = c;
        // Cache peer user data
        if (c.peerId && c.peerName) {
          userCache[c.peerId] = {
            id: c.peerId,
            username: c.peerName,
            firstName: c.peerName.split(' ')[0],
            lastName: c.peerName.split(' ')[1],
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
    
    // Preserve existing peer data if new data is incomplete
    const merged = {
      ...(existing || {}),
      ...c,
      // Never overwrite good peer data with "Unknown" or empty
      peerName: c.peerName && c.peerName !== "Unknown" ? c.peerName : (existing?.peerName || c.peerName),
      peerAvatar: c.peerAvatar || existing?.peerAvatar,
      peerId: c.peerId || existing?.peerId,
    };
    
    // If peer data is still missing/incomplete, try to get from cache
    if (merged.peerId && (!merged.peerName || merged.peerName === "Unknown") && userCache[merged.peerId]) {
      const cached = userCache[merged.peerId];
      merged.peerName = `${cached.firstName || ''} ${cached.lastName || ''}`.trim() || cached.username || merged.peerName;
      merged.peerAvatar = cached.avatar || merged.peerAvatar;
    }
    
    const byId = { ...get().conversationsById, [c.id]: merged };
    let order = get().order.filter((id) => id !== c.id);
    // push to top
    order = [c.id, ...order];
    set({ conversationsById: byId, order });
    saveJSON(KEY, { conversationsById: byId, order });
  },
  startRealtime(userId) {
    console.log("📬 [INBOX REALTIME] Starting realtime for userId:", userId);
    
    // Guard: if already subscribed for the same user, skip
    const currentUserId = get().currentRealtimeUserId;
    if (currentUserId === userId && get().unsubscribe) {
      console.log("📬 [INBOX REALTIME] Already subscribed for this user, skipping...");
      return;
    }
    
    // Only stop if different user or not initialized
    if (currentUserId && currentUserId !== userId) {
      console.log("📬 [INBOX REALTIME] Different user detected, stopping old realtime...");
      get().stopRealtime();
    }
    
    const unsub = subscribeConversations(userId, {
      onInsert: (row) => get().upsertConversation(row),
      onUpdate: (row) => get().upsertConversation(row),
    });
    
    // Subscribe to conversation_users changes to update unread counts
    // Note: Conversations always stay in inbox, deletedAt only affects message filtering
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
            // Conversation not in store, fetch and add it
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
            } catch (e) {
              console.error("Failed to load conversation", e);
            }
          } else {
            // Conversation exists, just update it
            console.log("🔄 Updating conversation", conversationId);
            get().upsertConversation({ ...conv, unreadCount });
          }
        }
      )
      .subscribe();
    
    const combinedUnsub = () => {
      unsub();
      supabase.removeChannel(cuChannel);
    };
    
    set({ unsubscribe: combinedUnsub, presenceUnsub: undefined, currentRealtimeUserId: userId });
    console.log("📬 [INBOX REALTIME] Realtime setup complete for userId:", userId);
  },
  stopRealtime() {
    console.log("📬 [INBOX REALTIME] Stopping realtime...");
    const u = get().unsubscribe;
    if (u) {
      console.log("📬 [INBOX REALTIME] Unsubscribing from conversations...");
      try { u(); } catch (e) {
        console.error("📬 [INBOX REALTIME] Error unsubscribing conversations:", e);
      }
    }
    set({ unsubscribe: undefined, presenceUnsub: undefined, currentRealtimeUserId: undefined });
    console.log("📬 [INBOX REALTIME] Realtime stopped");
  },
}));


