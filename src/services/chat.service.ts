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

  // Verify both users exist in public.users table
  const { data: loverExists } = await supabase
    .from("users")
    .select("id")
    .eq("id", loverId)
    .maybeSingle();
  
  if (!loverExists) {
    throw new Error(`Lover user ${loverId} not found in users table`);
  }

  const { data: artistExists } = await supabase
    .from("users")
    .select("id")
    .eq("id", artistId)
    .maybeSingle();
  
  if (!artistExists) {
    throw new Error(`Artist user ${artistId} not found in users table`);
  }

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
  if (convErr) {
    console.error("Conversation insert error:", convErr);
    throw new Error(convErr.message);
  }

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
  console.log("acceptConversation starting", artistId, conversationId);
  
  // Get conversation to find the loverId (receiverId for system message)
  const { data: conv, error: convFetchErr } = await supabase
    .from("conversations")
    .select("loverId")
    .eq("id", conversationId)
    .maybeSingle();
  
  if (convFetchErr || !conv) {
    console.error("Failed to fetch conversation:", convFetchErr);
    throw new Error(convFetchErr?.message || "Conversation not found");
  }
  
  const { error } = await supabase
    .from("conversations")
    .update({ status: "ACTIVE" })
    .eq("id", conversationId)
    .eq("artistId", artistId);
  if (error) {
    console.error("Conversation update error:", error);
    throw new Error(error.message);
  }

  console.log("conversation updated now accepting lover");

  // enable lover canSend, keep artist row as-is
  const { error: cuErr } = await supabase
    .from("conversation_users")
    .update({ canSend: true })
    .eq("conversationId", conversationId)
    .not("userId", "eq", artistId);
  if (cuErr) {
    console.error("Conversation user update error:", cuErr);
    throw new Error(cuErr.message);
  }
  console.log("conversation user updated now accepting lover");

  // system message (need to include receiverId and timestamps)
  const now = new Date().toISOString();
  const { error: mErr } = await supabase.from("messages").insert({
    id: uuidv4(),
    conversationId,
    senderId: artistId,
    receiverId: conv.loverId, // Add the required receiverId
    messageType: "SYSTEM",
    content: "Request accepted",
    createdAt: now,
    updatedAt: now,
  });
  if (mErr) {
    console.error("Message insert error:", mErr);
    throw new Error(mErr.message);
  }
  console.log("system message inserted");
}

