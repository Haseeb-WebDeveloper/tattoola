import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { View } from "react-native";

interface BodyPart {
  id: string;
  name: string;
}

interface BodyPartsSectionProps {
  bodyParts: BodyPart[];
}

export const BodyPartsSection: React.FC<BodyPartsSectionProps> = ({
  bodyParts,
}) => {
  if (!bodyParts || bodyParts.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: s(16), marginTop: mvs(32), marginBottom: mvs(48) }}>
      <View className="flex-row items-center" style={{ marginBottom: mvs(12), gap: s(8) }}>
        <SVGIcons.Stop style={{ width: s(16), height: s(16) }} />
        <ScaledText
          allowScaling={false}
          variant="lg"
          className="text-foreground font-neueBold"
        >
          Parti del corpo su cui non lavoro
        </ScaledText>
      </View>
      <View className="flex-row flex-wrap" style={{ gap: s(2) }}>
        {bodyParts.map((bodyPart) => (
          <View
            key={bodyPart.id}
            className="rounded-xl bg-black/40 border border-error"
            style={{
              paddingHorizontal: s(8),
              paddingVertical: mvs(3),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="9"
              className="text-foreground font-neueBold"
            >
              {bodyPart.name}
            </ScaledText>
          </View>
        ))}
      </View>
    </View>
  );
};
