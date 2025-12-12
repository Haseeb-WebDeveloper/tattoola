/**
 * Script to delete a user and all associated data from the database
 *
 * Usage:
 *   npx tsx scripts/delete-user.ts
 *
 * This script will:
 * 1. Find the user by email or username
 * 2. Delete all related data (artist_profiles, subscriptions, portfolio, etc.)
 * 3. Delete the user from auth.users
 * 4. Delete the user from the users table
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env file
dotenv.config({ path: resolve(process.cwd(), ".env") });

// Get Supabase credentials from environment
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// Try service role key first (required for deleting from auth.users)
// Fallback to anon key (may not work for auth deletion)
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in environment variables");
  console.error(
    "Required: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY as fallback)"
  );
  console.error("");
  console.error(
    "Note: SUPABASE_SERVICE_ROLE_KEY is required to delete from auth.users."
  );
  console.error("      If using anon key, auth deletion may fail.");
  process.exit(1);
}

// Warn if using anon key instead of service role key
if (
  !process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
) {
  console.warn(
    "⚠️  WARNING: Using EXPO_PUBLIC_SUPABASE_ANON_KEY instead of SUPABASE_SERVICE_ROLE_KEY"
  );
  console.warn(
    "   Deletion from auth.users may fail. Please add SUPABASE_SERVICE_ROLE_KEY to your .env file."
  );
  console.warn(
    "   You can find it in Supabase Dashboard > Settings > API > service_role key"
  );
  console.warn("");
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// User credentials to delete
const USER_EMAIL = "rangerover2735@gmail.com";
const USERNAME = "artistrahul";

interface DeleteResult {
  success: boolean;
  message: string;
  deletedCount?: number;
}

/**
 * Delete user and all associated data
 */
