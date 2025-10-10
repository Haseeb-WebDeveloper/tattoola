import { SVGIcons } from "@/constants/svg";
import React from "react";
import { Text, View } from "react-native";

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
    <View className="px-4 mt-6">
      <Text className="text-foreground font-bold font-montserratSemibold mb-3 text-[16px] leading-[23px]">
        Preferred styles
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {styles.map((style) => (
          <View
            key={style.id}
            className={`relative px-4 py-2 rounded-full border border-foreground  ${
              style.isMain ? "" : ""
            } flex-row items-center`}
          >
            {style.isMain && (
              <SVGIcons.King className="w-4 h-4 absolute top-0 right-0" />
            )}
            <Text className={`text-foreground ${style.isMain ? "" : ""}`}>
              {style.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
