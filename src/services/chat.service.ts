import { supabase } from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";

export type MessageType =
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "FILE"
  | "SYSTEM"
  | "INTAKE_QUESTION"
  | "INTAKE_ANSWER";

export type ConversationStatus =
  | "REQUESTED"
  | "ACTIVE"
  | "REJECTED"
  | "BLOCKED"
  | "CLOSED";

export async function createPrivateRequestConversation(
  loverId: string,
  artistId: string,
  intake: {
    size?: string;
    color?: string;
    desc?: string;
    isAdult?: boolean;
    references?: string[]; // cloudinary urls
  }
): Promise<{ conversationId: string }> {
  const conversationId = uuidv4();

  console.log("createPrivateRequestConversation", loverId, artistId, intake);

  // Insert conversation
  const now = new Date().toISOString();
  const { error: convErr } = await supabase.from("conversations").insert({
    id: conversationId,
    artistId,
    loverId,
    status: "REQUESTED",
    requestedBy: loverId,
    createdAt: now,
    updatedAt: now,
  });
  if (convErr) throw new Error(convErr.message);

  console.log("conversation inserted");

  // Conversation users
  const { error: cuErr } = await supabase.from("conversation_users").insert([
    {
      id: uuidv4(),
      conversationId,
      userId: loverId,
      role: "LOVER",
      canSend: false,
    },
    {
      id: uuidv4(),
      conversationId,
      userId: artistId,
      role: "ARTIST",
      canSend: true,
    },
  ]);
  if (cuErr) throw new Error(cuErr.message);

  console.log("conversation users inserted");

  // Intake record
  const { error: intakeErr } = await supabase
    .from("conversation_intakes")
    .insert({
      id: uuidv4(),
      conversationId,
      createdByUserId: loverId,
      schemaVersion: "v1",
      questions: {
        size: "Approximately what size would you like the tattoo to be?",
        references:
          "Can you post some examples of tattoos that resemble the result you'd like?",
        color: "Would you like a color or black and white tattoo?",
        description: "Describe your tattoo design in brief",
        age: "Potresti confermare la tua età?",
      },
      answers: {
        size: intake.size || null,
        references: intake.references || [],
        color: intake.color || null,
        description: intake.desc || null,
        isAdult: !!intake.isAdult,
      },
    });
  if (intakeErr) throw new Error(intakeErr.message);

  console.log("intake record inserted");

  // Synthesize intake messages for continuity
  const msgs: any[] = [];
  const pushQA = (qKey: string, qText: string, aText?: string) => {
    msgs.push({
      id: uuidv4(),
      conversationId,
      senderId: artistId, // render as from artist for question
      receiverId: loverId,
      content: qText,
      messageType: "INTAKE_QUESTION",
      createdAt: now,
      updatedAt: now,
    });
    if (aText) {
      msgs.push({
        id: uuidv4(),
        conversationId,
        senderId: loverId,
        receiverId: artistId,
        content: aText,
        messageType: "INTAKE_ANSWER",
        createdAt: now,
        updatedAt: now,
        intakeFieldKey: qKey,
      });
    }
  };
  pushQA(
    "size",
    "Approximately what size would you like the tattoo to be?",
    intake.size
  );
  // References: one question, then one answer per media with mediaUrl
  msgs.push({
    id: uuidv4(),
    conversationId,
    senderId: artistId,
    receiverId: loverId,
    content:
      "Can you post some examples of tattoos that resemble the result you'd like?",
    messageType: "INTAKE_QUESTION",
    createdAt: now,
    updatedAt: now,
  });
  for (const ref of intake.references || []) {
    msgs.push({
      id: uuidv4(),
      conversationId,
      senderId: loverId,
      receiverId: artistId,
      content: "",
      messageType: "INTAKE_ANSWER",
      mediaUrl: ref,
      createdAt: now,
      updatedAt: now,
      intakeFieldKey: "references",
    });
  }
  pushQA(
    "color",
    "Would you like a color or black and white tattoo?",
    intake.color
  );
  pushQA("description", "Describe your tattoo design in brief", intake.desc);
  pushQA(
    "age",
    "Potresti confermare la tua età?",
    intake.isAdult ? "+18" : "-18"
  );

  console.log("intake messages inserted");

  let lastMessageId: string | null = null;
  if (msgs.length) {
    const { error: mErr } = await supabase.from("messages").insert(msgs);
    if (mErr) throw new Error(mErr.message);
    lastMessageId = msgs[msgs.length - 1]?.id || null;
  }

  // Update conversation aggregates
  const { error: aggErr } = await supabase
    .from("conversations")
    .update({ lastMessageAt: now, lastMessageId, updatedAt: now })
    .eq("id", conversationId);
  if (aggErr) throw new Error(aggErr.message);

  console.log("messages inserted");

  return { conversationId };
}

