import { SVGIcons } from "@/constants/svg";
import { router } from "expo-router";
import { TouchableOpacity, View, Text } from "react-native";

export default function UploadHeader() {
  return (
    <View className="px-4 mt-8">
      <View className="flex-row items-center justify-between pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
        >
          <SVGIcons.Close className="w-8 h-8" />
        </TouchableOpacity>
        <Text className="text-foreground section-title font-neueBold">
          New Post
        </Text>
        <View className="w-10" />
      </View>
      <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
    </View>
  );
}
