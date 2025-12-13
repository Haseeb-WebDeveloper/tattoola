import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export function HelpHeader() {
  return (
    <View
      className="relative flex-row items-center justify-center"
      style={{
        paddingHorizontal: s(20),
        paddingTop: mvs(20),
        paddingBottom: mvs(30),
      }}
    >
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        className="absolute items-center justify-center rounded-full bg-foreground/10"
        style={{
          left: s(21),
          top: mvs(12),
          width: s(35),
          height: s(35),
        }}
      >
        <SVGIcons.ChevronLeft width={s(12)} height={s(12)} />
      </TouchableOpacity>

      {/* Title */}
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-neueSemibold"
        style={{
          fontSize: s(14),
          lineHeight: s(23),
        }}
      >
        Help
      </ScaledText>
    </View>
  );
}

