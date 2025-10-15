import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function SuccessScreen() {
  const router = useRouter();
  const reset = usePrivateRequestStore((s) => s.reset);

  useEffect(() => {
    return () => {
      // optional: keep state if user goes back
    };
  }, []);

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-foreground tat-body-1 text-center mb-2">🎉 Request Sent Successfully!</Text>
      <TouchableOpacity onPress={() => { reset(); router.back(); }} className="mt-4 bg-primary rounded-full px-6 py-3">
        <Text className="text-white">Close</Text>
      </TouchableOpacity>
    </View>
  );
}


