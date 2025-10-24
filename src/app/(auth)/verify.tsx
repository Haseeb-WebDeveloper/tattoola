import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { supabase } from "@/utils/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
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
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <LoadingSpinner message="Verifying your ... from verify-email.tsx" overlay />
        <Text className="bg-red-500 text-white">Please wait while we verify your account</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <View className="flex-1 items-center justify-center">
          <Text className="bg-red-500 text-white">Verification Failed</Text>
          <Text className="bg-red-500 text-white">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background items-center justify-center">
        <View className="flex-1 items-center justify-center">
        <Text className="bg-green-500 text-white">Email Verified!</Text>
        <Text className="bg-green-500 text-white">
          Your email has been successfully verified. You can now complete your
          profile.
        </Text>
      </View>
    </View>
  );
}

