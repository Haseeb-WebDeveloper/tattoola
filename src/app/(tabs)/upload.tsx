import { useAuth } from "@/providers/AuthProvider";
import { useAuthRequiredStore } from "@/stores/authRequiredStore";
import { useFocusEffect, router } from "expo-router";
import { useCallback } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function UploadScreen() {
  const { user } = useAuth();

  // Show auth modal for anonymous users only when this tab is focused
  useFocusEffect(
    useCallback(() => {
      if (!user) {
        useAuthRequiredStore.getState().show("Sign in to share your tattoos");
      }
      // Cleanup not needed as modal will be dismissed by user action
    }, [user])
  );

  if (!user) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <View className="items-center justify-center flex-1 bg-primary">
      <Text className="mb-4 text-xl font-neueSemibold text-primary-foreground">
        Carica
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/upload/media")}
        className="px-6 py-3 border rounded-full bg-black/30 border-foreground"
      >
        <Text className="text-foreground">Inizia il caricamento</Text>
      </TouchableOpacity>
    </View>
  );
}
