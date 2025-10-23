import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * This screen serves as a landing page for email verification deep links.
 * It displays a loading state while the deep linking handler (deepLinking.ts)
 * processes the verification code and navigates to the appropriate screen.
 * 
 * The actual verification logic and routing happens in src/utils/deepLinking.ts
 */
export default function VerifyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <LoadingSpinner message="Verifying your email..." overlay />
        <Text style={styles.subtitle}>Please wait while we verify your account</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#100C0C",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  subtitle: {
    marginTop: 16,
    color: "#A49A99",
    fontSize: 14,
    textAlign: "center",
  },
});

