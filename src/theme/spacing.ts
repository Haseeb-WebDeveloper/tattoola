import { mvs, s } from "@/utils/scale";

// Scaled spacing tokens; keep names aligned with app conventions
export const spacing = {
  xs: s(4),
  sm: s(8),
  md: s(12),
  lg: s(16),
  xl: s(24),
  xxl: s(32),
  // Vertical rhythm spacing for blocks
  vSm: mvs(6),
  vMd: mvs(12),
  vLg: mvs(18),
  vXl: mvs(24),
  vXxl: mvs(30),
} as const;

export type SpacingKey = keyof typeof spacing;


