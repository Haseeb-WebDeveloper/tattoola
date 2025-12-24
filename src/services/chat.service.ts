import {
    ageOptions,
    colorOptions,
    sizeOptions,
} from "@/constants/request-questions";
import {
    ConversationRole,
    ConversationStatus,
    MessageType,
} from "@/types/chat";
import { supabase } from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";

/**
 * Determines a user's conversation role based on their actual user type
 * - If user has artist_profile → ARTIST role
 * - If user is normal user (TATTOO_LOVER) → LOVER role
 * - If user is ADMIN → ARTIST role (for consistency)
 *
 * @param userId - User ID to check
 * @returns Promise<ConversationRole> - ARTIST or LOVER
 */
async function determineUserConversationRole(
  userId: string
): Promise<ConversationRole> {
  // Check if user has artist profile
  const { data: artistProfile } = await supabase
    .from("artist_profiles")
    .select("id")
    .eq("userId", userId)
    .maybeSingle();

  if (artistProfile) {
    return "ARTIST";
  }

  // Check user role from users table
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  // If user is ADMIN, treat as ARTIST for conversation purposes
  if (user?.role === "ADMIN") {
    return "ARTIST";
  }

  // Default to LOVER for normal users
  return "LOVER";
}

/**
 * Determines conversation roles for both participants
 * Properly tracks sender and receiver roles based on their actual user types
 *
 * @param senderId - User ID of the sender
 * @param receiverId - User ID of the receiver
 * @param isSelfRequest - Whether this is a self-request
 * @returns Promise with sender and receiver roles
 */
async function determineConversationRoles(
  senderId: string,
  receiverId: string,
  isSelfRequest: boolean
): Promise<{
  senderRole: ConversationRole;
  receiverRole: ConversationRole;
}> {
  if (isSelfRequest) {
    // For self-requests, use the user's actual role
    const userRole = await determineUserConversationRole(senderId);
    return {
      senderRole: userRole,
      receiverRole: userRole, // Same role for both
    };
  }

  // For normal requests, determine each user's actual role
  const [senderRole, receiverRole] = await Promise.all([
    determineUserConversationRole(senderId),
    determineUserConversationRole(receiverId),
  ]);

  return {
    senderRole,
    receiverRole,
  };
}

/**
 * Checks if a conversation already exists between two users
 * Checks both directions (userId1→userId2 and userId2→userId1)
 *
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @returns Promise with conversation data or null
 */
async function checkExistingConversation(
  userId1: string,
  userId2: string
): Promise<{ id: string; status: ConversationStatus } | null> {
  // Check both directions (userId1→userId2 and userId2→userId1)
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, status")
    .or(
      `and(artistId.eq.${userId1},loverId.eq.${userId2}),and(artistId.eq.${userId2},loverId.eq.${userId1})`
    )
    .in("status", ["REQUESTED", "ACTIVE", "REJECTED", "CLOSED"])
    .maybeSingle();

  return conv || null;
}

/**
 * Gets artist profile for a user if they have one
 *
 * @param userId - User ID to check
 * @returns Promise with artist profile data or null
 */
async function getArtistProfile(
  userId: string
): Promise<{
  acceptPrivateRequests: boolean;
  rejectionMessage?: string;
} | null> {
  const { data: profile } = await supabase
    .from("artist_profiles")
    .select("acceptPrivateRequests, rejectionMessage")
    .eq("userId", userId)
    .maybeSingle();

  return profile || null;
}

/**
 * Auto-accepts a conversation (used for self-requests)
 *
 * @param conversationId - Conversation ID to accept
 * @param userId - User ID (same for sender and receiver in self-requests)
 */
async function autoAcceptConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();

  // Update conversation status
  const { error: statusErr } = await supabase
    .from("conversations")
    .update({
      status: "ACTIVE",
      acceptedAt: now,
      updatedAt: now,
    })
    .eq("id", conversationId);

  if (statusErr) {
    console.error("Auto-accept conversation update error:", statusErr);
    throw new Error(statusErr.message);
  }

  // Update private request status
  const { error: prUpdateErr } = await supabase
    .from("private_requests")
    .update({
      status: "ACCEPTED",
      updatedAt: now,
    })
    .eq("conversationId", conversationId);

  if (prUpdateErr) {
    console.error("Auto-accept private request update error:", prUpdateErr);
    // Don't throw, just log - this is not critical for conversation flow
  }

  // Insert system message
  const { error: sysMsgErr } = await supabase.from("messages").insert({
    id: uuidv4(),
    conversationId,
    senderId: userId,
    receiverId: userId,
    messageType: "SYSTEM",
    content: "Request accepted",
    createdAt: now,
    updatedAt: now,
  });

  if (sysMsgErr) {
    console.error("Auto-accept system message insert error:", sysMsgErr);
    // Don't throw, just log - this is not critical for conversation flow
  }
}

