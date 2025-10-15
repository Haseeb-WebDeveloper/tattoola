import { fetchConversationsPage, subscribeConversations } from "@/services/chat.service";
import { create } from "zustand";
import { loadJSON, saveJSON } from "./mmkv";

type Conversation = any;

type InboxState = {
  conversationsById: Record<string, Conversation>;
  order: string[]; // conversationIds sorted by lastMessageAt desc
  cursor?: { lastMessageAt: string; id: string };
  loading: boolean;
  error?: string | null;
  unsubscribe?: () => void;
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
  async loadFirstPage(userId) {
    set({ loading: true, error: null });
    try {
      const { items, nextCursor } = await fetchConversationsPage(userId);
      const byId: Record<string, Conversation> = {};
      const order = items.map((c: any) => c.id);
      for (const c of items) byId[c.id] = c;
      set({ conversationsById: byId, order, cursor: nextCursor, loading: false });
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
    const byId = { ...get().conversationsById, [c.id]: { ...(get().conversationsById[c.id] || {}), ...c } };
    let order = get().order.filter((id) => id !== c.id);
    // push to top
    order = [c.id, ...order];
    set({ conversationsById: byId, order });
    saveJSON(KEY, { conversationsById: byId, order });
  },
  startRealtime(userId) {
    get().stopRealtime();
    const unsub = subscribeConversations(userId, {
      onInsert: (row) => get().upsertConversation(row),
      onUpdate: (row) => get().upsertConversation(row),
    });
    set({ unsubscribe: unsub });
  },
  stopRealtime() {
    const u = get().unsubscribe;
    if (u) {
      try { u(); } catch {}
    }
    set({ unsubscribe: undefined });
  },
}));


