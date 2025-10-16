import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyEmailScreen() {
  const { verifyEmail } = useAuth();
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

      if (!token || type !== "signup") {
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

      // Verify the email with the token
      console.log(
        "📞 VerifyEmailScreen.handleEmailVerification: Calling verifyEmail"
      );
      await verifyEmail(token);
      console.log(
        "✅ VerifyEmailScreen.handleEmailVerification: Email verification successful"
      );

      // If we get here, verification was successful
      console.log(
        "🎉 VerifyEmailScreen.handleEmailVerification: Showing success alert"
      );
      Alert.alert(
        "Email Verified!",
        "Your email has been successfully verified. You can now complete your profile.",
        [
          {
            text: "Continue",
            onPress: () => {
              console.log(
                "📧 VerifyEmailScreen.handleEmailVerification: Navigating to email confirmation"
              );
              // The AuthProvider will handle the redirect based on user role
              router.replace("/(auth)/email-confirmation");
            },
          },
        ]
      );
    } catch (err) {
      console.error(
        "❌ VerifyEmailScreen.handleEmailVerification: Verification failed",
        err
      );
      const errorMessage =
        err instanceof Error ? err.message : "Failed to verify email";
      setError(errorMessage);
      Alert.alert("Verification Failed", errorMessage, [
        {
          text: "Try Again",
          onPress: () => {
            console.log(
              "🔄 VerifyEmailScreen.handleEmailVerification: Navigating to login"
            );
            router.replace("/(auth)/login");
          },
        },
      ]);
    } finally {
      console.log(
        "🏁 VerifyEmailScreen.handleEmailVerification: Setting loading to false"
      );
      setLoading(false);
    }
  }, [verifyEmail, searchParams]);

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