export async function acceptConversation(
  artistId: string,
  conversationId: string
) {
  const { error } = await supabase
    .from("conversations")
    .update({ status: "ACTIVE" })
    .eq("id", conversationId)
    .eq("artistId", artistId);
  if (error) throw new Error(error.message);

  // enable lover canSend, keep artist row as-is
  const { error: cuErr } = await supabase
    .from("conversation_users")
    .update({ canSend: true })
    .eq("conversationId", conversationId)
    .not("userId", "eq", artistId);
  if (cuErr) throw new Error(cuErr.message);

  // system message
  const { error: mErr } = await supabase.from("messages").insert({
    id: uuidv4(),
    conversationId,
    senderId: artistId,
    messageType: "SYSTEM",
    content: "Request accepted",
  });
  if (mErr) throw new Error(mErr.message);
}

export async function rejectConversation(
  artistId: string,
  conversationId: string
) {
  const { error } = await supabase
    .from("conversations")
    .update({ status: "REJECTED" })
    .eq("id", conversationId)
    .eq("artistId", artistId);
  if (error) throw new Error(error.message);
  const { error: mErr } = await supabase.from("messages").insert({
    id: uuidv4(),
    conversationId,
    senderId: artistId,
    messageType: "SYSTEM",
    content: "Request rejected",
  });
  if (mErr) throw new Error(mErr.message);
}

export async function fetchConversationsPage(
  userId: string,
  cursor?: { lastMessageAt: string; id: string }
) {
  let q = supabase
    .from("conversations")
    .select(
      `
      id, artistId, loverId, status, lastMessageAt, lastMessageId, updatedAt,
      artist:artistId ( id, username, firstName, lastName, avatar ),
      lover:loverId   ( id, username, firstName, lastName, avatar ),
      conversation_users ( userId, unreadCount )
    `
    )
    .or(`artistId.eq.${userId},loverId.eq.${userId}`)
    .in("status", ["REQUESTED", "ACTIVE"] as any)
    .order("lastMessageAt", { ascending: false, nullsFirst: false })
    .limit(20);
  if (cursor) {
    q = q.lt("lastMessageAt", cursor.lastMessageAt as any);
  }
  const { data, error } = (await q) as any;
  if (error) throw new Error(error.message);
  const nextCursor =
    data && data.length === 20
      ? {
          lastMessageAt: data[data.length - 1]?.lastMessageAt,
          id: data[data.length - 1]?.id,
        }
      : undefined;
  const items = (data || []).map((c: any) =>
    enrichConversationForUser(c, userId)
  );
  return { items, nextCursor };
}

