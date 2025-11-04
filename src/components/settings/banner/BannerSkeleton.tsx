import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { View } from "react-native";

export function BannerSkeleton() {
  return (
    <View style={{ paddingHorizontal: s(16) }}>
      {/* Description text - ACTUAL CONTENT */}
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-neueLight"
        style={{ marginBottom: mvs(16) }}
      >
        In this section you can choose the cover of your page.
      </ScaledText>

      {/* Option 1: 4 Images - ACTUAL CONTENT */}
      <View
        className="bg-[#100C0C] border"
        style={{
          padding: s(16),
          marginBottom: mvs(12),
          borderRadius: s(12),
          borderColor: "#A49A99",
          borderWidth: s(1),
        }}
      >
        <View className="flex-row items-center">
          <SVGIcons.CircleUncheckedCheckbox
            width={s(20)}
            height={s(20)}
            style={{ marginRight: s(12) }}
          />
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-white font-semibold"
          >
            Voglio mostrare i miei tatuaggi preferiti
          </ScaledText>
        </View>
      </View>

      {/* Option 2: 1 Image - ACTUAL CONTENT */}
      <View
        className="bg-[#100C0C] border"
        style={{
          padding: s(16),
          marginBottom: mvs(12),
          borderRadius: s(12),
          borderColor: "#A49A99",
          borderWidth: s(1),
        }}
      >
        <View className="flex-row items-center">
          <SVGIcons.CircleUncheckedCheckbox
            width={s(20)}
            height={s(20)}
            style={{ marginRight: s(12) }}
          />
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-white font-semibold"
          >
            Voglio mostrare una foto a mia scelta
          </ScaledText>
        </View>
      </View>

      {/* Option 3: 1 Video - ACTUAL CONTENT */}
      <View
        className="bg-[#100C0C] border"
        style={{
          padding: s(16),
          marginBottom: mvs(12),
          borderRadius: s(12),
          borderColor: "#A49A99",
          borderWidth: s(1),
        }}
      >
        <View className="flex-row items-center">
          <SVGIcons.CircleUncheckedCheckbox
            width={s(20)}
            height={s(20)}
            style={{ marginRight: s(12) }}
          />
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-white font-semibold"
          >
            Voglio mostrare un video a mia scelta
          </ScaledText>
        </View>
      </View>
    </View>
  );
}

