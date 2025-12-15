import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import type { HelpCategory } from "@/types/help";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface HelpCategoryItemProps {
  category: HelpCategory;
  isLast: boolean;
  onPress?: () => void;
}

export function HelpCategoryItem({
  category,
  isLast,
  onPress,
}: HelpCategoryItemProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/(auth)/help/${category.id}`);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        {
          height: mvs(68),
          borderWidth: 1,
          borderColor: "#A49A99",
          borderRadius: s(16.122),
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: s(16),
          marginBottom: isLast ? 0 : mvs(16),
        },
      ]}
    >
      {/* Help Question Icon */}
      <View
        style={{
          width: s(24),
          height: s(24),
          marginRight: s(12),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SVGIcons.HelpQuestion width={s(20)} height={s(20)} />
      </View>

      {/* Category Title */}
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-montserratMedium"
        style={{
          fontSize: s(14),
          lineHeight: s(23),
          flex: 1,
        }}
      >
        {category.title}
      </ScaledText>
    </TouchableOpacity>
  );
}

