import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useStudioSetupStore } from "@/stores/studioSetupStore";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function StudioStep0() {
  const { setCurrentStep } = useStudioSetupStore();

  const handleGetStarted = () => {
    setCurrentStep(1);
    router.push("/settings/studio/step-1" as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Image taking 60% of viewport height */}
      <View style={{ height: SCREEN_HEIGHT * 0.6 }}>
        <Image
          source={require("@/assets/images/studio-wellcome.png")}
          style={{
            width: "100%",
            height: "100%",
          }}
          resizeMode="cover"
        />

        {/* Back button */}
        <View
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? mvs(60) : mvs(36),
            left: s(18),
            zIndex: 15,
          }}
        >
          <TouchableOpacity
            style={{
              width: s(34),
              height: s(34),
              backgroundColor: "rgba(30, 25, 25, 0.80)",
              borderRadius: s(17),
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <SVGIcons.ChevronLeft width={s(13)} height={s(13)} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Gradient fade effect at bottom of image */}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)", "#000000"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: mvs(150),
          }}
          pointerEvents="none"
        />
      </View>

      {/* Bottom 40% empty view for content */}
      <View style={{ flex: 1, backgroundColor: "#000" }} />

      {/* Content positioned absolutely over the bottom section */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: Platform.OS === "ios" ? mvs(42) : mvs(32),
          paddingHorizontal: s(16),
        }}
      >
        {/* Title */}
        <ScaledText
          allowScaling={false}
          variant="2xl"
          className="text-white font-neueSemibold"
          style={{
            marginBottom: mvs(6),
          }}
        >
          Setup your Studio Page 🪄
        </ScaledText>

        {/* Description */}
        <ScaledText
          allowScaling={false}
          variant="md"
          style={{
            marginBottom: mvs(20),
          }}
          className="text-foreground font-neueLight"
        >
          Create a dedicated page for your studio. Add details, photos, and
          services to showcase your work and attract more clients.
        </ScaledText>

        {/* Checklist items */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: mvs(10),
          }}
        >
          <ScaledText
            allowScaling={false}
            variant="11"
            className="text-foreground font-neueSemibold"
          >
            🖼 Cover & Logo {"\n"}
            📍 Location & Links {"\n"}
            🎨 Styles & Services {"\n"}❓ FAQs
          </ScaledText>
        </View>

        {/* Note text */}
        <ScaledText
          allowScaling={false}
          variant="11"
          style={{
            marginBottom: mvs(40),
          }}
          className="text-foreground font-neueLight"
        >
          You can edit everything later at any time.
        </ScaledText>

        {/* Get started button */}
        <TouchableOpacity
          onPress={handleGetStarted}
          style={{
            backgroundColor: "#CA2323",
            borderRadius: 9999,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: mvs(10.5),
            paddingLeft: s(18),
            paddingRight: s(20),
            shadowColor: "#CA2323",
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
          activeOpacity={0.85}
        >
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-white font-neueSemibold"
          >
            Get started
          </ScaledText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
