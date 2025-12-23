import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";

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
  const [expanded, setExpanded] = useState(false);

  if (!bodyParts || bodyParts.length === 0) {
    return null;
  }

  const MAX_VISIBLE = 3;
  const hasMore = bodyParts.length > MAX_VISIBLE;
  const visibleBodyParts =
    expanded || !hasMore ? bodyParts : bodyParts.slice(0, MAX_VISIBLE);
  const remainingCount = hasMore ? bodyParts.length - MAX_VISIBLE : 0;

  return (
    <View
      style={{
        paddingHorizontal: s(16),
        marginTop: mvs(32),
        marginBottom: mvs(48),
      }}
    >
      <View
        className="flex-row items-center"
        style={{ marginBottom: mvs(12), gap: s(8) }}
      >
        <SVGIcons.Stop style={{ width: s(16), height: s(16) }} />
        <ScaledText
          allowScaling={false}
          variant="lg"
          className="text-foreground font-neueBold"
        >
          Parti del corpo su cui non lavoro
        </ScaledText>
      </View>
      <View className="flex-row flex-wrap" style={{ gap: s(8) }}>
        {visibleBodyParts.map((bodyPart) => (
          <View
            key={bodyPart.id}
            className="border rounded-xl bg-black/40 border-error"
            style={{
              paddingHorizontal: s(10),
              paddingVertical: mvs(6),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="11"
              className="text-foreground font-neueBold"
            >
              {bodyPart.name}
            </ScaledText>
          </View>
        ))}
        {hasMore && (
          <TouchableOpacity
            onPress={() => setExpanded((prev) => !prev)}
            className="border rounded-xl border-error bg-error/20"
            style={{
              paddingHorizontal: s(10),
              paddingVertical: mvs(6),
              flexDirection: "row",
              alignItems: "center",
              gap: s(6),
            }}
          >
            <ScaledText
              allowScaling={false}
              variant="11"
              className="text-foreground/70 font-neueSemibold"
            >
              {expanded
                ? "Mostra meno"
                : remainingCount === 1
                ? "+ 1 altra"
                : `+ ${remainingCount} altre`}
            </ScaledText>
            <SVGIcons.ChevronDown
              width={s(10)}
              height={s(10)}
              style={{
                transform: [{ rotate: expanded ? "180deg" : "0deg" }],
                opacity: 0.85,
              }}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
