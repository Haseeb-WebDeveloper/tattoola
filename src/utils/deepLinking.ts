import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useSignupStore } from "../stores/signupStore";
import { logger } from "./logger";
import { supabase } from "./supabase";

export function initializeDeepLinking() {
  // Ensure we only handle the initial URL once (to avoid unwanted redirects
  // when the app returns to foreground, e.g. after picking media).
  let hasHandledInitialUrl = false;

  // Handle deep links when app is already running
  const handleDeepLink = async (url: string) => {
    try {
      const urlObj = new URL(url);

      // Check for PKCE code first (most common case)
      const code = urlObj.searchParams.get("code");
      if (code) {
        try {
          // Exchange the code for a session
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            logger.error(
              "Deep link: code exchange failed:",
              exchangeError.message
            );
            router.replace("/(auth)/welcome");
            return;
          }

          if (!data || !data.user) {
            logger.error("Deep link: code exchange returned no user data");
            router.replace("/(auth)/welcome");
            return;
          }

          // Get user role from metadata
          const authUser: any = data.user;
          const role =
            authUser?.user_metadata?.displayName === "AR"
              ? "ARTIST"
              : "TATTOO_LOVER";
          const userId = authUser?.id;
          // Check if profile exists in users table
          const { data: existingUser } = await supabase
            .from("users")
            .select("id, firstName")
            .eq("id", userId)
            .maybeSingle();

          const hasCompletedProfile = !!(
            existingUser && existingUser.firstName
          );

          // Clear signup state since email is now verified
          useSignupStore.getState().reset();

          // Small delay to allow auth state to settle before navigation
          setTimeout(() => {
            // Route based on profile completion and role
            if (hasCompletedProfile) {
              router.replace("/(tabs)");
            } else {
              // Route to registration based on role
              if (role === "ARTIST") {
                router.replace("/(auth)/artist-registration/step-3");
              } else {
                router.replace("/(auth)/user-registration/step-3");
              }
            }
          }, 300);
        } catch (error) {
          logger.error("Deep link: exception during code exchange:", error);
          router.replace("/(auth)/welcome");
        }

        return;
      }

      // Case 2: Token-based verification (for email change)
      if (
        url.includes("supabase.co/auth/v1/verify") ||
        url.includes("verify")
      ) {
        const token = urlObj.searchParams.get("token");
        const type = urlObj.searchParams.get("type");
        const redirectTo = urlObj.searchParams.get("redirect_to");
        const message = urlObj.searchParams.get("message");

        // Check for intermediate confirmation message (old email confirmation)
        if (
          message &&
          message
            .toLowerCase()
            .includes("proceed to confirm link sent to the other email")
        ) {
          router.replace("/settings/email-confirmation" as any);
          return;
        }

        // Handle token-based verification (email changes)
        if (token && type) {
          try {
            // Verify the token
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: type as any,
            });

            if (error) {
              logger.error("Deep link: token verification failed:", error);

              // Check if it's an expired or invalid token
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
              // Email change verification completed
              if (type === "email_change") {
                // Small delay to allow Supabase to process the change
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
            }

            router.replace("/settings" as any);
          } catch (error) {
            logger.error("Deep link: error during token verification:", error);
            router.replace("/settings" as any);
          }

          return;
        }

        logger.warn(
          "Token-based verification URL detected but missing token or type parameters"
        );
      }

      // Case 3: Studio invitation link
      if (url.includes("studio-invitation")) {
        console.log("Deep link: studio invitation link detected");
        const token = urlObj.searchParams.get("token");

        if (!token) {
          logger.error(
            "Deep link: studio invitation link missing token parameter"
          );
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData?.session?.user) {
          // User is authenticated - navigate directly to acceptance screen
          const targetRoute = `/(studio-invitation)/accept?token=${token}`;
          try {
            router.replace(targetRoute as any);
          } catch (navError) {
            logger.error("Deep link: navigation error:", navError);
          }
        } else {
          // User not authenticated - store token and redirect to login
          try {
            await AsyncStorage.setItem(
              "pending_studio_invitation_token",
              token
            );
            router.replace("/(auth)/login");
          } catch (storageError) {
            logger.error("Deep link: error storing token:", storageError);
          }
        }
        return;
      }

      // Case 3.5: Payment success/cancel links
      // if (url.includes("payment/success") || url.includes("payment/cancel")) {
      //   const sessionId = urlObj.searchParams.get("session_id");
      //   const isSuccess = url.includes("payment/success");

      //   logger.log(
      //     `Deep link: Payment ${isSuccess ? "success" : "cancel"}`,
      //     sessionId ? `Session ID: ${sessionId}` : "No session ID"
      //   );

      //   // Get user session to check if authenticated
      //   const { data: sessionData } = await supabase.auth.getSession();

      //   if (isSuccess) {
      //     // Payment successful - navigate to appropriate screen
      //     if (sessionData?.session?.user) {
      //       // Check if user has completed profile
      //       const authUser: any = sessionData.session.user;
      //       const { data: existingUser } = await supabase
      //         .from("users")
      //         .select("id, firstName")
      //         .eq("id", authUser.id)
      //         .maybeSingle();

      //       const hasCompletedProfile = !!(existingUser && existingUser.firstName);

      //       // Small delay to allow any webhook processing
      //       setTimeout(() => {
      //         if (hasCompletedProfile) {
      //           // User has profile - go to home
      //           router.replace("/(tabs)");
      //         } else {
      //           // User doesn't have profile - likely completing registration
      //           // Stay on current screen or navigate to next registration step
      //           // The webhook will handle subscription creation
      //           router.replace("/(auth)/artist-registration/checkout" as any);
      //         }
      //       }, 500);
      //     } else {
      //       // Not authenticated - redirect to login
      //       router.replace("/(auth)/login");
      //     }
      //   } else {
      //     // Payment cancelled - stay on checkout screen or go back
      //     // The user is already on the checkout screen, so we can just show a message
      //     // or navigate back if needed
      //     if (sessionData?.session?.user) {
      //       router.replace("/(auth)/artist-registration/checkout" as any);
      //     } else {
      //       router.replace("/(auth)/login");
      //     }
      //   }
      //   return;
      // }

      // Case 4: Just opened via deep link (no code/token) - check if user has session
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData?.session?.user) {
        const authUser: any = sessionData.session.user;
        const role =
          authUser.user_metadata?.displayName === "AR"
            ? "ARTIST"
            : "TATTOO_LOVER";
        const userId = authUser.id;

        // Check if profile exists
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, firstName")
          .eq("id", userId)
          .maybeSingle();

        const hasCompletedProfile = !!(existingUser && existingUser.firstName);

        if (hasCompletedProfile) {
          router.replace("/(tabs)");
        } else {
          if (role === "ARTIST") {
            router.replace("/(auth)/artist-registration/step-3");
          } else {
            router.replace("/(auth)/user-registration/step-3");
          }
        }
        return;
      }
    } catch (e) {
      logger.error("Deep link: error handling deep link:", e);
    } finally {
      // no-op
    }
  };

  // Listen for deep links
  const subscription = Linking.addEventListener("url", ({ url }) => {
    // Ensure URL is valid before processing
    if (!url || typeof url !== "string") {
      logger.error("Invalid URL received:", url);
      return;
    }

    // Fire and forget; no need to block
    handleDeepLink(url).catch((error) => {
      logger.error("Error in handleDeepLink:", error);
    });
  });

  // Handle deep link if app was opened via deep link (only once)
  Linking.getInitialURL().then((url) => {
    if (url && !hasHandledInitialUrl) {
      hasHandledInitialUrl = true;
      handleDeepLink(url);
    }
  });

  // On Android/Resume cases, sometimes the URL event can be missed.
  // As a safety net, when app becomes active, re-check getInitialURL once.
  try {
    const { AppState } = require("react-native");
    const onAppStateChange = async (state: string) => {
      if (state === "active") {
        try {
          const initial = await Linking.getInitialURL();
          // Only handle the stored initial URL once; when app comes back
          // from background (e.g. after selecting media), we don't want
          // to re-trigger deep-link navigation that can kick the user
          // out of the current flow.
          if (initial && !hasHandledInitialUrl) {
            hasHandledInitialUrl = true;
            handleDeepLink(initial);
          }
        } catch (e) {
          logger.error("Deep link: error during safety net getInitialURL:", e);
        }
      }
    };
    const appStateSub = AppState.addEventListener("change", onAppStateChange);
    // Return a combined subscription that also removes app state listener
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
    logger.error("Failed to set AppState safety net for deep links:", e);
  }

  return subscription;
}

export function parseAuthCallback(url: string) {
  try {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get("token");
    const type = urlObj.searchParams.get("type");
    const error = urlObj.searchParams.get("error");
    const errorDescription = urlObj.searchParams.get("error_description");

    return {
      token,
      type,
      error,
      errorDescription,
    };
  } catch (error) {
    logger.error("Error parsing auth callback URL:", error);
    return null;
  }
}
