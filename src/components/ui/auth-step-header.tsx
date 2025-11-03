import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import { TouchableOpacity, View } from "react-native";

export default function AuthStepHeader() {
  return (
    <View
      className="px-4"
      style={{ marginTop: mvs(15), marginBottom: mvs(25) }}
    >
      <View
        className="flex flex-row items-center justify-between "
        style={{ marginBottom: mvs(8) }}
      >
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/welcome")}
          className="rounded-full items-center justify-center"
          style={{ width: s(32), height: s(32), backgroundColor: "#FFFFFF1A" }}
        >
          <SVGIcons.Close width={s(12)} height={s(12)} />
        </TouchableOpacity>
        <SVGIcons.LogoLight />
        <View style={{ width: s(24), height: s(24) }} />
      </View>
      <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
    </View>
  );
}
