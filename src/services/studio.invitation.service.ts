import { generateUUID } from "@/utils/randomUUIDValue";
import { supabase } from "@/utils/supabase";
import { sendStudioInvitationEmail } from "./email.service";

export interface SearchArtistResult {
  id: string;
  userId: string;
  email: string;
  username: string;
  avatar: string | null;
  businessName: string | null;
  firstName: string | null;
  lastName: string | null;
  location?: {
    municipality: string;
    province: string;
  } | null;
  planType?: "PREMIUM" | "STUDIO" | null;
}

export interface StudioMember {
  id: string;
  userId: string;
  artistId: string;
  role: "OWNER" | "MANAGER" | "MEMBER";
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  invitedAt: string | null;
  acceptedAt: string | null;
  joinedAt: string | null;
  user: {
    email: string;
    username: string;
    avatar: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  artist: {
    businessName: string | null;
  };
  inviter?: {
    firstName: string | null;
    lastName: string | null;
    username: string;
  } | null;
  location?: {
    municipality: string;
    province: string;
  } | null;
  planType?: "PREMIUM" | "STUDIO" | null;
}

/**
 * Search artists by email or username for invitation
 */
export async function searchArtistsForInvite(
  query: string,
  studioId: string
): Promise<{ data: SearchArtistResult[]; error?: string }> {
  try {
    if (!query || query.trim().length < 2) {
      return { data: [] };
    }

    const searchTerm = query.trim().toLowerCase();

    // Get existing member IDs to exclude
    const { data: existingMembers } = await supabase
      .from("studio_members")
      .select("userId")
      .eq("studioId", studioId)
      .in("status", ["ACCEPTED", "PENDING"]);

    const excludedUserIds = existingMembers?.map((m) => m.userId) || [];

    // Search users by email or username
    let userQuery = supabase
      .from("users")
      .select(
      `
        id,
        email,
        username,
        avatar,
        firstName,
        lastName,
        artistProfile:artist_profiles(id, businessName, studioAddress),
        locations:user_locations(
          isPrimary,
          municipality:municipalities(name),
          province:provinces(code),
          address
        ),
        subscriptions:user_subscriptions!user_subscriptions_userId_fkey(
          status,
          endDate,
          plan:subscription_plans(type)
        )
      `
      )
      .eq("role", "ARTIST")
      .eq("isActive", true)
      .or(`email.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
      .limit(20);

    // Exclude users already in studio
    // Note: Supabase doesn't support .not("id", "in", ...) directly
    // We'll filter them out after fetching
    const { data: users, error } = await userQuery;

    if (error) {
      console.error("Error searching artists:", error);
      return { data: [], error: error.message };
    }

    // Filter out excluded users
    const filteredUsers = users?.filter((user: any) => 
      !excludedUserIds.includes(user.id)
    ) || [];

    // Process results with fallback logic for businessName
    const results: SearchArtistResult[] = await Promise.all(
      filteredUsers.map(async (user: any) => {
        // Get primary location
        const primaryLocation = user.locations?.find((loc: any) => loc.isPrimary);
        const location = primaryLocation
          ? {
              municipality: primaryLocation.municipality?.name || "",
              province: primaryLocation.province?.code || "",
            }
          : null;

        // Get active subscription plan type
        const activeSubscription = user.subscriptions?.find(
          (sub: any) => sub.status === "ACTIVE" && (!sub.endDate || new Date(sub.endDate) > new Date())
        );
        const planType = activeSubscription?.plan?.type || null;

        // Use businessName from artist profile first
        let businessName = user.artistProfile?.businessName;

        // Fallback: If businessName is missing, query studio membership
        if (!businessName && user.artistProfile?.id) {
          const { data: studioMembership } = await supabase
            .from("studio_members")
            .select(
              `
              studio:studios(
                id,
                name
              )
            `
            )
            .eq("artistId", user.artistProfile.id)
            .eq("status", "ACCEPTED")
            .eq("isActive", true)
            .maybeSingle();

          if (studioMembership?.studio) {
            const studio = studioMembership.studio as any;
            businessName = studio.name;
          }
        }

        return {
          id: user.artistProfile?.id || "",
          userId: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          businessName: businessName || null,
          firstName: user.firstName,
          lastName: user.lastName,
          location,
          planType,
        };
      })
    );

    return { data: results };
  } catch (error: any) {
    console.error("Error in searchArtistsForInvite:", error);
    return { data: [], error: error.message };
  }
}

/**
 * Verify user has permission to manage studio (OWNER or MANAGER)
 */
async function verifyStudioPermission(
  studioId: string,
  userId: string
): Promise<{ hasPermission: boolean; role?: "OWNER" | "MANAGER"; error?: string }> {
  try {
    // Get artist profile
    const { data: artistProfile } = await supabase
      .from("artist_profiles")
      .select("id")
      .eq("userId", userId)
      .single();

    if (!artistProfile) {
      return { hasPermission: false, error: "Artist profile not found" };
    }

    // Check if user is owner
    const { data: studio } = await supabase
      .from("studios")
      .select("ownerId")
      .eq("id", studioId)
      .single();

    if (studio?.ownerId === artistProfile.id) {
      return { hasPermission: true, role: "OWNER" };
    }

    // Check if user is manager
    const { data: member } = await supabase
      .from("studio_members")
      .select("role")
      .eq("studioId", studioId)
      .eq("userId", userId)
      .eq("status", "ACCEPTED")
      .eq("isActive", true)
      .single();

    if (member?.role === "MANAGER") {
      return { hasPermission: true, role: "MANAGER" };
    }

    return { hasPermission: false, error: "Insufficient permissions" };
  } catch (error: any) {
    console.error("Error verifying studio permission:", error);
    return { hasPermission: false, error: error.message };
  }
}

/**
 * Invite artist to studio
 */
export async function inviteArtistToStudio(params: {
  studioId: string;
  invitedUserId: string;
  invitedByUserId: string;
  role?: "MEMBER" | "MANAGER";
}): Promise<{ success: boolean; invitationId?: string; error?: string }> {
  try {
    // Verify inviter has permission
    const permissionCheck = await verifyStudioPermission(
      params.studioId,
      params.invitedByUserId
    );

    if (!permissionCheck.hasPermission) {
      return { success: false, error: permissionCheck.error || "Insufficient permissions" };
    }

    // Get artist profile for invited user
    const { data: invitedArtistProfile } = await supabase
      .from("artist_profiles")
      .select("id")
      .eq("userId", params.invitedUserId)
      .single();

    if (!invitedArtistProfile) {
      return { success: false, error: "Artist profile not found for invited user" };
    }

    // Check if user is already a member (ACCEPTED)
    const { data: existingMember } = await supabase
      .from("studio_members")
      .select("id, status")
      .eq("studioId", params.studioId)
      .eq("userId", params.invitedUserId)
      .maybeSingle();

    if (existingMember?.status === "ACCEPTED") {
      return { success: false, error: "User is already a member of this studio" };
    }

    // Check if pending invitation exists
    if (existingMember?.status === "PENDING") {
      // Resend email with existing token
      const { data: pendingInvitation } = await supabase
        .from("studio_members")
        .select("id, invitationToken")
        .eq("id", existingMember.id)
        .single();

      if (pendingInvitation?.invitationToken) {
        // Get studio and sender info for email
        const { data: studio } = await supabase
          .from("studios")
          .select("name, logo")
          .eq("id", params.studioId)
          .single();

        const { data: sender } = await supabase
          .from("users")
          .select("firstName, lastName, username")
          .eq("id", params.invitedByUserId)
          .single();

        const { data: invitedUser } = await supabase
          .from("users")
          .select("email")
          .eq("id", params.invitedUserId)
          .single();

        if (studio && sender && invitedUser) {
          const senderName =
            sender.firstName && sender.lastName
              ? `${sender.firstName} ${sender.lastName}`
              : sender.username;

          // Resend email
          await sendStudioInvitationEmail({
            toEmail: invitedUser.email,
            studioName: studio.name,
            studioLogo: studio.logo,
            senderName: senderName,
            invitationToken: pendingInvitation.invitationToken,
          });

          // Update invitedAt timestamp
          await supabase
            .from("studio_members")
            .update({ invitedAt: new Date().toISOString() })
            .eq("id", existingMember.id);
        }

        return { success: true, invitationId: existingMember.id };
      }
    }

    // Create new invitation
    const invitationToken = generateUUID();
    const now = new Date().toISOString();

    // Get studio and sender info for email
    const { data: studio } = await supabase
      .from("studios")
      .select("name, logo")
      .eq("id", params.studioId)
      .single();

    const { data: sender } = await supabase
      .from("users")
      .select("firstName, lastName, username")
      .eq("id", params.invitedByUserId)
      .single();

    const { data: invitedUser } = await supabase
      .from("users")
      .select("email")
      .eq("id", params.invitedUserId)
      .single();

    if (!studio || !sender || !invitedUser) {
      return { success: false, error: "Failed to fetch studio or user information" };
    }

    // Create studio_member record with PENDING status
    const { data: newMember, error: createError } = await supabase
      .from("studio_members")
      .insert({
        id: generateUUID(),
        studioId: params.studioId,
        userId: params.invitedUserId,
        artistId: invitedArtistProfile.id,
        role: params.role || "MEMBER",
        status: "PENDING",
        invitationToken: invitationToken,
        invitedAt: now,
        isActive: false,
        invitedBy: params.invitedByUserId,
      })
      .select()
      .single();

    if (createError) {
      // Handle unique constraint violation (user already has pending invitation)
      if (createError.code === "23505") {
        // Try to resend existing invitation
        const { data: existing } = await supabase
          .from("studio_members")
          .select("id, invitationToken")
          .eq("studioId", params.studioId)
          .eq("userId", params.invitedUserId)
          .eq("status", "PENDING")
          .single();

        if (existing?.invitationToken) {
          const senderName =
            sender.firstName && sender.lastName
              ? `${sender.firstName} ${sender.lastName}`
              : sender.username;

          await sendStudioInvitationEmail({
            toEmail: invitedUser.email,
            studioName: studio.name,
            studioLogo: studio.logo,
            senderName: senderName,
            invitationToken: existing.invitationToken,
          });

          await supabase
            .from("studio_members")
            .update({ invitedAt: now })
            .eq("id", existing.id);

          return { success: true, invitationId: existing.id };
        }
      }

      console.error("Error creating studio member:", createError);
      return { success: false, error: createError.message };
    }

    if (!newMember) {
      return { success: false, error: "Failed to create invitation" };
    }

    // Send invitation email
    const senderName =
      sender.firstName && sender.lastName
        ? `${sender.firstName} ${sender.lastName}`
        : sender.username;

    const emailResult = await sendStudioInvitationEmail({
      toEmail: invitedUser.email,
      studioName: studio.name,
      studioLogo: studio.logo,
      senderName: senderName,
      invitationToken: invitationToken,
    });

    if (!emailResult.success) {
      console.error("Failed to send invitation email:", emailResult.error);
      // Don't fail the whole operation if email fails - invitation is still created
    }

    // Create notification
    await supabase.from("notifications").insert({
      id: generateUUID(),
      senderId: params.invitedByUserId,
      receiverId: params.invitedUserId,
      type: "STUDIO_INVITATION",
      title: "Studio Invitation",
      content: `You've been invited to join ${studio.name}`,
      data: {
        studioId: params.studioId,
        invitationToken: invitationToken,
        studioName: studio.name,
        senderName: senderName,
      },
    });

    return { success: true, invitationId: newMember.id };
  } catch (error: any) {
    console.error("Error in inviteArtistToStudio:", error);
    return { success: false, error: error.message || "Failed to invite artist" };
  }
}

