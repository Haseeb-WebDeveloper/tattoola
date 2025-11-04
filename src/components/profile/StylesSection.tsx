import ScaledText from "@/components/ui/ScaledText";
import { StylePills } from "@/components/ui/stylePills";
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
      >
        Preferred styles
      </ScaledText>
      <StylePills styles={styles} />
    </View>
  );
};
