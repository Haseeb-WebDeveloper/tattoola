import { useAuth } from "@/providers/AuthProvider";
import { Text, TouchableOpacity, View } from "react-native";

export default function SearchScreen() {
  const { user, logout } = useAuth();
  return (
    <View className="flex-1 items-center justify-center bg-primary">
      <TouchableOpacity onPress={() => logout()}>
        <Text className="text-xl font-bold text-primary-foreground">Log out</Text>
      </TouchableOpacity>
    </View>
  );
}
