import StyleInfoModal from "@/components/shared/StyleInfoModal";
import ScaledText from "@/components/ui/ScaledText";
import { StylePills } from "@/components/ui/stylePills";
import { fetchTattooStyles } from "@/services/style.service";
import { mvs, s } from "@/utils/scale";
import React, { useState } from "react";
import { View } from "react-native";

interface Style {
  id: string;
  name: string;
  imageUrl?: string | null;
  isFavorite?: boolean;
}

interface StylesSectionProps {
  styles: Style[];
}

export const StylesSection: React.FC<StylesSectionProps> = ({ styles }) => {
  const [selectedStyleInfo, setSelectedStyleInfo] = useState<{
    id: string;
    name: string;
    imageUrl?: string | null;
    description?: string | null;
  } | null>(null);
  const [showStyleInfoModal, setShowStyleInfoModal] = useState(false);
  const [fullStyleData, setFullStyleData] = useState<{
    id: string;
    name: string;
    imageUrl?: string | null;
    description?: string | null;
  } | null>(null);

  const handleStylePress = async (style: {
    id: string;
    name: string;
    imageUrl?: string | null;
    description?: string | null;
  }) => {
    // Try to fetch full style data with description
    try {
      const allStyles = await fetchTattooStyles();
      const fullStyle = allStyles.find((s) => s.id === style.id);
      if (fullStyle) {
        setFullStyleData(fullStyle);
      } else {
        // Fallback to the style data we have
        setFullStyleData({
          id: style.id,
          name: style.name,
          imageUrl: style.imageUrl,
          description: null,
        });
      }
    } catch (error) {
      // Fallback to the style data we have
      setFullStyleData({
        id: style.id,
        name: style.name,
        imageUrl: style.imageUrl,
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
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        <ScaledText
          allowScaling={false}
          variant="lg"
          className="text-foreground font-montserratSemibold"
        >
          Stili preferiti
        </ScaledText>
        <StylePills styles={styles} onStylePress={handleStylePress} />
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
