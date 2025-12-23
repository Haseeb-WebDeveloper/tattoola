import StyleInfoModal from "@/components/shared/StyleInfoModal";
import ScaledText from "@/components/ui/ScaledText";
import { fetchTattooStyles } from "@/services/style.service";
import { addEmojiWithStyle } from "@/utils/content/add-emoji-with-style";
import { mvs, s } from "@/utils/scale";
import React, { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

interface PreferredStylesSectionProps {
  styles: { id: string; name: string }[];
}

export const PreferredStylesSection: React.FC<PreferredStylesSectionProps> = ({
  styles,
}) => {
  const [selectedStyleInfo, setSelectedStyleInfo] = useState<{ id: string; name: string; imageUrl?: string | null; description?: string | null } | null>(null);
  const [showStyleInfoModal, setShowStyleInfoModal] = useState(false);
  const [fullStyleData, setFullStyleData] = useState<{ id: string; name: string; imageUrl?: string | null; description?: string | null } | null>(null);

  const handleStylePress = async (style: { id: string; name: string }) => {
    // Try to fetch full style data with description
    try {
      const allStyles = await fetchTattooStyles();
      const fullStyle = allStyles.find(s => s.id === style.id);
      if (fullStyle) {
        setFullStyleData(fullStyle);
      } else {
        // Fallback to the style data we have
        setFullStyleData({
          id: style.id,
          name: style.name,
          imageUrl: null,
          description: null,
        });
      }
    } catch (error) {
      // Fallback to the style data we have
      setFullStyleData({
        id: style.id,
        name: style.name,
        imageUrl: null,
        description: null,
      });
    }
    setShowStyleInfoModal(true);
  };

  if (!styles || styles.length === 0) {
    return null;
  }

  return (
    <>
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(20) }}>
        {/* Section Heading */}
        <ScaledText
          allowScaling={false}
          variant="md"
          className="text-foreground font-montserratSemibold"
          style={{ marginBottom: mvs(8) }}
        >
          Stili preferiti
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
              <TouchableOpacity
                key={style.id}
                onPress={() => handleStylePress(style)}
                activeOpacity={0.7}
                className="border border-foreground rounded-full"
                style={{
                  paddingHorizontal: s(10),
                  paddingVertical: mvs(5),
                  height: s(28  ),
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
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <StyleInfoModal
        visible={showStyleInfoModal}
        style={fullStyleData}
        onClose={() => {
          setShowStyleInfoModal(false);
          setFullStyleData(null);
        }}
      />
    </>
  );
};

