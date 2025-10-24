import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyScreen() {
  // No logic - just show loading while deepLinking.ts handles verification
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center">
      <LoadingSpinner message="Verifying your email..." overlay />
    </SafeAreaView>
  );
}
