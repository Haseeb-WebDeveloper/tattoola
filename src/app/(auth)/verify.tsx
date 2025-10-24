import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyScreen() {
  const params = useLocalSearchParams();
  
  useEffect(() => {
    console.log('');
    console.log('📧 ==========================================');
    console.log('📧 VERIFY SCREEN MOUNTED');
    console.log('📧 Params:', params);
    console.log('📧 All params:', JSON.stringify(params, null, 2));
    console.log('📧 Timestamp:', new Date().toISOString());
    console.log('📧 ==========================================');
    console.log('');
  }, [params]);
  
  // No logic - just show loading while deepLinking.ts handles verification
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center">
      <LoadingSpinner message="Verifying your email..." overlay />
    </SafeAreaView>
  );
}
