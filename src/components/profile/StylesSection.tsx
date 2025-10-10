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
            className={`px-4 py-2 rounded-full border border-foreground flex-row items-center`}
            style={{ position: "relative" }}
          >
            {style.isMain && (
              <View
                style={{
                  position: "absolute",
                  top: -8,
                  right: -3,
                  zIndex: 2,
                  width: 20,
                  backgroundColor: "transparent",
                }}
                pointerEvents="none"
              >
                <SVGIcons.King style={{ width: 20, height: 20 }} />
              </View>
            )}
            <Text className="text-foreground">{style.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