/**
 * Accept studio invitation
 */
export async function acceptStudioInvitation(
  token: string,
  userId: string
): Promise<{
  success: boolean;
  studioId?: string;
  studioName?: string;
  error?: string;
}> {
  try {
    // Find invitation by token and userId
    const { data: invitation, error: findError } = await supabase
      .from("studio_members")
      .select("id, studioId, status, invitationToken")
      .eq("invitationToken", token)
      .eq("userId", userId)
      .single();

    if (findError || !invitation) {
      return { success: false, error: "Invalid or expired invitation token" };
    }

    if (invitation.status !== "PENDING") {
      return {
        success: false,
        error:
          invitation.status === "ACCEPTED"
            ? "Invitation has already been accepted"
            : "Invitation has been rejected",
      };
    }

    // Update to ACCEPTED
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("studio_members")
      .update({
        status: "ACCEPTED",
        isActive: true,
        acceptedAt: now,
        joinedAt: now,
        invitationToken: null, // Clear token
      })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Error accepting invitation:", updateError);
      return { success: false, error: updateError.message };
    }

    // Get studio info
    const { data: studio } = await supabase
      .from("studios")
      .select("id, name, ownerId")
      .eq("id", invitation.studioId)
      .single();

    // Get artist info for notification
    const { data: artistProfile } = await supabase
      .from("artist_profiles")
      .select("id, userId, user:users(firstName, lastName, username)")
      .eq("userId", userId)
      .single();

    // Create notification to studio owner/manager
    if (studio) {
      // Get owner userId
      const { data: ownerProfile } = await supabase
        .from("artist_profiles")
        .select("userId")
        .eq("id", studio.ownerId)
        .single();

      if (ownerProfile && artistProfile) {
        const artistName =
          artistProfile.user[0]?.firstName && artistProfile.user[0]?.lastName
            ? `${artistProfile.user[0]?.firstName} ${artistProfile.user[0]?.lastName}`
            : artistProfile.user[0]?.username || "An artist";

        await supabase.from("notifications").insert({
          id: generateUUID(),
          senderId: userId,
          receiverId: ownerProfile.userId,
          type: "STUDIO_INVITATION",
          title: "Artist Joined Studio",
          content: `${artistName} has accepted your invitation to join ${studio.name}`,
          data: {
            studioId: studio.id,
            artistId: artistProfile.id,
            artistName: artistName,
          },
        });
      }
    }

    return {
      success: true,
      studioId: invitation.studioId,
      studioName: studio?.name,
    };
  } catch (error: any) {
    console.error("Error in acceptStudioInvitation:", error);
    return { success: false, error: error.message || "Failed to accept invitation" };
  }
}

