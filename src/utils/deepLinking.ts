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

  // Track processed URLs to prevent double processing
  // Use code parameter as key since that's what matters for PKCE flow
  const processedCodes = new Set<string>();
  const processedUrls = new Set<string>();

  // Track navigation state to prevent multiple navigations
  let isNavigatingToResetPassword = false;

  // Handle deep links when app is already running
  const handleDeepLink = async (url: string) => {
    try {
      const urlObj = new URL(url);

      // Normalize URL for tracking (remove hash, keep pathname and search)
      const normalizedUrl = `${urlObj.origin}${urlObj.pathname}${urlObj.search}`;

      // Check if we've already processed this exact URL
      if (processedUrls.has(normalizedUrl)) {
        logger.log(
          "Deep link: URL already processed, skipping duplicate:",
          normalizedUrl
        );
        return;
      }

      // Check for PKCE code first (most common case)
      const code = urlObj.searchParams.get("code");
      if (code) {
        // Check if we've already processed this code
        if (processedCodes.has(code)) {
          logger.log(
            "Deep link: Code already processed, skipping duplicate code exchange"
          );
          return;
        }

        // Mark code as being processed
        processedCodes.add(code);
        processedUrls.add(normalizedUrl);

        try {
          // Check if this is a password reset flow by examining the URL
          // Handle various URL formats: tattoola://reset-password, tattoola://(auth)/reset-password, etc.
          const urlLower = url.toLowerCase();
          const isPasswordReset =
            urlLower.includes("reset-password") ||
            urlLower.includes("reset_password") ||
            urlObj.pathname.toLowerCase().includes("reset-password") ||
            urlObj.pathname.toLowerCase().includes("reset_password");

          // Exchange the code for a session
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            logger.error(
              "Deep link: code exchange failed:",
              exchangeError.message
            );
            // If password reset, route to reset-password screen with error
            // But only if we haven't already navigated
            if (isPasswordReset && !isNavigatingToResetPassword) {
              isNavigatingToResetPassword = true;
              router.replace("/(auth)/reset-password");
              setTimeout(() => {
                isNavigatingToResetPassword = false;
              }, 2000);
            } else if (!isPasswordReset) {
              router.replace("/(auth)/welcome");
            }
            return;
          }

          if (!data || !data.user) {
            logger.error("Deep link: code exchange returned no user data");
            // If password reset, route to reset-password screen with error
            // But only if we haven't already navigated
            if (isPasswordReset && !isNavigatingToResetPassword) {
              isNavigatingToResetPassword = true;
              router.replace("/(auth)/reset-password");
              setTimeout(() => {
                isNavigatingToResetPassword = false;
              }, 2000);
            } else if (!isPasswordReset) {
              router.replace("/(auth)/welcome");
            }
            return;
          }

          // If this is a password reset flow, route directly to reset-password screen
          if (isPasswordReset) {
            // Prevent multiple navigations to reset-password screen
            if (isNavigatingToResetPassword) {
              logger.log(
                "Deep link: Already navigating to reset-password, skipping duplicate navigation"
              );
              return;
            }

            isNavigatingToResetPassword = true;
            logger.log(
              "Deep link: Password reset flow detected, routing to reset-password screen"
            );
            // Small delay to allow auth state to settle before navigation
            setTimeout(() => {
              router.replace("/(auth)/reset-password");
              // Reset flag after navigation (with delay to prevent rapid re-navigation)
              setTimeout(() => {
                isNavigatingToResetPassword = false;
              }, 2000);
            }, 300);
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
          // Check if this was a password reset flow
          const urlLower = url.toLowerCase();
          const isPasswordReset =
            urlLower.includes("reset-password") ||
            urlLower.includes("reset_password") ||
            urlObj.pathname.toLowerCase().includes("reset-password") ||
            urlObj.pathname.toLowerCase().includes("reset_password");
          // Only navigate if we haven't already navigated
          if (isPasswordReset && !isNavigatingToResetPassword) {
            isNavigatingToResetPassword = true;
            router.replace("/(auth)/reset-password");
            setTimeout(() => {
              isNavigatingToResetPassword = false;
            }, 2000);
          } else if (!isPasswordReset) {
            router.replace("/(auth)/welcome");
          }
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
        // console.log("Deep link: studio invitation link detected");
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
      if (url.includes("payment/success") || url.includes("payment/cancel")) {
        const sessionId = urlObj.searchParams.get("session_id");
        const isSuccess = url.includes("payment/success");

        logger.log(
          `🎯 Deep link: Payment ${isSuccess ? "SUCCESS" : "CANCELLED"}`,
          sessionId ? `Session ID: ${sessionId}` : "No session ID"
        );

        // Get user session to check if authenticated
        const { data: sessionData } = await supabase.auth.getSession();

        if (isSuccess && sessionData?.session?.user) {
          // Payment successful and user authenticated
          const authUser: any = sessionData.session.user;
          logger.log("✅ User authenticated, proceeding with profile creation");

          // Check if user has completed profile
          const { data: existingUser } = await supabase
            .from("users")
            .select("id, firstName")
            .eq("id", authUser.id)
            .maybeSingle();

          const hasCompletedProfile = !!(
            existingUser && existingUser.firstName
          );

          if (hasCompletedProfile) {
            // User already has profile - go to home
            logger.log("✅ Profile already exists, redirecting to home");
            router.replace("/(tabs)");
            return;
          }

          // User doesn't have profile - complete artist registration after payment
          logger.log("📝 No profile found, starting profile creation");

          try {
            // Import the store and services dynamically
            const { useArtistRegistrationV2Store } = await import(
              "@/stores/artistRegistrationV2Store"
            );
            const { AuthService } = await import("@/services/auth.service");
            const { WorkArrangement } = await import("@/types/auth");

            const store = useArtistRegistrationV2Store.getState();
            const {
              step3,
              step4,
              step5,
              step7,
              step8,
              step9,
              step10,
              step11,
              step12: step12State,
            } = store;

            // Check if we have registration data
            if (!step3.firstName) {
              logger.warn("❌ No registration data found in store");
              router.replace("/(auth)/artist-registration/step-3");
              return;
            }

            logger.log("📋 Building registration data from store");
            const registrationData = {
              step3: {
                firstName: step3.firstName || "",
                lastName: step3.lastName || "",
                avatar: step3.avatar || "",
              },
              step4: {
                workArrangement:
                  step4.workArrangement || WorkArrangement.FREELANCE,
              },
              step5: {
                studioName: step5.studioName || "",
                province: step5.province || "",
                provinceId: step5.provinceId || "",
                municipalityId: step5.municipalityId || "",
                municipality: step5.municipality || "",
                studioAddress: step5.studioAddress || "",
                website: step5.website || "",
                phone: step5.phone || "",
              },
              step6: {
                certificateUrl: step4.certificateUrl || "",
              },
              step7: {
                bio: step7.bio || "",
                instagram: step7.instagram || "",
                tiktok: step7.tiktok || "",
              },
              step8: {
                styles: step8.styles || [],
                favoriteStyles: step8.favoriteStyles || [],
              },
              step9: {
                servicesOffered: step9.servicesOffered || [],
              },
              step10: {
                bodyParts: step10.bodyParts || [],
              },
              step11: {
                minimumPrice: step11.minimumPrice || 0,
                hourlyRate: step11.hourlyRate || 0,
              },
              step12: {
                projects: (step12State.projects || []).map((project, index) => {
                  let stylesArray: string[] = [];
                  if (project.associatedStyles) {
                    if (Array.isArray(project.associatedStyles)) {
                      stylesArray = project.associatedStyles.filter(
                        (s) => s && typeof s === "string"
                      );
                    } else if (typeof project.associatedStyles === "string") {
                      stylesArray = [project.associatedStyles];
                    }
                  }
                  return {
                    title: project.title,
                    description: project.description,
                    photos: project.photos || [],
                    videos: project.videos || [],
                    associatedStyles: stylesArray,
                    order: index + 1,
                  };
                }),
              },
              step13: {
                selectedPlanId: "",
                billingCycle: "MONTHLY" as "MONTHLY" | "YEARLY",
              },
            };

            logger.log("🚀 Calling completeArtistRegistration");

            // Complete artist registration - NO subscription check anymore
            const user =
              await AuthService.completeArtistRegistration(registrationData);

            logger.log("✅ Profile created successfully:", user.id);

            // Clear registration store
            store.reset();

            // Redirect to profile
            logger.log("📍 Redirecting to profile");
            router.replace("/(tabs)/profile");
          } catch (error: any) {
            logger.error("❌ Profile creation failed:", error);

            // Handle duplicate profile error
            if (
              error.message?.includes("duplicate") ||
              error.message?.includes("already exists")
            ) {
              logger.log("✅ Profile already exists, redirecting to home");
              router.replace("/(tabs)/profile");
              return;
            }

            // For other errors, redirect to step-3
            logger.log("❌ Unknown error, redirecting to step-3");
            router.replace("/(auth)/artist-registration/step-3");
          }
        } else if (!sessionData?.session?.user) {
          // Not authenticated - redirect to login
          logger.log("❌ User not authenticated after payment");
          router.replace("/(auth)/login");
        } else {
          // Payment cancelled - redirect to checkout
          logger.log("⚠️ Payment cancelled");
          const authUser: any = sessionData.session.user;
          const { data: existingUser } = await supabase
            .from("users")
            .select("id, firstName")
            .eq("id", authUser.id)
            .maybeSingle();

          if (existingUser?.firstName) {
            router.replace("/(tabs)");
          } else {
            router.replace("/(auth)/artist-registration/checkout" as any);
          }
        }
        return;
      }

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
    }
  };

  // Listen for deep links
  const subscription = Linking.addEventListener("url", ({ url }) => {
    // Ensure URL is valid before processing
    if (!url || typeof url !== "string") {
      logger.error("Invalid URL received:", url);
      return;
    }

    // Normalize URL immediately to check if already processed (before async operations)
    let normalizedUrl: string | null = null;
    try {
      const urlObj = new URL(url);
      normalizedUrl = `${urlObj.origin}${urlObj.pathname}${urlObj.search}`;

      // Check if already processed BEFORE calling handleDeepLink
      if (processedUrls.has(normalizedUrl)) {
        logger.log(
          "Deep link: URL already processed in event listener, skipping:",
          normalizedUrl
        );
        return;
      }
    } catch (e) {
      // If URL parsing fails, continue anyway but log it
      logger.warn("Deep link: Failed to parse URL for duplicate check:", e);
    }

    // Check if this is the initial URL that was already handled
    // This prevents the event listener from processing the same URL twice
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl === url && hasHandledInitialUrl) {
        logger.log(
          "Deep link: URL event matches initial URL that was already handled, skipping"
        );
        return;
      }

      // Process the URL
      handleDeepLink(url).catch((error) => {
        logger.error("Error in handleDeepLink:", error);
      });
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
