import React from "react";
import { View, TouchableOpacity, ViewStyle } from "react-native";
import { SVGIcons } from "@/constants/svg";
import { s, mvs } from "@/utils/scale";
import ScaledText from "./ScaledText";

type Props = {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  showBack?: boolean;
  containerStyle?: ViewStyle;
  nextLabel?: string;
  backLabel?: string;
};

export default function AbsoluteNextBackFooter({
  onBack,
  onNext,
  nextDisabled,
  showBack = true,
  containerStyle,
  nextLabel = "Next",
  backLabel = "Back",
}: Props) {
  return (
    <View
      className="flex-row justify-between absolute left-0 right-0 bg-black border-t border-gray/20"
      style={[
        {
          bottom: 0,
          paddingHorizontal: s(24),
          paddingTop: mvs(16),
          paddingBottom: mvs(4),
        },
        containerStyle,
      ]}
    >
      {showBack ? (
        <TouchableOpacity
          onPress={onBack}
          className="rounded-full border border-foreground items-center flex-row gap-3"
          style={{
            paddingVertical: mvs(10.5),
            paddingLeft: s(18),
            paddingRight: s(20),
          }}
        >
          <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
          <ScaledText
            allowScaling={false}
            variant="body1"
            className="text-foreground"
          >
            {backLabel}
          </ScaledText>
        </TouchableOpacity>
      ) : (
        <View />
      )}
      <TouchableOpacity
        onPress={onNext}
        disabled={!!nextDisabled}
        className={`rounded-full items-center flex-row gap-3 ${!nextDisabled ? "bg-primary" : "bg-gray/40"}`}
        style={{
          paddingVertical: mvs(10.5),
          paddingLeft: s(18),
          paddingRight: s(20),
        }}
      >
        <ScaledText
          allowScaling={false}
          variant="body1"
          className="text-foreground"
        >
          {nextLabel}
        </ScaledText>
        <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
      </TouchableOpacity>
    </View>
  );
}
