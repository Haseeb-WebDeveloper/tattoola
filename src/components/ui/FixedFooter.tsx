import React from "react";
import { Text, TouchableOpacity, View, ViewStyle } from "react-native";

type Props = {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  showBack?: boolean;
  containerStyle?: ViewStyle;
  nextLabel?: string;
  backLabel?: string;
};

export default function FixedFooter({
  onBack,
  onNext,
  nextDisabled,
  showBack = true,
  containerStyle,
  nextLabel = "Next",
  backLabel = "Back",
}: Props) {
  return (
    <View className="flex-row justify-between px-6 py-4 bg-background absolute bottom-0 left-0 right-0 z-10">
      {showBack ? (
        <TouchableOpacity onPress={onBack} className="rounded-full px-6 py-4">
          <Text className="text-foreground">{backLabel}</Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}
      <TouchableOpacity
        onPress={onNext}
        disabled={!!nextDisabled}
        className={`rounded-full px-8 py-4 ${nextDisabled ? "bg-gray/40" : "bg-primary"}`}
      >
        <Text className="text-foreground">{nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}
