import ScaledText from "@/components/ui/ScaledText";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { ScrollView, View } from "react-native";

interface PreferredStylesSectionProps {
  styles: { id: string; name: string }[];
}

// Style emoji mapping (can be customized or fetched from backend)
const STYLE_EMOJIS: Record<string, string> = {
  "Lettering": "✍️",
  "Japanese": "🌸",
  "Sketch": "✏️",
  "Traditional": "🎨",
  "Realism": "📸",
  "Watercolor": "💧",
  "Geometric": "📐",
  "Blackwork": "⚫",
  "Tribal": "🗿",
  "Neo-Traditional": "🎭",
  "Dotwork": "•",
  "Minimalist": "➖",
};

export const PreferredStylesSection: React.FC<PreferredStylesSectionProps> = ({
  styles,
}) => {
  if (!styles || styles.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
      {/* Section Heading */}
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-montserratSemiBold"
        style={{ marginBottom: mvs(12) }}
      >
        Preferred styles
      </ScaledText>

      {/* Styles Pills - Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: s(10) }}
      >
        {styles.map((style) => {
          const emoji = STYLE_EMOJIS[style.name] || "";
          const displayText = emoji ? `${emoji} ${style.name}` : style.name;

          return (
            <View
              key={style.id}
              className="border border-foreground rounded-full"
              style={{
                paddingHorizontal: s(10),
                paddingVertical: mvs(5),
                height: s(22),
                justifyContent: "center",
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="xs"
                className="text-foreground font-neueMedium"
                style={{ lineHeight: s(14.3) }}
              >
                {displayText}
              </ScaledText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