export async function fetchMessagesPage(
  conversationId: string,
  cursor?: { createdAt: string; id: string }
) {
  let q = supabase
    .from("messages")
    .select("*")
    .eq("conversationId", conversationId)
    .order("createdAt", { ascending: false })
    .limit(50);
  if (cursor) {
    q = q.lt("createdAt", cursor.createdAt as any);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const nextCursor =
    data && data.length === 50
      ? {
          createdAt: data[data.length - 1]?.createdAt,
          id: data[data.length - 1]?.id,
        }
      : undefined;
  return { items: data || [], nextCursor };
}

export async function sendMessage(m: {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  thumbUrl?: string;
  replyToMessageId?: string;
}) {
  const now = new Date().toISOString();
  let receiverId = m.receiverId;
  try {
    if (!receiverId) {
      const { data: conv, error: convErr } = await supabase
        .from("conversations")
        .select("id, artistId, loverId")
        .eq("id", m.conversationId)
        .maybeSingle();
      if (convErr) throw convErr;
      if (!conv) throw new Error("Conversation not found");
      receiverId = m.senderId === conv.artistId ? conv.loverId : conv.artistId;
    }
  } catch (e) {
    console.log("sendMessage resolve receiver failed", e);
    throw e;
  }
  const payload: any = {
    id: m.id || uuidv4(), // idempotent: caller now always passes a stable client id
    conversationId: m.conversationId,
    senderId: m.senderId,
    receiverId,
    content: m.text || "",
    messageType: m.type,
    replyToMessageId: m.replyToMessageId || null,
    createdAt: now,
    updatedAt: now,
    mediaUrl: m.mediaUrl || null,
  };
  const { error } = await supabase.from("messages").insert(payload);
  if (error) {
    console.log("sendMessage insert failed", error);
    throw new Error(error.message);
  }

  // Best-effort aggregates and receipts
  try {
    await supabase.from("message_receipts").insert({
      id: uuidv4(),
      messageId: payload.id,
      userId: receiverId,
      status: "DELIVERED",
      createdAt: now,
    } as any);
  } catch (e) {
    console.log("sendMessage receipt insert failed", e);
  }
  try {
    await supabase
      .from("conversations")
      .update({ lastMessageAt: now, lastMessageId: payload.id, updatedAt: now })
      .eq("id", m.conversationId);
  } catch (e) {
    console.log("sendMessage conversation aggregate failed", e);
  }
  try {
    await supabase
      .from("conversation_users")
      .update({ unreadCount: (undefined as any) }) // noop to satisfy types; we will increment with RPC below if available
      .eq("conversationId", m.conversationId);
  } catch {}
}

export async function markReadUpTo(
  conversationId: string,
  userId: string,
  newestMessageId: string
) {
  // Reset unreadCount, set lastReadAt "now".
  const { error } = await supabase
    .from("conversation_users")
    .update({ unreadCount: 0, lastReadAt: new Date().toISOString() })
    .eq("conversationId", conversationId)
    .eq("userId", userId);
  if (error) throw new Error(error.message);
  // Receipts can be flipped by server-side trigger/policy; here we issue a best-effort batch
  await supabase
    .from("message_receipts")
    .update({ status: "READ", readAt: new Date().toISOString() })
    .eq("userId", userId)
    .eq("conversationId", conversationId as any);
}

// Subscriptions
export function subscribeConversations(
  userId: string,
  handlers: {
    onInsert?: (row: any) => void;
    onUpdate?: (row: any) => void;
  }
) {
  const channel = supabase
    .channel(`conv-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "conversations",
        filter: `artistId=eq.${userId}`,
      },
      async (payload) => {
        const row = await enrichConversationRow(payload.new, userId);
        handlers.onInsert?.(row);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "conversations",
        filter: `loverId=eq.${userId}`,
      },
      async (payload) => {
        const row = await enrichConversationRow(payload.new, userId);
        handlers.onInsert?.(row);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
        filter: `artistId=eq.${userId}`,
      },
      async (p) => {
        const row = await enrichConversationRow(p.new, userId);
        handlers.onUpdate?.(row);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
        filter: `loverId=eq.${userId}`,
      },
      async (p) => {
        const row = await enrichConversationRow(p.new, userId);
        handlers.onUpdate?.(row);
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

function displayName(u?: {
  firstName?: string;
  lastName?: string;
  username?: string;
}) {
  if (!u) return "";
  const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
  return full || u.username || "";
}

export function enrichConversationForUser(row: any, userId: string) {
  const peer = row.artist?.id === userId ? row.lover : row.artist;
  const cu = (row.conversation_users || []).find(
    (r: any) => r.userId === userId
  );
  return {
    ...row,
    peerId: peer?.id,
    peerName: displayName(peer),
    peerAvatar: peer?.avatar,
    unreadCount: cu?.unreadCount || 0,
  };
}

async function enrichConversationRow(row: any, userId: string) {
  if (row.artist && row.lover) return enrichConversationForUser(row, userId);
  // fetch peer user to enrich minimal row
  const peerId = row.artistId === userId ? row.loverId : row.artistId;
  if (!peerId) return enrichConversationForUser(row, userId);
  const { data: peer, error } = await supabase
    .from("users")
    .select("id,username,firstName,lastName,avatar")
    .eq("id", peerId)
    .maybeSingle();
  const cu = await supabase
    .from("conversation_users")
    .select("userId,unreadCount")
    .eq("conversationId", row.id)
    .eq("userId", userId)
    .maybeSingle();
  return enrichConversationForUser(
    {
      ...row,
      artist: row.artistId
        ? row.artist || (row.artistId === peer?.id ? peer : undefined)
        : undefined,
      lover: row.loverId
        ? row.lover || (row.loverId === peer?.id ? peer : undefined)
        : undefined,
      conversation_users: cu.data ? [cu.data] : [],
    },
    userId
  );
}

export function subscribeMessages(
  conversationId: string,
  handlers: { onInsert?: (row: any) => void }
) {
  const channel = supabase
    .channel(`msgs-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversationId=eq.${conversationId}`,
      },
      (payload) => {
        // The Realtime server can deliver the same WAL event twice during brief reconnects.
        // We do a thin client-side de-dupe by keying on message id in the store layer too.
        console.log("realtime: message INSERT", payload.new?.id);
        handlers.onInsert?.(payload.new);
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeReceipts(
  conversationId: string,
  userId: string,
  handlers: { onUpdate?: (row: any) => void }
) {
  const channel = supabase
    .channel(`rcp-${conversationId}-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "message_receipts",
        filter: `conversationId=eq.${conversationId}`,
      },
      (payload) => handlers.onUpdate?.(payload.new)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function getTypingChannel(conversationId: string) {
  // Presence channel per conversation
  return supabase.channel(`typing:conv-${conversationId}`, {
    config: { presence: { key: "typing" } },
  });
}

export async function fetchConversationByIdWithPeer(
  userId: string,
  conversationId: string
) {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      id, artistId, loverId, status, updatedAt,
      artist:artistId ( id, username, firstName, lastName, avatar ),
      lover:loverId   ( id, username, firstName, lastName, avatar ),
      conversation_users ( userId, canSend, role, lastReadAt, unreadCount )
    `
    )
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return enrichConversationForUser(data as any, userId);
}
