import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: mvs(16),
      }}
    >
      {/* Header */}
      <View
        className="relative flex-row items-center justify-center"
        style={{
          paddingHorizontal: s(16),
          paddingVertical: mvs(16),
          marginBottom: mvs(32),
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          className="absolute items-center justify-center rounded-full bg-foreground/20"
          style={{
            width: s(34),
            height: s(34),
            left: s(16),
            padding: s(8),
          }}
        >
          <SVGIcons.ChevronLeft style={{ width: s(12), height: s(16) }} />
        </TouchableOpacity>
        <ScaledText
          allowScaling={false}
          variant="xl"
          style={{ color: "#FFFFFF" }}
        >
          Privacy Policy
        </ScaledText>
      </View>

      {/* Content */}
      <View className="items-center justify-center flex-1 px-6">
        <ScaledText
          allowScaling={false}
          variant="md"
          style={{
            color: "#A49A99",
            textAlign: "center",
          }}
        >
          I contenuti della Privacy Policy saranno disponibili a breve.
        </ScaledText>
      </View>
    </View>
  );
}
