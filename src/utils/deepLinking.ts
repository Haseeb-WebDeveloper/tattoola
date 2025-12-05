import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useSignupStore } from "../stores/signupStore";
import { logger } from "./logger";
import { supabase } from "./supabase";

export function initializeDeepLinking() {
  let hasHandledInitialUrl = false;

  const handleDeepLink = async (url: string) => {
    try {
      // Decode URL to handle encoded characters like %28 and %29
      const decodedUrl = decodeURIComponent(url);
      const urlObj = new URL(decodedUrl);

      // ============================================
      // Case 1: PKCE Code (Email verification via code, OAuth)
      // ============================================
      const code = urlObj.searchParams.get("code");
      if (code) {
        try {
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            logger.error("Code exchange failed:", exchangeError.message);
            router.replace("/(auth)/welcome");
            return;
          }

          if (!data || !data.user) {
            logger.error("Code exchange returned no user data");
            router.replace("/(auth)/welcome");
            return;
          }

          await handleAuthenticatedUser(data.user);
          return;
        } catch (error) {
          logger.error("Exception during code exchange:", error);
          router.replace("/(auth)/welcome");
          return;
        }
      }

      // ============================================
      // Case 2: Token-based flows
      // ============================================
      const token = urlObj.searchParams.get("token");
      const type = urlObj.searchParams.get("type");

      if (token && type) {
        // Case 2a: Signup verification (email confirmation)
        if (type === "signup") {
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: "signup",
            });

            if (error) {
              logger.error("Signup verification failed:", error.message);
              router.replace("/(auth)/welcome");
              return;
            }

            if (!data || !data.user) {
              logger.error("Signup verification returned no user");
              router.replace("/(auth)/welcome");
              return;
            }

            await handleAuthenticatedUser(data.user);
            return;
          } catch (error) {
            logger.error("Exception during signup verification:", error);
            router.replace("/(auth)/welcome");
            return;
          }
        }

        // Case 2b: Password reset (recovery)
        if (type === "recovery") {
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: "recovery",
            });

            if (error) {
              logger.error("Password reset verification failed:", error.message);
              router.replace("/(auth)/login");
              return;
            }

            if (data?.session) {
              // User is authenticated, navigate to reset password screen
              setTimeout(() => {
                router.replace("/(auth)/reset-password" as any);
              }, 300);
              return;
            }
          } catch (error) {
            logger.error("Exception during password reset:", error);
            router.replace("/(auth)/login");
            return;
          }
        }

        // Case 2c: Email change verification
        if (type === "email_change") {
          const message = urlObj.searchParams.get("message");

          // Check for intermediate confirmation message
          if (
            message &&
            message
              .toLowerCase()
              .includes("proceed to confirm link sent to the other email")
          ) {
            router.replace("/settings/email-confirmation" as any);
            return;
          }

          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: "email_change",
            });

            if (error) {
              logger.error("Email change verification failed:", error);

              if (
                error.message.includes("expired") ||
                error.message.includes("invalid")
              ) {
                router.replace("/settings/email-confirmation" as any);
                setTimeout(() => {
                  if (__DEV__) {
                    alert("This link has expired. Please request a new one.");
                  }
                }, 500);
              } else {
                router.replace("/settings" as any);
              }
              return;
            }

            if (data?.user) {
              setTimeout(() => {
                router.replace("/settings" as any);
                setTimeout(() => {
                  if (__DEV__) {
                    alert("Email successfully updated!");
                  }
                }, 500);
              }, 300);
              return;
            }

            router.replace("/settings" as any);
          } catch (error) {
            logger.error("Exception during email change:", error);
            router.replace("/settings" as any);
          }
          return;
        }

        // Case 2d: Magic link
        if (type === "magiclink") {
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: "magiclink",
            });

            if (error) {
              logger.error("Magic link verification failed:", error.message);
              router.replace("/(auth)/login");
              return;
            }

            if (!data || !data.user) {
              logger.error("Magic link verification returned no user");
              router.replace("/(auth)/login");
              return;
            }

            await handleAuthenticatedUser(data.user);
            return;
          } catch (error) {
            logger.error("Exception during magic link verification:", error);
            router.replace("/(auth)/login");
            return;
          }
        }

        logger.warn("Unknown token type:", type);
      }

      // ============================================
      // Case 3: Studio invitation link
      // ============================================
      if (url.includes("studio-invitation")) {
        const invitationToken = urlObj.searchParams.get("token");

        if (!invitationToken) {
          logger.error("Studio invitation link missing token");
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData?.session?.user) {
          const targetRoute = `/(studio-invitation)/accept?token=${invitationToken}`;
          router.replace(targetRoute as any);
        } else {
          await AsyncStorage.setItem(
            "pending_studio_invitation_token",
            invitationToken
          );
          router.replace("/(auth)/login");
        }
        return;
      }

      // ============================================
      // Case 4: Fallback - check session and route accordingly
      // ============================================
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData?.session?.user) {
        await handleAuthenticatedUser(sessionData.session.user);
      }
    } catch (e) {
      logger.error("Deep link error:", e);
    }
  };

  // Helper function to handle authenticated user routing
  const handleAuthenticatedUser = async (user: any) => {
    try {
      const role =
        user?.user_metadata?.displayName === "AR" ? "ARTIST" : "TATTOO_LOVER";
      const userId = user?.id;

      // Check if profile exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, firstName")
        .eq("id", userId)
        .maybeSingle();

      const hasCompletedProfile = !!(existingUser && existingUser.firstName);

      // Clear signup state since verification is complete
      useSignupStore.getState().reset();

      // Small delay to allow auth state to settle
      setTimeout(() => {
        if (hasCompletedProfile) {
          router.replace("/(tabs)");
        } else {
          if (role === "ARTIST") {
            router.replace("/(auth)/artist-registration/step-3");
          } else {
            router.replace("/(auth)/user-registration/step-3");
          }
        }
      }, 300);
    } catch (error) {
      logger.error("Error handling authenticated user:", error);
      router.replace("/(auth)/welcome");
    }
  };

  // Listen for deep links
  const subscription = Linking.addEventListener("url", ({ url }) => {
    if (!url || typeof url !== "string") {
      logger.error("Invalid URL received:", url);
      return;
    }

    handleDeepLink(url).catch((error) => {
      logger.error("Error in handleDeepLink:", error);
    });
  });

  // Handle initial URL
  Linking.getInitialURL().then((url) => {
    if (url && !hasHandledInitialUrl) {
      hasHandledInitialUrl = true;
      handleDeepLink(url);
    }
  });

  // Safety net for Android/Resume cases
  try {
    const { AppState } = require("react-native");
    const onAppStateChange = async (state: string) => {
      if (state === "active") {
        try {
          const initial = await Linking.getInitialURL();
          if (initial && !hasHandledInitialUrl) {
            hasHandledInitialUrl = true;
            handleDeepLink(initial);
          }
        } catch (e) {
          logger.error("Error during safety net getInitialURL:", e);
        }
      }
    };

    const appStateSub = AppState.addEventListener("change", onAppStateChange);

    const originalRemove = subscription.remove;
    (subscription as any).remove = () => {
      try {
        appStateSub.remove();
      } catch {}
      try {
        originalRemove.call(subscription);
      } catch {}
    };
  } catch (e) {
    logger.error("Failed to set AppState safety net:", e);
  }

  return subscription;
}

export function parseAuthCallback(url: string) {
  try {
    const decodedUrl = decodeURIComponent(url);
    const urlObj = new URL(decodedUrl);
    const token = urlObj.searchParams.get("token");
    const type = urlObj.searchParams.get("type");
    const code = urlObj.searchParams.get("code");
    const error = urlObj.searchParams.get("error");
    const errorDescription = urlObj.searchParams.get("error_description");

    return {
      token,
      type,
      code,
      error,
      errorDescription,
    };
  } catch (error) {
    logger.error("Error parsing auth callback URL:", error);
    return null;
  }
}