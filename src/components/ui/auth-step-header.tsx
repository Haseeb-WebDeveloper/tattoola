import { SVGIcons } from "@/constants/svg";
import { router } from "expo-router";
import { TouchableOpacity, View } from "react-native";

export default function AuthStepHeader() {
  return (
    <View className="px-4 mt-8">
      <View className="flex-row items-center justify-between pb-2">
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/welcome")}
          className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
        >
          <SVGIcons.Close
            className="w-8 h-8"
          />
        </TouchableOpacity>
        <SVGIcons.LogoLight
          className="h-10"
        />
        <View className="w-10" />
      </View>
      <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
    </View>
  );
}
