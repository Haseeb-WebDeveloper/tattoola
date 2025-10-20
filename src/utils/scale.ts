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

