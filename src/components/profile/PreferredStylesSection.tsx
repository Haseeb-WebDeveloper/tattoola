import ScaledText from "@/components/ui/ScaledText";
import { addEmojiWithStyle } from "@/utils/content/add-emoji-with-style";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { ScrollView, View } from "react-native";

interface PreferredStylesSectionProps {
  styles: { id: string; name: string }[];
}

export const PreferredStylesSection: React.FC<PreferredStylesSectionProps> = ({
  styles,
}) => {
  if (!styles || styles.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: s(16), marginTop: mvs(20) }}>
      {/* Section Heading */}
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-montserratSemibold"
        style={{ marginBottom: mvs(8) }}
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
          const displayText = addEmojiWithStyle(style.name);

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
                variant="11"
                className="text-foreground font-neueSemibold"
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

