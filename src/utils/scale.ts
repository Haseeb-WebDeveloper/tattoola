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