/**
 * Reject studio invitation
 */
export async function rejectStudioInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find invitation by token and userId
    const { data: invitation, error: findError } = await supabase
      .from("studio_members")
      .select("id, status")
      .eq("invitationToken", token)
      .eq("userId", userId)
      .single();

    if (findError || !invitation) {
      return { success: false, error: "Invalid or expired invitation token" };
    }

    if (invitation.status !== "PENDING") {
      return { success: false, error: "Invitation is no longer pending" };
    }

    // Update to REJECTED
    const { error: updateError } = await supabase
      .from("studio_members")
      .update({
        status: "REJECTED",
        invitationToken: null, // Clear token
      })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Error rejecting invitation:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in rejectStudioInvitation:", error);
    return { success: false, error: error.message || "Failed to reject invitation" };
  }
}

/**
 * Get studio members and pending invitations
 */
export async function getStudioMembers(
  studioId: string,
  userId: string
): Promise<{
  data?: { accepted: StudioMember[]; pending: StudioMember[]; rejected: StudioMember[] };
  error?: string;
}> {
  try {
    // Verify user has permission
    const permissionCheck = await verifyStudioPermission(studioId, userId);

    if (!permissionCheck.hasPermission) {
      return { error: permissionCheck.error || "Insufficient permissions" };
    }

    // Get all members with user and artist data
    const { data: members, error } = await supabase
      .from("studio_members")
      .select(
        `
        id,
        userId,
        artistId,
        role,
        status,
        invitedAt,
        acceptedAt,
        joinedAt,
        user:users!studio_members_userId_fkey(
          email,
          username,
          avatar,
          firstName,
          lastName,
          locations:user_locations(
            isPrimary,
            municipality:municipalities(name),
            province:provinces(name, code)
          ),
          subscriptions:user_subscriptions!user_subscriptions_userId_fkey(
            status,
            endDate,
            plan:subscription_plans(type)
          )
        ),
        artist:artist_profiles!studio_members_artistId_fkey(
          businessName,
          studioAddress
        ),
        inviter:users!studio_members_invitedBy_fkey(
          firstName,
          lastName,
          username
        )
      `
      )
      .eq("studioId", studioId)
      .eq("isActive", true)
      .order("joinedAt", { ascending: false, nullsFirst: false })
      .order("invitedAt", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Error fetching studio members:", error);
      return { error: error.message };
    }

    // Group by status
    const accepted: StudioMember[] = [];
    const pending: StudioMember[] = [];
    const rejected: StudioMember[] = [];

    members?.forEach((member: any) => {
      // Get primary location
      const primaryLocation = member.user?.locations?.find((loc: any) => loc.isPrimary);
      
      // Format province: check if province is an object with name/code, or just a string
      let provinceText = "";
      if (primaryLocation?.province) {
        if (typeof primaryLocation.province === "object") {
          // Province is an object with name and code
          const provName = primaryLocation.province.name;
          const provCode = primaryLocation.province.code;
          if (provName && provCode) {
            provinceText = `${provName} (${provCode})`;
          } else if (provName) {
            provinceText = provName;
          } else if (provCode) {
            provinceText = provCode;
          }
        } else {
          // Province is just a string (code)
          provinceText = primaryLocation.province;
        }
      }
      
      const location = primaryLocation
        ? {
            municipality: primaryLocation.municipality?.name || "",
            province: provinceText,
          }
        : null;

      // Get active subscription plan type
      const activeSubscription = member.user?.subscriptions?.find(
        (sub: any) => sub.status === "ACTIVE" && (!sub.endDate || new Date(sub.endDate) > new Date())
      );
      const planType = activeSubscription?.plan?.type || null;

      const memberData: StudioMember = {
        id: member.id,
        userId: member.userId,
        artistId: member.artistId,
        role: member.role,
        status: member.status,
        invitedAt: member.invitedAt,
        acceptedAt: member.acceptedAt,
        joinedAt: member.joinedAt,
        user: {
          email: member.user?.email || "",
          username: member.user?.username || "",
          avatar: member.user?.avatar,
          firstName: member.user?.firstName,
          lastName: member.user?.lastName,
        },
        artist: {
          businessName: member.artist?.businessName || null,
        },
        inviter: member.inviter
          ? {
              firstName: member.inviter.firstName,
              lastName: member.inviter.lastName,
              username: member.inviter.username,
            }
          : null,
        location,
        planType,
      };

      if (member.status === "ACCEPTED") {
        accepted.push(memberData);
      } else if (member.status === "PENDING") {
        pending.push(memberData);
      } else if (member.status === "REJECTED") {
        rejected.push(memberData);
      }
    });

    return { data: { accepted, pending, rejected } };
  } catch (error: any) {
    console.error("Error in getStudioMembers:", error);
    return { error: error.message || "Failed to fetch studio members" };
  }
}

