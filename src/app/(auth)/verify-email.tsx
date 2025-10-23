import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { supabase } from "@/utils/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function VerifyEmailScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useLocalSearchParams();

  useEffect(() => {
    console.log("VerifyEmailScreen useEffect");
    handleEmailVerification();
  }, []);

  const handleEmailVerification = useCallback(async () => {
    console.log(
      "🚀 VerifyEmailScreen.handleEmailVerification: Starting email verification"
    );

    try {
      setLoading(true);
      setError(null);

      // Get the verification token from the URL parameters
      const token = searchParams.token as string;
      const type = searchParams.type as string;

      console.log(
        "🔐 VerifyEmailScreen.handleEmailVerification: URL parameters",
        {
          hasToken: !!token,
          tokenLength: token?.length,
          type: type,
        }
      );

      if (!token) {
        console.error(
          "❌ VerifyEmailScreen.handleEmailVerification: Invalid verification link",
          {
            hasToken: !!token,
            type: type,
          }
        );
        throw new Error("Invalid verification link");
      }

      console.log(
        "✅ VerifyEmailScreen.handleEmailVerification: Token validation passed"
      );

      // Handle different verification types
      if (type === "email_change" || type === "emailChange") {
        console.log(
          "📧 VerifyEmailScreen.handleEmailVerification: Handling email change"
        );
        
        // For email change, exchange the code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(token);
        
        if (error) {
          console.error("❌ Email change verification failed:", error);
          throw new Error(error.message || "Failed to verify email change");
        }

        console.log(
          "✅ VerifyEmailScreen.handleEmailVerification: Email change successful"
        );
        
        // Update the custom users table with new email
        if (data.user?.email) {
          const { error: updateError } = await supabase
            .from("users")
            .update({ email: data.user.email })
            .eq("id", data.user.id);

          if (updateError) {
            console.error("❌ Failed to update custom users table:", updateError);
          } else {
            console.log("✅ Custom users table updated successfully");
          }
        }

        toast.success("Your email has been successfully updated!");
        setTimeout(() => {
          router.replace("/settings" as any);
        }, 1000);
      } else if (type === "signup") {
        // Handle signup verification with role-based routing
        console.log(
          "📧 VerifyEmailScreen.handleEmailVerification: Handling signup verification"
        );
        
        // Exchange the code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(token);
        
        if (error) {
          console.error("❌ Signup verification failed:", error);
          throw new Error(error.message || "Failed to verify signup");
        }

        console.log(
          "✅ VerifyEmailScreen.handleEmailVerification: Signup verification successful"
        );
        
        // Get user role from metadata
        const authUser: any = data.user;
        const role = authUser?.user_metadata?.displayName === "AR" ? "ARTIST" : "TATTOO_LOVER";
        const userId = authUser?.id;
        
        console.log("👤 User verified:", { userId, role });

        // Check if profile exists in users table
        console.log("📊 Checking if profile exists in users table...");
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, firstName")
          .eq("id", userId)
          .maybeSingle();

        const hasCompletedProfile = !!(existingUser && existingUser.firstName);
        console.log("📊 Profile check result:", { hasCompletedProfile, hasUser: !!existingUser });

        toast.success("Your email has been successfully verified!");

        // Route based on profile completion and role
        setTimeout(() => {
          if (hasCompletedProfile) {
            console.log("🏠 Redirecting to tabs (profile complete)");
            router.replace("/(tabs)");
          } else {
            // Route to registration based on role
            console.log("📝 Redirecting to registration (profile incomplete)");
            if (role === "ARTIST") {
              console.log("🎨 → Artist registration step 3");
              router.replace("/(auth)/artist-registration/step-3");
            } else {
              console.log("💙 → User registration step 3");
              router.replace("/(auth)/user-registration/step-3");
            }
          }
        }, 1000);
      } else {
        console.error(
          "❌ VerifyEmailScreen.handleEmailVerification: Unknown verification type",
          { type }
        );
        throw new Error("Unknown verification type");
      }
    } catch (err) {
      console.error(
        "❌ VerifyEmailScreen.handleEmailVerification: Verification failed",
        err
      );
      const errorMessage =
        err instanceof Error ? err.message : "Failed to verify email";
      setError(errorMessage);
      toast.error(errorMessage);
      setTimeout(() => {
        console.log(
          "🔄 VerifyEmailScreen.handleEmailVerification: Navigating to login"
        );
        router.replace("/(auth)/login");
      }, 1000);
    } finally {
      console.log(
        "🏁 VerifyEmailScreen.handleEmailVerification: Setting loading to false"
      );
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Verifying your email..." overlay />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Verification Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.successContainer}>
        <Text style={styles.successTitle}>Email Verified!</Text>
        <Text style={styles.successMessage}>
          Your email has been successfully verified. You can now complete your
          profile.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#EF4444",
    marginBottom: 16,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
  },
  successContainer: {
    padding: 24,
    alignItems: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 16,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
  },
});