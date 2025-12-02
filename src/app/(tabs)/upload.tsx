import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function UploadScreen() {
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