/**
 * Resend invitation email
 */
export async function resendInvitation(
  invitationId: string,
  invitedByUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get invitation details
    const { data: invitation, error: findError } = await supabase
      .from("studio_members")
      .select("studioId, userId, invitationToken, status")
      .eq("id", invitationId)
      .single();

    if (findError || !invitation) {
      return { success: false, error: "Invitation not found" };
    }

    if (invitation.status !== "PENDING") {
      return { success: false, error: "Invitation is no longer pending" };
    }

    if (!invitation.invitationToken) {
      return { success: false, error: "Invalid invitation token" };
    }

    // Verify permission
    const permissionCheck = await verifyStudioPermission(
      invitation.studioId,
      invitedByUserId
    );

    if (!permissionCheck.hasPermission) {
      return { success: false, error: permissionCheck.error || "Insufficient permissions" };
    }

    // Get studio and sender info
    const { data: studio } = await supabase
      .from("studios")
      .select("name, logo")
      .eq("id", invitation.studioId)
      .single();

    const { data: sender } = await supabase
      .from("users")
      .select("firstName, lastName, username")
      .eq("id", invitedByUserId)
      .single();

    const { data: invitedUser } = await supabase
      .from("users")
      .select("email")
      .eq("id", invitation.userId)
      .single();

    if (!studio || !sender || !invitedUser) {
      return { success: false, error: "Failed to fetch required information" };
    }

    const senderName =
      sender.firstName && sender.lastName
        ? `${sender.firstName} ${sender.lastName}`
        : sender.username;

    // Resend email
    const emailResult = await sendStudioInvitationEmail({
      toEmail: invitedUser.email,
      studioName: studio.name,
      studioLogo: studio.logo,
      senderName: senderName,
      invitationToken: invitation.invitationToken,
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || "Failed to send email" };
    }

    // Update invitedAt timestamp
    await supabase
      .from("studio_members")
      .update({ invitedAt: new Date().toISOString() })
      .eq("id", invitationId);

    return { success: true };
  } catch (error: any) {
    console.error("Error in resendInvitation:", error);
    return { success: false, error: error.message || "Failed to resend invitation" };
  }
}

