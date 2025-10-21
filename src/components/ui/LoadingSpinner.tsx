import { cn } from "@/utils/cn";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { ActivityIndicator, Text, View, ViewStyle } from "react-native";
import { ScaledText } from "./ScaledText";
import { SVGIcons } from "@/constants/svg";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  message?: string;
  overlay?: boolean;
  className?: string;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = "large",
  color = "#FFFFFF",
  message,
  overlay = false,
  className,
  style,
}: LoadingSpinnerProps) {
  return (
    <View
      style={{ flex: 1, gap: mvs(12) }}
      className="bg-background flex-col items-center justify-center absolute top-0 left-0 right-0 bottom-0 z-50"
    >
      <View className="items-center justify-center animate-spin">
        <SVGIcons.Loading
          width={s(32)}
          height={s(32)}
          className="self-center animate-spin"
        />
      </View>
      <ScaledText
        variant="lg"
        className="text-foreground font-montserratMedium"
      >
        {message}
      </ScaledText>
    </View>
  );
}
