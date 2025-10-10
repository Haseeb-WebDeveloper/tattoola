import { Text, View, Button } from "react-native";
import { useAuth } from "@/providers/AuthProvider";

export default function HomeScreen() {
  const { logout } = useAuth();
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-foreground">Home screen (2nd update)</Text>
      {/* Logout button */}
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
