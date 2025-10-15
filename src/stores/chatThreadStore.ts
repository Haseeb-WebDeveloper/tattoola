import { fetchMessagesPage, getTypingChannel, markReadUpTo, sendMessage, subscribeMessages } from "@/services/chat.service";
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
  loadLatest(conversationId: string): Promise<void>;
  loadOlder(conversationId: string): Promise<void>;
  optimisticSend(params: { conversationId: string; senderId: string; type: string; text?: string; mediaUrl?: string }): Promise<{ tempId: string }>;
  confirmSend(conversationId: string, tempId: string, serverRow?: any): void;
  subscribe(conversationId: string): void;
  unsubscribe(conversationId: string): void;
  markRead(conversationId: string, userId: string): Promise<void>;
  setTyping(conversationId: string, isTyping: boolean): void;
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
  async loadLatest(conversationId) {
    set((s) => ({ loadingByConv: { ...s.loadingByConv, [conversationId]: true } }));
    try {
      const { items, nextCursor } = await fetchMessagesPage(conversationId);
      const list = (items || []).slice().reverse();
      set((s) => ({
        messagesByConv: { ...s.messagesByConv, [conversationId]: list },
        cursors: { ...s.cursors, [conversationId]: nextCursor },
        loadingByConv: { ...s.loadingByConv, [conversationId]: false },
      }));
      saveJSON(KEY, { messagesByConv: get().messagesByConv });
    } catch {
      set((s) => ({ loadingByConv: { ...s.loadingByConv, [conversationId]: false } }));
    }
  },
  async loadOlder(conversationId) {
    const cursor = get().cursors[conversationId];
    if (!cursor) return;
    const { items, nextCursor } = await fetchMessagesPage(conversationId, cursor);
    const older = (items || []).slice().reverse();
    set((s) => ({
      messagesByConv: { ...s.messagesByConv, [conversationId]: [...(s.messagesByConv[conversationId] || []), ...older] },
      cursors: { ...s.cursors, [conversationId]: nextCursor },
    }));
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
    };
    set((s) => ({
      messagesByConv: { ...s.messagesByConv, [conversationId]: [temp, ...(s.messagesByConv[conversationId] || [])].sort((a: any,b: any)=> (a.createdAt > b.createdAt ? 1 : -1)) },
    }));
    saveJSON(KEY, { messagesByConv: get().messagesByConv });
    console.log("store: optimistic queued", clientId);
    try {
      await sendMessage({ id: clientId, conversationId, senderId, type: type as any, text, mediaUrl });
      console.log("store: sendMessage OK");
    } catch (e) {
      console.log("store: sendMessage FAIL", e);
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
  subscribe(conversationId) {
    // Guard: if already subscribed (or in-flight), do nothing
    if (get().activeSubs[conversationId]) {
      console.log("store: subscribe skipped (already active)", conversationId);
      return;
    }
    set((s) => ({ activeSubs: { ...s.activeSubs, [conversationId]: true } }));
    console.log("store: subscribing", conversationId);
    const unsub = subscribeMessages(conversationId, {
      onInsert: (row) => {
        console.log("store: onInsert message", row?.id);
        set((s) => {
          const seen = s.seenMessageIds[conversationId] || {};
          if (row?.id && seen[row.id]) {
            console.log("store: drop duplicate message", row.id);
            return {} as any;
          }
          const nextSeen = { ...seen };
          if (row?.id) nextSeen[row.id] = true;
          const existing = s.messagesByConv[conversationId] || [];
          const idx = existing.findIndex((m: any) => m.id === row.id);
          let next: any[];
          if (idx !== -1) {
            // Replace optimistic with server-confirmed
            next = existing.slice();
            next[idx] = { ...existing[idx], ...row, _optimistic: false };
          } else {
            next = [...existing, row];
          }
          next.sort((a: any, b: any) => (a.createdAt > b.createdAt ? 1 : -1));
          return {
            messagesByConv: { ...s.messagesByConv, [conversationId]: next },
            seenMessageIds: { ...s.seenMessageIds, [conversationId]: nextSeen },
          } as any;
        });
        saveJSON(KEY, { messagesByConv: get().messagesByConv });
      },
    });
    set((s) => ({ unsubByConv: { ...s.unsubByConv, [conversationId]: unsub } }));
  },
  unsubscribe(conversationId) {
    const u = get().unsubByConv[conversationId];
    if (u) {
      try { u(); } catch {}
      console.log("store: unsubscribed", conversationId);
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
}));

// Module-level guard to prevent double realtime subscriptions in dev StrictMode
const activeConversationChannels = new Set<string>();

// Monkey-patch subscribe to also use module-level guard
const originalSubscribe = useChatThreadStore.getState().subscribe;
useChatThreadStore.setState({
  subscribe: (conversationId: string) => {
    if (activeConversationChannels.has(conversationId)) {
      console.log("store: subscribe skipped (module guard)", conversationId);
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
  console.log("store: unsubscribed (module guard)", conversationId);
};
useChatThreadStore.setState({ unsubscribe: baseUnsubscribe } as any);


