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

export default function NextBackFooter({
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
      className="flex-row justify-between"
      style={[
        {
          paddingHorizontal: s(24),
          marginTop: mvs(24),
          marginBottom: mvs(20),
          backgroundColor: "transparent",
        },
        containerStyle,
      ]}
    >
      {showBack ? (
        <TouchableOpacity
          onPress={onBack}
          className="rounded-full border border-foreground items-center flex-row"
          style={{
            paddingVertical: mvs(10.5),
            paddingLeft: s(18),
            paddingRight: s(20),
            gap: s(15),
          }}
        >
          <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-foreground font-neueSemibold"
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
        className={`rounded-full items-center flex-row  ${!nextDisabled ? "bg-primary" : "bg-gray/40"}`}
        style={{
          paddingVertical: mvs(10.5),
          paddingLeft: s(25),
          paddingRight: s(20),
          gap: s(15),
        }}
      >
        <ScaledText
          allowScaling={false}
          variant="md"
          className="text-foreground font-neueSemibold"
        >
          {nextLabel}
        </ScaledText>
        <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
      </TouchableOpacity>
    </View>
  );
}