export async function createPrivateRequestConversation(
  senderId: string,
  receiverId: string,
  intake: {
    size?: string;
    color?: string;
    desc?: string;
    isAdult?: boolean;
    references?: string[]; // cloudinary urls
  }
): Promise<{ conversationId: string }> {
  const isSelfRequest = senderId === receiverId;

  // Step 1: Verify both users exist
  const [senderExists, receiverExists] = await Promise.all([
    supabase.from("users").select("id").eq("id", senderId).maybeSingle(),
    supabase.from("users").select("id").eq("id", receiverId).maybeSingle(),
  ]);

  if (!senderExists.data) {
    throw new Error(`Sender user ${senderId} not found in users table`);
  }

  if (!receiverExists.data) {
    throw new Error(`Receiver user ${receiverId} not found in users table`);
  }

  // Step 2: Determine actual roles of sender and receiver
  const [senderRole, receiverRole] = await Promise.all([
    determineUserConversationRole(senderId),
    determineUserConversationRole(receiverId),
  ]);

  // Enforce direction rules
  if (!isSelfRequest) {
    if (receiverRole !== "ARTIST") {
      throw new Error("Puoi inviare richieste private solo ad artisti");
    }

    if (senderRole === "ARTIST" && receiverRole !== "ARTIST") {
      throw new Error(
        "Gli artisti possono inviare richieste private solo ad altri artisti"
      );
    }

    if (senderRole === "LOVER" && receiverRole !== "ARTIST") {
      throw new Error(
        "I Tattoo Lovers possono inviare richieste solo agli artisti"
      );
    }
  }

  // Step 3: Check receiver's accept requests setting (only if receiver is artist and not self-request)
  if (!isSelfRequest && receiverRole === "ARTIST") {
    const artistProfile = await getArtistProfile(receiverId);
    if (artistProfile && artistProfile.acceptPrivateRequests === false) {
      const rejectionMsg =
        artistProfile.rejectionMessage ||
        "L'artista non può ricevere nuove richieste private in questo momento";
      throw new Error(rejectionMsg);
    }
  }

  // Step 4: Always create a fresh conversation (allows multiple requests)
  const now = new Date().toISOString();
  const conversationId = uuidv4();

  // Receiver is always treated as the artist for conversation ownership
  const artistId = receiverRole === "ARTIST" ? receiverId : senderRole === "ARTIST" ? senderId : null;
  const loverId = artistId && artistId === senderId ? receiverId : senderId;

  const { error: convErr } = await supabase.from("conversations").insert({
    id: conversationId,
    artistId,
    loverId,
    status: isSelfRequest ? "ACTIVE" : "REQUESTED",
    requestedBy: senderId,
    createdAt: now,
    updatedAt: now,
  });

  if (convErr) {
    console.error("Conversation insert error:", convErr);
    throw new Error(convErr.message);
  }

  // Step 5: Create conversation users (receiver gets accept/reject controls)
  const usersToInsert = isSelfRequest
    ? [
        {
          id: uuidv4(),
          conversationId,
          userId: senderId,
          role: senderRole,
          canSend: true,
        },
      ]
    : [
        {
          id: uuidv4(),
          conversationId,
          userId: senderId,
          role: senderRole,
          canSend: false,
        },
        {
          id: uuidv4(),
          conversationId,
          userId: receiverId,
          role: receiverRole,
          canSend: true,
        },
      ];

  const { error: cuErr } = await supabase
    .from("conversation_users")
    .insert(usersToInsert as any);
  if (cuErr) throw new Error(cuErr.message);

  // Step 6: Create PrivateRequest record (one per conversation)
  const { error: prErr } = await supabase.from("private_requests").insert({
    id: uuidv4(),
    senderId,
    receiverId,
    conversationId,
    message: intake.desc || null,
    status: isSelfRequest ? "ACCEPTED" : "PENDING",
    createdAt: now,
    updatedAt: now,
  });
  if (prErr) {
    console.error("PrivateRequest insert error:", prErr);
  }

  // Step 7: Create intake record
  const { error: intakeErr } = await supabase.from("conversation_intakes").insert({
    id: uuidv4(),
    conversationId,
    createdByUserId: senderId,
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

  // console.log("intake record inserted");

  // Step 11: Create intake messages (only if intake doesn't exist)
  if (!existingIntake) {
    // Helper functions to get human-readable labels
    const getSizeLabel = (key: string) => {
      return sizeOptions.find((opt) => opt.key === key)?.label || key;
    };

    const getColorLabel = (key: string) => {
      return colorOptions.find((opt) => opt.key === key)?.label || key;
    };

    const getAgeLabel = (isAdult: boolean) => {
      return (
        ageOptions.find((opt) => opt.key === isAdult)?.label ||
        (isAdult ? "+18" : "-18")
      );
    };

    // Synthesize intake messages for continuity with proper ordering
    const msgs: any[] = [];
    let messageOrder = 0; // Sequence counter for guaranteed order

    const getTimestamp = () => {
      // Add milliseconds offset to ensure proper ordering
      const baseTime = new Date(now).getTime();
      return new Date(baseTime + messageOrder++).toISOString();
    };

    const pushQA = (qKey: string, qText: string, aText?: string) => {
      const qTimestamp = getTimestamp();
      msgs.push({
        id: uuidv4(),
        conversationId,
        senderId: receiverId, // Questions come from receiver
        receiverId: senderId,
        content: qText,
        messageType: "INTAKE_QUESTION",
        createdAt: qTimestamp,
        updatedAt: qTimestamp,
      });
      if (aText) {
        const aTimestamp = getTimestamp();
        msgs.push({
          id: uuidv4(),
          conversationId,
          senderId: senderId, // Answers come from sender
          receiverId: receiverId,
          content: aText,
          messageType: "INTAKE_ANSWER",
          createdAt: aTimestamp,
          updatedAt: aTimestamp,
          intakeFieldKey: qKey,
        });
      }
    };

    // 1. Size question and answer
    pushQA(
      "size",
      "Approximately what size would you like the tattoo to be?",
      intake.size ? getSizeLabel(intake.size) : undefined
    );

    // 2. References question and answers (with images)
    const qTimestamp = getTimestamp();
    msgs.push({
      id: uuidv4(),
      conversationId,
      senderId: receiverId,
      receiverId: senderId,
      content:
        "Can you post some examples of tattoos that resemble the result you'd like?",
      messageType: "INTAKE_QUESTION",
      createdAt: qTimestamp,
      updatedAt: qTimestamp,
    });
    for (const ref of intake.references || []) {
      const aTimestamp = getTimestamp();
      msgs.push({
        id: uuidv4(),
        conversationId,
        senderId: senderId,
        receiverId: receiverId,
        content: "",
        messageType: "INTAKE_ANSWER",
        mediaUrl: ref,
        createdAt: aTimestamp,
        updatedAt: aTimestamp,
        intakeFieldKey: "references",
      });
    }

    // 3. Color question and answer
    pushQA(
      "color",
      "Would you like a color or black and white tattoo?",
      intake.color ? getColorLabel(intake.color) : undefined
    );

    // 4. Description question and answer
    pushQA("description", "Describe your tattoo design in brief", intake.desc);

    // 5. Age question and answer
    pushQA(
      "age",
      "Potresti confermare la tua età?",
      intake.isAdult !== undefined ? getAgeLabel(intake.isAdult) : undefined
    );

    // Insert intake messages
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
  }

  // Step 12: Auto-accept self-requests
  if (isSelfRequest) {
    await autoAcceptConversation(conversationId, senderId);
  }

  return { conversationId };
}

export async function acceptConversation(
  artistId: string,
  conversationId: string
) {
  // console.log("acceptConversation starting", artistId, conversationId);

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

  // console.log("conversation updated now accepting lover");

  // Update PrivateRequest status to ACCEPTED
  const { error: prUpdateErr } = await supabase
    .from("private_requests")
    .update({ status: "ACCEPTED", updatedAt: new Date().toISOString() })
    .eq("conversationId", conversationId);
  if (prUpdateErr) {
    console.error("PrivateRequest update error:", prUpdateErr);
    // Don't throw, just log - this is not critical for conversation flow
  }

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
  // console.log("conversation user updated now accepting lover");

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
  //  console.log("system message inserted");
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
    .in("status", ["REQUESTED", "ACTIVE", "BLOCKED"] as any)
    .order("lastMessageAt", { ascending: false, nullsFirst: false })
    .limit(20);
  if (cursor) {
    q = q.lt("lastMessageAt", cursor.lastMessageAt as any);
  }
  const { data, error } = (await q) as any;
  if (error) throw new Error(error.message);

  // Note: We don't filter out conversations with deletedAt here
  // Conversations always appear in inbox; deletedAt only filters messages in chat thread

  // Fetch receipt status for last messages
  const conversationsWithReceipts = await Promise.all(
    (data || []).map(async (conv: any) => {
      // Check receipt for the last message
      if (conv.lastMessage) {
        // Receipt belongs to the receiver
        // If current user sent the message, fetch receipt for the receiver
        // If current user received the message, fetch receipt for current user
        const receiptUserId =
          conv.lastMessage.senderId === userId
            ? conv.lastMessage.receiverId
            : userId;

        const { data: receipt } = await supabase
          .from("message_receipts")
          .select("status")
          .eq("messageId", conv.lastMessageId)
          .eq("userId", receiptUserId)
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
    // console.log("sendMessage resolve receiver failed", e);
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
    // console.log("sendMessage insert failed", error);
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
    // console.log("sendMessage receipt insert failed", e);
  }
  try {
    await supabase
      .from("conversations")
      .update({ lastMessageAt: now, lastMessageId: payload.id, updatedAt: now })
      .eq("id", m.conversationId);
  } catch (e) {
    // console.log("sendMessage conversation aggregate failed", e);
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
    // console.log("sendMessage unreadCount increment failed", e);
  }
}

export async function markReadUpTo(
  conversationId: string,
  userId: string,
  newestMessageId: string
) {
  const now = new Date().toISOString();
  //console.log("🔵 [markReadUpTo] Called for userId:", userId, "conversationId:", conversationId);
  // Reset unreadCount, set lastReadAt "now".
  const { error } = await supabase
    .from("conversation_users")
    .update({ unreadCount: 0, lastReadAt: now })
    .eq("conversationId", conversationId)
    .eq("userId", userId);
  // console.log("🔵 [markReadUpTo] Updated conversation_users, error:", error);
  if (error) {
    console.error("[markReadUpTo] Error:", error);
    throw new Error(error.message);
  }

  // FIRST: Get message IDs that need to be updated (before updating isRead)
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id")
    .eq("conversationId", conversationId)
    .eq("receiverId", userId)
    .eq("isRead", false);

  // console.log("🔵 [markReadUpTo] Found", messages?.length || 0, "unread messages for userId:", userId);

  if (messagesError) {
    console.error("[markReadUpTo] Error fetching messages:", messagesError);
  }

  const messageIds = messages?.map((m) => m.id) || [];

  // SECOND: Update messages.isRead for all messages in this conversation that the user received
  if (messageIds.length > 0) {
    const { error: updateError } = await supabase
      .from("messages")
      .update({ isRead: true })
      .in("id", messageIds);
    if (updateError) {
      console.error("[markReadUpTo] Error updating isRead:", updateError);
    }
  }

  // THIRD: Update receipts to READ status using the message IDs we collected
  if (messageIds.length > 0) {
    const { error: receiptError } = await supabase
      .from("message_receipts")
      .update({ status: "READ", readAt: now })
      .eq("userId", userId)
      .in("messageId", messageIds)
      .eq("status", "DELIVERED");
    if (receiptError) {
      console.error("[markReadUpTo] Error updating receipts:", receiptError);
    }
  }
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
        // console.log("📥 Conversation INSERT (artist)", payload.new.id);
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
        // console.log("📥 Conversation INSERT (lover)", payload.new.id);
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
        // console.log("🔄 Conversation UPDATE (artist)", p.new.id, "lastMessageId:", p.new.lastMessageId);
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
        // console.log("🔄 Conversation UPDATE (lover)", p.new.id, "lastMessageId:", p.new.lastMessageId);
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
      case "IMAGE":
        return "📷 Photo";
      case "VIDEO":
        return "🎥 Video";
      case "FILE":
        return "📎 File";
      default:
        return "Media";
    }
  }

  // Handle system messages
  if (messageType === "SYSTEM") {
    return content || "System message";
  }

  if (messageType === "INTAKE_QUESTION") {
    return content || "Question";
  }

  if (messageType === "INTAKE_ANSWER") {
    return content || "Answer";
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
  // Use receipt status for both sent and received messages
  // Receipt always belongs to the receiver, so:
  // - If message was sent BY me: receipt shows if OTHER person read it
  // - If message was sent TO me: receipt shows if I read it
  let lastMessageIsRead = false;
  if (row.lastMessageReceipt) {
    // Use receipt status if available (most reliable)
    lastMessageIsRead = row.lastMessageReceipt.status === "READ";
  } else if (!lastMessageSentByMe) {
    // Fallback to isRead field for received messages if no receipt
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

  // console.log("🔄 Enriching conversation row:", row.id);

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
        .select(
          "id, senderId, receiverId, content, messageType, createdAt, mediaUrl, isRead"
        )
        .eq("id", row.lastMessageId)
        .maybeSingle();

      if (msgError) {
        console.error("❌ Failed to fetch last message:", msgError);
      } else {
        lastMessage = msg;

        // Fetch receipt for the last message
        // Receipt belongs to the receiver, so we need to determine who received this message
        if (msg) {
          // If current user sent the message, fetch receipt for the receiver
          // If current user received the message, fetch receipt for current user
          const receiptUserId =
            msg.senderId === userId ? msg.receiverId : userId;

          const { data: receipt } = await supabase
            .from("message_receipts")
            .select("status")
            .eq("messageId", row.lastMessageId)
            .eq("userId", receiptUserId)
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
        // console.log("realtime: message INSERT", payload.new?.id);
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
  // console.log("🔧 [SERVICE] Creating presence channel: 'presence:users'");
  const channel = supabase.channel("presence:users", {
    config: { presence: { key: "user-presence" } },
  });
  // console.dir("🔧 [SERVICE] Presence channel created:", channel);
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
  
  // Enrich the conversation
  const enriched = enrichConversationForUser(data as any, userId);
  
  // Double-check block status from blocked_users table
  if (enriched && enriched.peerId) {
    const isBlocked = await isUserBlocked(userId, enriched.peerId);
    // If blocked in DB but status doesn't reflect it, sync the status
    if (isBlocked && enriched.status !== "BLOCKED") {
      // Update conversation status to match blocked_users table
      await supabase
        .from("conversations")
        .update({ status: "BLOCKED", updatedAt: new Date().toISOString() })
        .eq("id", conversationId);
      enriched.status = "BLOCKED";
    }
    // If not blocked in DB but status says blocked, fix it
    else if (!isBlocked && enriched.status === "BLOCKED") {
      await supabase
        .from("conversations")
        .update({ status: "ACTIVE", updatedAt: new Date().toISOString() })
        .eq("id", conversationId);
      enriched.status = "ACTIVE";
    }
  }
  
  return enriched;
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

// Check if user is blocked
export async function isUserBlocked(
  blockerId: string,
  blockedId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("id")
    .eq("blockerId", blockerId)
    .eq("blockedId", blockedId)
    .maybeSingle();

  if (error) {
    console.error("Error checking block status:", error);
    return false;
  }

  return !!data;
}

// Block user
export async function blockUser(
  blockerId: string,
  blockedId: string,
  conversationId: string
) {
  // Check if already blocked
  const alreadyBlocked = await isUserBlocked(blockerId, blockedId);

  // Only insert if not already blocked
  if (!alreadyBlocked) {
    const { error: blockError } = await supabase.from("blocked_users").insert({
      id: uuidv4(),
      blockerId,
      blockedId,
      createdAt: new Date().toISOString(),
    });

    if (blockError) throw new Error(blockError.message);
  }

  // Always update conversation status to BLOCKED (in case it was out of sync)
  const { error: convError } = await supabase
    .from("conversations")
    .update({ status: "BLOCKED", updatedAt: new Date().toISOString() })
    .eq("id", conversationId);

  if (convError) throw new Error(convError.message);
}

// Unblock user
export async function unblockUser(
  unblockerId: string,
  unblockedId: string,
  conversationId: string
) {
  // Remove blocked_users record
  const { error: unblockError } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blockerId", unblockerId)
    .eq("blockedId", unblockedId);

  if (unblockError) throw new Error(unblockError.message);

  // Update conversation status back to ACTIVE
  const { error: convError } = await supabase
    .from("conversations")
    .update({ status: "ACTIVE", updatedAt: new Date().toISOString() })
    .eq("id", conversationId);

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