async function deleteUser(): Promise<void> {
  console.log("🔍 Starting user deletion process...");
  console.log(`📧 Email: ${USER_EMAIL}`);
  console.log(`👤 Username: ${USERNAME}`);
  console.log("");

  try {
    // Step 1: Find the user by email or username
    console.log("Step 1: Finding user in database...");
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, username")
      .or(`email.eq.${USER_EMAIL},username.eq.${USERNAME}`)
      .maybeSingle();

    if (userError) {
      throw new Error(`Error finding user: ${userError.message}`);
    }

    if (!userData) {
      console.log("⚠️  User not found in users table. Checking auth.users...");

      // Try to find in auth.users
      const { data: authUsers, error: authError } =
        await supabase.auth.admin.listUsers();
      if (authError) {
        throw new Error(`Error checking auth.users: ${authError.message}`);
      }

      const authUser = authUsers?.users?.find(
        (u) => u.email === USER_EMAIL || u.user_metadata?.username === USERNAME
      );

      if (!authUser) {
        console.log("✅ User not found in database. Nothing to delete.");
        return;
      }

      // Delete from auth only
      console.log("🗑️  Deleting user from auth.users...");
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
        authUser.id
      );
      if (deleteAuthError) {
        throw new Error(`Error deleting from auth: ${deleteAuthError.message}`);
      }
      console.log("✅ User deleted from auth.users");
      return;
    }

    const userId = userData.id;
    console.log(`✅ User found: ${userData.email} (${userData.username})`);
    console.log(`   User ID: ${userId}`);
    console.log("");

    // Step 2: Get artist profile if exists
    console.log("Step 2: Checking for artist profile...");
    const { data: artistProfile, error: artistError } = await supabase
      .from("artist_profiles")
      .select("id")
      .eq("userId", userId)
      .maybeSingle();

    let artistProfileId: string | null = null;
    if (artistProfile) {
      artistProfileId = artistProfile.id;
      console.log(`✅ Artist profile found: ${artistProfileId}`);
    } else {
      console.log("ℹ️  No artist profile found");
    }
    console.log("");

    // Step 3: Delete related data in correct order (respecting foreign keys)
    if (artistProfileId) {
      console.log("Step 3: Deleting artist-related data...");

      // First, get all portfolio project IDs
      const { data: portfolioProjects, error: projectsFetchError } =
        await supabase
          .from("portfolio_projects")
          .select("id")
          .eq("artistId", artistProfileId);

      if (projectsFetchError) {
        console.warn(
          `⚠️  Error fetching portfolio projects: ${projectsFetchError.message}`
        );
      } else if (portfolioProjects && portfolioProjects.length > 0) {
        const projectIds = portfolioProjects.map((p) => p.id);

        // Delete portfolio project styles
        const { error: projectStylesError } = await supabase
          .from("portfolio_project_styles")
          .delete()
          .in("projectId", projectIds);
        if (projectStylesError) {
          console.warn(
            `⚠️  Error deleting portfolio_project_styles: ${projectStylesError.message}`
          );
        } else {
          console.log("✅ Deleted portfolio project styles");
        }

        // Delete portfolio project media
        const { error: projectMediaError } = await supabase
          .from("portfolio_project_media")
          .delete()
          .in("projectId", projectIds);
        if (projectMediaError) {
          console.warn(
            `⚠️  Error deleting portfolio_project_media: ${projectMediaError.message}`
          );
        } else {
          console.log("✅ Deleted portfolio project media");
        }
      }

      // Delete portfolio projects
      const { error: projectsError } = await supabase
        .from("portfolio_projects")
        .delete()
        .eq("artistId", artistProfileId);
      if (projectsError) {
        console.warn(
          `⚠️  Error deleting portfolio_projects: ${projectsError.message}`
        );
      } else {
        console.log("✅ Deleted portfolio projects");
      }

      // Delete artist banner media
      const { error: bannerMediaError } = await supabase
        .from("artist_banner_media")
        .delete()
        .eq("artistId", artistProfileId);
      if (bannerMediaError) {
        console.warn(
          `⚠️  Error deleting artist_banner_media: ${bannerMediaError.message}`
        );
      } else {
        console.log("✅ Deleted artist banner media");
      }

      // Delete artist body parts
      const { error: bodyPartsError } = await supabase
        .from("artist_body_parts")
        .delete()
        .eq("artistId", artistProfileId);
      if (bodyPartsError) {
        console.warn(
          `⚠️  Error deleting artist_body_parts: ${bodyPartsError.message}`
        );
      } else {
        console.log("✅ Deleted artist body parts");
      }

      // Delete artist services
      const { error: servicesError } = await supabase
        .from("artist_services")
        .delete()
        .eq("artistId", artistProfileId);
      if (servicesError) {
        console.warn(
          `⚠️  Error deleting artist_services: ${servicesError.message}`
        );
      } else {
        console.log("✅ Deleted artist services");
      }

      // Delete artist styles
      const { error: stylesError } = await supabase
        .from("artist_styles")
        .delete()
        .eq("artistId", artistProfileId);
      if (stylesError) {
        console.warn(
          `⚠️  Error deleting artist_styles: ${stylesError.message}`
        );
      } else {
        console.log("✅ Deleted artist styles");
      }

      // Delete studio memberships (if user is a member)
      const { error: studioMembersError } = await supabase
        .from("studio_members")
        .delete()
        .eq("artistId", artistProfileId);
      if (studioMembersError) {
        console.warn(
          `⚠️  Error deleting studio_members: ${studioMembersError.message}`
        );
      } else {
        console.log("✅ Deleted studio memberships");
      }

      // Delete studio (if user owns one)
      const { error: studioError } = await supabase
        .from("studios")
        .delete()
        .eq("ownerId", artistProfileId);
      if (studioError) {
        console.warn(`⚠️  Error deleting studios: ${studioError.message}`);
      } else {
        console.log("✅ Deleted owned studios");
      }

      // Delete artist profile
      const { error: artistProfileError } = await supabase
        .from("artist_profiles")
        .delete()
        .eq("id", artistProfileId);
      if (artistProfileError) {
        throw new Error(
          `Error deleting artist_profile: ${artistProfileError.message}`
        );
      }
      console.log("✅ Deleted artist profile");
      console.log("");
    }

    // Step 4: Delete user-related data
    console.log("Step 4: Deleting user-related data...");

    // Delete user favorite styles
    const { error: favoriteStylesError } = await supabase
      .from("user_favorite_styles")
      .delete()
      .eq("userId", userId);
    if (favoriteStylesError) {
      console.warn(
        `⚠️  Error deleting user_favorite_styles: ${favoriteStylesError.message}`
      );
    } else {
      console.log("✅ Deleted user favorite styles");
    }

    // Delete subscriptions (table is called user_subscriptions)
    const { error: subscriptionsError } = await supabase
      .from("user_subscriptions")
      .delete()
      .eq("userId", userId);
    if (subscriptionsError) {
      // Table might not exist - that's okay, just warn
      if (
        subscriptionsError.message.includes("not find the table") ||
        subscriptionsError.message.includes("does not exist")
      ) {
        console.log(
          "ℹ️  User subscriptions table not found (may not exist in your schema)"
        );
      } else {
        console.warn(
          `⚠️  Error deleting user_subscriptions: ${subscriptionsError.message}`
        );
      }
    } else {
      console.log("✅ Deleted user subscriptions");
    }

    // Delete chat messages (table might not exist or have different name)
    const { error: messagesError } = await supabase
      .from("chat_messages")
      .delete()
      .or(`senderId.eq.${userId},receiverId.eq.${userId}`);
    if (messagesError) {
      if (
        messagesError.message.includes("not find the table") ||
        messagesError.message.includes("does not exist")
      ) {
        console.log(
          "ℹ️  Chat messages table not found (may not exist in your schema)"
        );
      } else {
        console.warn(
          `⚠️  Error deleting chat_messages: ${messagesError.message}`
        );
      }
    } else {
      console.log("✅ Deleted chat messages");
    }

    // Delete chat conversations (table might not exist or have different name)
    const { error: conversationsError } = await supabase
      .from("chat_conversations")
      .delete()
      .or(`user1Id.eq.${userId},user2Id.eq.${userId}`);
    if (conversationsError) {
      if (
        conversationsError.message.includes("not find the table") ||
        conversationsError.message.includes("does not exist")
      ) {
        console.log(
          "ℹ️  Chat conversations table not found (may not exist in your schema)"
        );
      } else {
        console.warn(
          `⚠️  Error deleting chat_conversations: ${conversationsError.message}`
        );
      }
    } else {
      console.log("✅ Deleted chat conversations");
    }

    // Delete posts (uses authorId column, not userId)
    const { error: postsError } = await supabase
      .from("posts")
      .delete()
      .eq("authorId", userId);
    if (postsError) {
      if (postsError.message.includes("does not exist")) {
        // Try with userId as fallback
        const { error: postsErrorFallback } = await supabase
          .from("posts")
          .delete()
          .eq("userId", userId);
        if (postsErrorFallback) {
          console.warn(
            `⚠️  Error deleting posts: ${postsErrorFallback.message}`
          );
        } else {
          console.log("✅ Deleted posts");
        }
      } else {
        console.warn(`⚠️  Error deleting posts: ${postsError.message}`);
      }
    } else {
      console.log("✅ Deleted posts");
    }

    // Delete collections (uses ownerId column, not userId)
    const { error: collectionsError } = await supabase
      .from("collections")
      .delete()
      .eq("ownerId", userId);
    if (collectionsError) {
      if (collectionsError.message.includes("does not exist")) {
        // Try with userId as fallback
        const { error: collectionsErrorFallback } = await supabase
          .from("collections")
          .delete()
          .eq("userId", userId);
        if (collectionsErrorFallback) {
          console.warn(
            `⚠️  Error deleting collections: ${collectionsErrorFallback.message}`
          );
        } else {
          console.log("✅ Deleted collections");
        }
      } else {
        console.warn(
          `⚠️  Error deleting collections: ${collectionsError.message}`
        );
      }
    } else {
      console.log("✅ Deleted collections");
    }

    console.log("");

    // Step 5: Delete user from users table
    console.log("Step 5: Deleting user from users table...");
    const { error: deleteUserError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);
    if (deleteUserError) {
      throw new Error(`Error deleting user: ${deleteUserError.message}`);
    }
    console.log("✅ Deleted user from users table");
    console.log("");

    // Step 6: Delete user from auth.users (requires service role key)
    console.log("Step 6: Deleting user from auth.users...");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(
        "⚠️  WARNING: Cannot delete from auth.users without SUPABASE_SERVICE_ROLE_KEY"
      );
      console.warn(
        "   User has been deleted from database, but auth account still exists."
      );
      console.warn(
        "   To fully delete, add SUPABASE_SERVICE_ROLE_KEY to your .env file and run again."
      );
      console.warn(
        "   Find it in: Supabase Dashboard > Settings > API > service_role key"
      );
      console.log("");
      console.log(
        "🎉 User deletion completed (partial - auth account remains)!"
      );
      console.log(
        `✅ All database data for user ${USER_EMAIL} (${USERNAME}) has been removed.`
      );
      console.log(
        "⚠️  Auth account still exists - add service role key to delete it."
      );
      return;
    }

    const { error: deleteAuthError } =
      await supabase.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      if (
        deleteAuthError.message.includes("not allowed") ||
        deleteAuthError.message.includes("permission") ||
        deleteAuthError.message.includes("User not allowed")
      ) {
        console.warn(
          "⚠️  WARNING: Cannot delete from auth.users - permission denied"
        );
        console.warn(
          "   This usually means you're using anon key instead of service role key."
        );
        console.warn(
          "   User has been deleted from database, but auth account still exists."
        );
        console.warn(
          "   Add SUPABASE_SERVICE_ROLE_KEY to your .env file to fully delete."
        );
        console.log("");
        console.log(
          "🎉 User deletion completed (partial - auth account remains)!"
        );
        console.log(
          `✅ All database data for user ${USER_EMAIL} (${USERNAME}) has been removed.`
        );
        return;
      }
      throw new Error(`Error deleting from auth: ${deleteAuthError.message}`);
    }
    console.log("✅ Deleted user from auth.users");
    console.log("");

    console.log("🎉 User deletion completed successfully!");
    console.log(
      `✅ All data for user ${USER_EMAIL} (${USERNAME}) has been removed.`
    );
  } catch (error) {
    console.error("❌ Error during user deletion:", error);
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the script
deleteUser()
  .then(() => {
    console.log("\n✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