export async function rejectConversation(
  artistId: string,
  conversationId: string
) {
  // Get conversation to find the loverId (receiverId for system message)
  const { data: conv, error: convFetchErr } = await supabase
    .from("conversations")
    .select("loverId")
    .eq("id", conversationId)
    .maybeSingle();
  
  if (convFetchErr || !conv) {
    console.error("Failed to fetch conversation:", convFetchErr);
    throw new Error(convFetchErr?.message || "Conversation not found");
  }
  
  const { error } = await supabase
    .from("conversations")
    .update({ status: "REJECTED" })
    .eq("id", conversationId)
    .eq("artistId", artistId);
  if (error) throw new Error(error.message);
  
  const now = new Date().toISOString();
  const { error: mErr } = await supabase.from("messages").insert({
    id: uuidv4(),
    conversationId,
    senderId: artistId,
    receiverId: conv.loverId, // Add the required receiverId
    messageType: "SYSTEM",
    content: "Request rejected",
    createdAt: now,
    updatedAt: now,
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
      conversation_users ( userId, unreadCount, deletedAt ),
      lastMessage:lastMessageId ( id, senderId, receiverId, content, messageType, createdAt, mediaUrl, isRead )
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
  
  // Note: We don't filter out conversations with deletedAt here
  // Conversations always appear in inbox; deletedAt only filters messages in chat thread
  
  // Fetch receipt status for last messages sent by current user
  const conversationsWithReceipts = await Promise.all(
    (data || []).map(async (conv: any) => {
      // Only check receipt if the last message was sent by current user
      if (conv.lastMessage && conv.lastMessage.senderId === userId) {
        const { data: receipt } = await supabase
          .from("message_receipts")
          .select("status")
          .eq("messageId", conv.lastMessageId)
          .neq("userId", userId) // Get the other user's receipt
          .maybeSingle();
        
        return { ...conv, lastMessageReceipt: receipt };
      }
      return conv;
    })
  );
  
  const nextCursor =
    data && data.length === 20
      ? {
          lastMessageAt: data[data.length - 1]?.lastMessageAt,
          id: data[data.length - 1]?.id,
        }
      : undefined;
  const items = conversationsWithReceipts.map((c: any) =>
    enrichConversationForUser(c, userId)
  );
  return { items, nextCursor };
}

export async function fetchMessagesPage(
  conversationId: string,
  cursor?: { createdAt: string; id: string },
  deletedAt?: string
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
  // Filter messages to only show those created after deletion
  if (deletedAt) {
    q = q.gt("createdAt", deletedAt);
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
  // Increment unread count for the receiver
  try {
    // First get current unread count
    const { data: cuData } = await supabase
      .from("conversation_users")
      .select("unreadCount")
      .eq("conversationId", m.conversationId)
      .eq("userId", receiverId)
      .maybeSingle();
    
    const currentCount = cuData?.unreadCount || 0;
    
    // Increment it
    await supabase
      .from("conversation_users")
      .update({ unreadCount: currentCount + 1 })
      .eq("conversationId", m.conversationId)
      .eq("userId", receiverId);
  } catch (e) {
    console.log("sendMessage unreadCount increment failed", e);
  }
}

export async function markReadUpTo(
  conversationId: string,
  userId: string,
  newestMessageId: string
) {
  const now = new Date().toISOString();
  
  // Reset unreadCount, set lastReadAt "now".
  const { error } = await supabase
    .from("conversation_users")
    .update({ unreadCount: 0, lastReadAt: now })
    .eq("conversationId", conversationId)
    .eq("userId", userId);
  if (error) throw new Error(error.message);
  
  // Update messages.isRead for all messages in this conversation that the user received
  await supabase
    .from("messages")
    .update({ isRead: true })
    .eq("conversationId", conversationId)
    .eq("receiverId", userId)
    .eq("isRead", false);
  
  // Update receipts to READ status
  await supabase
    .from("message_receipts")
    .update({ status: "READ", readAt: now })
    .eq("userId", userId)
    .eq("conversationId", conversationId as any)
    .eq("status", "DELIVERED");
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
        console.log("📥 Conversation INSERT (artist)", payload.new.id);
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
        console.log("📥 Conversation INSERT (lover)", payload.new.id);
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
        console.log("🔄 Conversation UPDATE (artist)", p.new.id, "lastMessageId:", p.new.lastMessageId);
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
        console.log("🔄 Conversation UPDATE (lover)", p.new.id, "lastMessageId:", p.new.lastMessageId);
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

function getMessagePreviewText(message: any): string {
  if (!message) return "New conversation";
  
  const { content, messageType, mediaUrl } = message;
  
  // Handle media messages
  if (mediaUrl) {
    switch (messageType) {
      case 'IMAGE':
        return '📷 Photo';
      case 'VIDEO':
        return '🎥 Video';
      case 'FILE':
        return '📎 File';
      default:
        return 'Media';
    }
  }
  
  // Handle system messages
  if (messageType === 'SYSTEM') {
    return content || 'System message';
  }
  
  if (messageType === 'INTAKE_QUESTION') {
    return content || 'Question';
  }
  
  if (messageType === 'INTAKE_ANSWER') {
    return content || 'Answer';
  }
  
  // Regular text message
  return content || "New conversation";
}

export function enrichConversationForUser(row: any, userId: string) {
  const peer = row.artist?.id === userId ? row.lover : row.artist;
  const cu = (row.conversation_users || []).find(
    (r: any) => r.userId === userId
  );
  
  const lastMessage = row.lastMessage;
  const lastMessageSentByMe = lastMessage?.senderId === userId;
  
  // Single source of truth for read status:
  // - If message was sent BY me: use receipt status (shows if OTHER person read it)
  // - If message was sent TO me: use isRead field (shows if I read it)
  let lastMessageIsRead = false;
  if (lastMessageSentByMe) {
    // I sent it - check if receiver read it via receipt
    lastMessageIsRead = row.lastMessageReceipt?.status === 'READ';
  } else {
    // I received it - check if I read it
    lastMessageIsRead = lastMessage?.isRead === true;
  }
  
  return {
    ...row,
    peerId: peer?.id,
    peerName: displayName(peer),
    peerAvatar: peer?.avatar,
    unreadCount: cu?.unreadCount || 0,
    lastMessageText: getMessagePreviewText(lastMessage),
    lastMessageTime: lastMessage?.createdAt || row.lastMessageAt,
    lastMessageSentByMe,
    lastMessageIsRead,
  };
}

async function enrichConversationRow(row: any, userId: string) {
  if (row.artist && row.lover && row.lastMessage) {
    return enrichConversationForUser(row, userId);
  }
  
  console.log("🔄 Enriching conversation row:", row.id);
  
  // fetch peer user to enrich minimal row
  const peerId = row.artistId === userId ? row.loverId : row.artistId;
  if (!peerId) {
    console.warn("⚠️ No peerId found for conversation:", row.id);
    return enrichConversationForUser(row, userId);
  }
  
  let peer = null;
  let cu = null;
  let lastMessage = row.lastMessage;
  let lastMessageReceipt = row.lastMessageReceipt;
  
  try {
    // Fetch peer user data
    const { data: peerData, error: peerError } = await supabase
      .from("users")
      .select("id,username,firstName,lastName,avatar")
      .eq("id", peerId)
      .maybeSingle();
    
    if (peerError) {
      console.error("❌ Failed to fetch peer user:", peerError);
    } else {
      peer = peerData;
    }
    
    // Fetch conversation user data
    const { data: cuData, error: cuError } = await supabase
      .from("conversation_users")
      .select("userId,unreadCount")
      .eq("conversationId", row.id)
      .eq("userId", userId)
      .maybeSingle();
    
    if (cuError) {
      console.error("❌ Failed to fetch conversation_users:", cuError);
    } else {
      cu = cuData;
    }
    
    // Fetch last message if not present
    if (!lastMessage && row.lastMessageId) {
      const { data: msg, error: msgError } = await supabase
        .from("messages")
        .select("id, senderId, receiverId, content, messageType, createdAt, mediaUrl, isRead")
        .eq("id", row.lastMessageId)
        .maybeSingle();
      
      if (msgError) {
        console.error("❌ Failed to fetch last message:", msgError);
      } else {
        lastMessage = msg;
        
        // Fetch receipt if message was sent by current user
        if (msg && msg.senderId === userId) {
          const { data: receipt } = await supabase
            .from("message_receipts")
            .select("status")
            .eq("messageId", row.lastMessageId)
            .neq("userId", userId)
            .maybeSingle();
          lastMessageReceipt = receipt;
        }
      }
    }
  } catch (e) {
    console.error("❌ Error enriching conversation:", e);
  }
  
  const enriched = {
    ...row,
    artist: row.artistId
      ? row.artist || (row.artistId === peer?.id ? peer : undefined)
      : undefined,
    lover: row.loverId
      ? row.lover || (row.loverId === peer?.id ? peer : undefined)
      : undefined,
    conversation_users: cu ? [cu] : [],
    lastMessage,
    lastMessageReceipt,
  };
  
  return enrichConversationForUser(enriched, userId);
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

// Presence: a single global channel to track who is online by userId
export function getPresenceChannel() {
  console.log("🔧 [SERVICE] Creating presence channel: 'presence:users'");
  const channel = supabase.channel("presence:users", {
    config: { presence: { key: "user-presence" } },
  });
  console.dir("🔧 [SERVICE] Presence channel created:", channel);
  return channel;
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
      conversation_users ( userId, canSend, role, lastReadAt, unreadCount, deletedAt )
    `
    )
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return enrichConversationForUser(data as any, userId);
}

// Report user
export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  conversationId: string,
  reason: string
) {
  const { error } = await supabase.from("reports").insert({
    id: uuidv4(),
    reporterId,
    reportedUserId,
    conversationId,
    reportType: "USER",
    reason,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  });
  
  if (error) throw new Error(error.message);
}

// Block user
export async function blockUser(
  blockerId: string,
  blockedId: string,
  conversationId: string
) {
  console.log("Starting blockUser", blockerId, blockedId, conversationId);
  // Create blocked_users record
  const { error: blockError } = await supabase.from("blocked_users").insert({
    id: uuidv4(),
    blockerId,
    blockedId,
    createdAt: new Date().toISOString(),
  });

  console.log("blockError", blockError);  
  if (blockError) throw new Error(blockError.message);
  
  console.log("starting to update conversation status to BLOCKED", conversationId);
  // Update conversation status to BLOCKED
  const { error: convError } = await supabase
    .from("conversations")
    .update({ status: "BLOCKED", updatedAt: new Date().toISOString() })
    .eq("id", conversationId);
  
  console.log("convError", convError);
  if (convError) throw new Error(convError.message);
}

// Delete conversation (soft delete for specific user)
export async function deleteConversation(
  conversationId: string,
  userId: string
) {
  const now = new Date().toISOString();
  
  const { error } = await supabase
    .from("conversation_users")
    .update({ deletedAt: now })
    .eq("conversationId", conversationId)
    .eq("userId", userId);
  
  if (error) throw new Error(error.message);
}