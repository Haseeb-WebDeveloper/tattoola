import { SVGIcons } from "@/constants/svg";
import { mvs } from "@/utils/scale";
import { router } from "expo-router";
import { TouchableOpacity, View } from "react-native";

export default function AuthStepHeader() {
  return (
    <View
      className="px-4"
      style={{ marginTop: mvs(15), marginBottom: mvs(25) }}
    >
      <View className="flex flex-row items-center justify-between "
      style={{ marginBottom: mvs(8) }}
      >
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/welcome")}
          className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
        >
          <SVGIcons.Close className="w-8 h-8" />
        </TouchableOpacity>
        <SVGIcons.LogoLight className="h-10" />
        <View className="w-10" />
      </View>
      <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
    </View>
  );
}
