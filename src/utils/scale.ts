import { Dimensions } from "react-native";
import {
  moderateScale,
  moderateVerticalScale,
  scale,
  verticalScale,
} from "react-native-size-matters";

// Re-export commonly used helpers with short aliases for convenience
export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;
export const mvs = moderateVerticalScale;

// Convenience helpers for readability in components
export const scaledFont = (size: number, factor: number = 0.15) =>
  moderateScale(size, factor);
export const scaledSize = (size: number) => scale(size);
export const scaledVSize = (size: number) => verticalScale(size);

export type SizeFactor = {
  size: number;
  factor?: number;
};

export const sf = ({ size, factor = 0.2 }: SizeFactor) => moderateScale(size, factor);

// --- vh/vw helpers ---
// Get window height (excluding nav bar/safe area, but works for most use-cases)
const { height: windowHeight, width: windowWidth } = Dimensions.get("window");

/**
 * Returns a value scaled by "vh" units (percentage of viewport height).
 * @param percentage - percent as number (e.g. 50 for 50% of viewport height)
 */
export const vh = (percentage: number) => (windowHeight * percentage) / 100;

/**
 * Returns a value scaled by "vw" units (percentage of viewport width).
 * @param percentage - percent as number (e.g. 50 for 50% of viewport width)
 */
export const vw = (percentage: number) => (windowWidth * percentage) / 100;

/**
 * Calculate the total height of the custom tab bar including gradient overlay
 * This ensures consistent spacing for content positioned above the tab bar
 * @param safeAreaBottom - The bottom safe area inset from useSafeAreaInsets()
 * @returns The total height to offset content above the tab bar
 */
export const getTabBarHeight = (safeAreaBottom: number = 0) => {
  // Tab bar structure from CustomTabBar.tsx:
  // - Outer padding: paddingTop mvs(24) + paddingBottom mvs(8) = mvs(32)
  // - Inner pill padding: paddingVertical mvs(16) * 2 = mvs(32)
  // - Icon height: s(24)
  // - Text + margin: scaledFont(11) + mvs(4) ≈ mvs(15)
  // - Gradient fade zone: Additional visual space ~mvs(50)
  
  const outerPadding = mvs(32); // paddingTop + paddingBottom
  const innerPadding = mvs(32); // py top + bottom
  const iconHeight = s(24); // icon size
  const textHeight = mvs(15); // text + margin
  const gradientFadeZone = mvs(50); // extra space for gradient transition
  
  // Add safe area bottom (for devices with home indicators)
  const baseHeight = outerPadding + innerPadding + iconHeight + textHeight + gradientFadeZone;
  return baseHeight + Math.max(safeAreaBottom, mvs(16));
};

