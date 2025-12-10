import ScaledText from "@/components/ui/ScaledText";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { View, ViewStyle } from "react-native";

interface BadgeProps {
  count: number;
  maxDisplay?: number; // Maximum number to display before showing "99+"
  style?: ViewStyle;
  minSize?: number; // Minimum badge size
}

/**
 * Badge component for displaying notification counts
 * Shows count up to maxDisplay, then shows "99+" for larger numbers
 * Automatically sizes based on content
 */
export const Badge: React.FC<BadgeProps> = ({
  count,
  maxDisplay = 99,
  style,
  minSize = s(18),
}) => {
  if (count <= 0) return null;

  const displayText = count > maxDisplay ? `${maxDisplay}+` : String(count);
  const textLength = displayText.length;

  // Calculate badge size based on text length
  // Single digit: minSize
  // Two digits: slightly larger
  // Three digits (99+): even larger
  const badgeSize = textLength === 1 
    ? minSize 
    : textLength === 2 
    ? s(20) 
    : s(24);

  // Padding for text
  const horizontalPadding = textLength === 1 ? 0 : s(4);

  return (
    <View
      className="rounded-full bg-[#590707] items-center justify-center"
      style={[
        {
          minWidth: badgeSize,
          height: badgeSize,
          paddingHorizontal: horizontalPadding,
        },
        style,
      ]}
    >
      <ScaledText
        variant="11"
        className="text-white font-neueMedium"
        allowScaling={false}
        style={{
          lineHeight: mvs(11),
        }}
      >
        {displayText}
      </ScaledText>
    </View>
  );
};

export default Badge;