/**
 * Remove studio member
 */
export async function removeStudioMember(
  studioId: string,
  memberId: string,
  removedByUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify permission
    const permissionCheck = await verifyStudioPermission(studioId, removedByUserId);

    if (!permissionCheck.hasPermission) {
      return { success: false, error: permissionCheck.error || "Insufficient permissions" };
    }

    // Get member to check if they're the owner
    const { data: member } = await supabase
      .from("studio_members")
      .select("role, userId")
      .eq("id", memberId)
      .single();

    if (member?.role === "OWNER") {
      return { success: false, error: "Cannot remove studio owner" };
    }

    // Soft delete: set isActive to false
    const { error: updateError } = await supabase
      .from("studio_members")
      .update({ isActive: false })
      .eq("id", memberId);

    if (updateError) {
      console.error("Error removing studio member:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in removeStudioMember:", error);
    return { success: false, error: error.message || "Failed to remove member" };
  }
}

/**
 * Update member role (OWNER only)
 */
export async function updateMemberRole(
  studioId: string,
  memberId: string,
  newRole: "MANAGER" | "MEMBER",
  updatedByUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify permission - only OWNER can update roles
    const permissionCheck = await verifyStudioPermission(studioId, updatedByUserId);

    if (!permissionCheck.hasPermission || permissionCheck.role !== "OWNER") {
      return { success: false, error: "Only studio owner can update member roles" };
    }

    // Cannot change owner role
    const { data: member } = await supabase
      .from("studio_members")
      .select("role")
      .eq("id", memberId)
      .single();

    if (member?.role === "OWNER") {
      return { success: false, error: "Cannot change owner role" };
    }

    // Update role
    const { error: updateError } = await supabase
      .from("studio_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (updateError) {
      console.error("Error updating member role:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in updateMemberRole:", error);
    return { success: false, error: error.message || "Failed to update member role" };
  }
}

