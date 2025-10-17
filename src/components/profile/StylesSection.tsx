import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { View } from "react-native";

interface Style {
  id: string;
  name: string;
  imageUrl?: string | null;
  isMain?: boolean;
}

interface StylesSectionProps {
  styles: Style[];
}

export const StylesSection: React.FC<StylesSectionProps> = ({ styles }) => {
  if (!styles || styles.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-montserratSemibold"
        style={{ marginBottom: mvs(12) }}
      >
        Preferred styles
      </ScaledText>
      <View className="flex-row flex-wrap" style={{ gap: s(3) }}>
        {styles.map((style) => (
          <View
            key={style.id}
            className="rounded-full border border-foreground flex-row items-center"
            style={{
              paddingHorizontal: s(9),
              paddingVertical: mvs(3),
              position: "relative",
            }}
          >
            {style.isMain && (
              <View
                style={{
                  position: "absolute",
                  top: -9,
                  right: -6,
                  zIndex: 2,
                  width: s(20),
                  backgroundColor: "transparent",
                }}
                pointerEvents="none"
              >
                <SVGIcons.King style={{ width: s(20), height: s(20) }} />
              </View>
            )}
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-foreground font-neueBold"
            >
              {style.name}
            </ScaledText>
          </View>
        ))}
      </View>
    </View>
  );
};
