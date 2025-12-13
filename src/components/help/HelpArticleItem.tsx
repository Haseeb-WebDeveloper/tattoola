import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import type { HelpArticle } from "@/types/help";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface HelpArticleItemProps {
  article: HelpArticle;
  isLast: boolean;
  onPress?: () => void;
  categoryId?: string;
}

export function HelpArticleItem({
  article,
  isLast,
  onPress,
  categoryId,
}: HelpArticleItemProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (categoryId) {
      router.push(`/(auth)/help/${categoryId}/${article.id}`);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: mvs(16),
        width: "100%",
      }}
    >
      {/* Help Article Icon */}
      <View
        style={{
          width: s(24),
          height: s(24),
          marginRight: s(12),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SVGIcons.HelpArticle width={s(30)} height={s(30)} />
      </View>

      {/* Article Title */}
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-neueLight"
        style={{
          fontSize: s(14),
          lineHeight: s(23),
          flex: 1,
        }}
      >
        {article.title}
      </ScaledText>
    </TouchableOpacity>
  );
}

