import React from "react";
import { View, TouchableOpacity, ViewStyle } from "react-native";
import { SVGIcons } from "@/constants/svg";
import { s, mvs } from "@/utils/scale";
import ScaledText from "./ScaledText";

type Props = {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  backDisabled?: boolean;
  showBack?: boolean;
  containerStyle?: ViewStyle;
  nextLabel?: string;
  backLabel?: string;
  containerClassName?: string;
};

export default function NextBackFooter({
  onBack,
  onNext,
  nextDisabled,
  backDisabled = false,
  showBack = true,
  containerStyle,
  nextLabel = "Avanti",
  backLabel = "Indietro",
  containerClassName,
}: Props) {
  return (
    <View
      className={`flex-row justify-between ${containerClassName}`}
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
          disabled={backDisabled}
          className={`rounded-full border items-center flex-row bg-background ${backDisabled ? "border-gray/40" : "border-foreground"}`}
          style={{
            paddingVertical: mvs(10.5),
            paddingLeft: s(18),
            paddingRight: s(20),
            gap: s(15),
            opacity: backDisabled ? 0.5 : 1,
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
