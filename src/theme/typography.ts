import { scaledFont } from "@/utils/scale";
import { TextStyle } from "react-native";

export type TypographyVariant =
  | "sheetTitle"
  | "sectionTitle"
  | "body1"
  | "body2"
  | "body2Para"
  | "body2Light"
  | "body2Med"
  | "body3Button"
  | "body4"
  | "label"
  | "boldMontserrat18"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "20"
  | "11"
  | "9"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"

type VariantStyle = Pick<
  TextStyle,
  "fontSize" | "lineHeight" | "fontWeight" | "letterSpacing"
> & { fontSize: number };

// Centralized, scaled typography tokens mirroring classes in global.css
export const typography: Record<TypographyVariant, VariantStyle> = {
  sheetTitle: {
    fontSize: scaledFont(38),
    lineHeight: scaledFont(36),
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: scaledFont(24),
    lineHeight: scaledFont(36),
    letterSpacing: -0.5,
  },
  body1: {
    fontSize: scaledFont(16),
    lineHeight: scaledFont(23),
  },
  body2: {
    fontSize: scaledFont(14),
    lineHeight: scaledFont(23),
  },
  body2Para: {
    fontSize: scaledFont(14),
    lineHeight: scaledFont(23),
    fontWeight: "600",
  },
  body2Light: {
    fontSize: scaledFont(14),
    lineHeight: scaledFont(23),
  },
  body2Med: {
    fontSize: scaledFont(14),
    lineHeight: scaledFont(23),
  },
  body3Button: {
    fontSize: scaledFont(12),
    lineHeight: scaledFont(23),
  },
  body4: {
    fontSize: scaledFont(11),
    lineHeight: scaledFont(11 * 1.3),
  },
  label: {
    fontSize: scaledFont(14),
    lineHeight: scaledFont(23),
    fontWeight: "600",
  },
  boldMontserrat18: {
    fontSize: scaledFont(18.26),
    lineHeight: scaledFont(30),
    fontWeight: "900",
    letterSpacing: 0,
  },
  xs: {
    fontSize: scaledFont(10),
    lineHeight: scaledFont(15),
  },
  sm: {
    fontSize: scaledFont(12),
    lineHeight: scaledFont(18),
  },
  md: {
    fontSize: scaledFont(14),
    lineHeight: scaledFont(23),
  },
  lg: {
    fontSize: scaledFont(16),
    lineHeight: scaledFont(23),
  },
  xl: {
    fontSize: scaledFont(21),
    lineHeight: scaledFont(36),
  },
  "11": {
    fontSize: scaledFont(11),
    lineHeight: scaledFont(11 * 1.3),
  },
  "20": {
    fontSize: scaledFont(20),
    lineHeight: scaledFont(20 * 1.3),
    letterSpacing: -0.5,
  },
  "9": {
    fontSize: scaledFont(9),
    lineHeight: scaledFont(9 * 1.3),
    letterSpacing: -0.5,
  },
  "2xl": {
    fontSize: scaledFont(24),
    lineHeight: scaledFont(42),
    letterSpacing: -0.5,
  },
  "3xl": {
    fontSize: scaledFont(28),
    lineHeight: scaledFont(48),
    letterSpacing: -0.5,
  },
  "4xl": {
    fontSize: scaledFont(32),
    lineHeight: scaledFont(54),
  },
  "5xl": {
    fontSize: scaledFont(36),
  },
  "6xl": {
    fontSize: scaledFont(40),
    lineHeight: scaledFont(66),
  },
  "7xl": {
    fontSize: scaledFont(44),
    lineHeight: scaledFont(72),
  },
};


