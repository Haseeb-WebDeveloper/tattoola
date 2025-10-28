import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import ScaledText from "./ScaledText";

interface StudioStepHeaderProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  stepDescription?: string;
  icon: React.ReactNode;
  onClose?: () => void;
}

export default function StudioStepHeader({
  currentStep,
  totalSteps,
  stepName,
  stepDescription,
  icon,
  onClose,
}: StudioStepHeaderProps) {
  const barRef = useRef(null);
  const [indicatorWidth, setIndicatorWidth] = useState(0);

  const LARGE_DOT_SIZE = 16;
  const SMALL_DOT_SIZE = 8;
  const gap = 4;

  const handleBarLayout = (e: any) => {
    if (e?.nativeEvent?.layout?.width) {
      setIndicatorWidth(e.nativeEvent.layout.width);
    }
  };

  const getProgressPixelWidth = () => {
    if (indicatorWidth === 0) return 0;
    if (totalSteps === 1) return indicatorWidth;

    let progressDistance = 0;
    for (let i = 0; i < currentStep; i++) {
      progressDistance += (i === 0 ? LARGE_DOT_SIZE : SMALL_DOT_SIZE) / 2;
      if (i > 0) progressDistance += gap + SMALL_DOT_SIZE / 2;
    }
    return progressDistance;
  };

  const progressPixelWidth = getProgressPixelWidth();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  return (
    <View>
      {/* Top section with close button and logo */}
      <View
        className="px-4"
        style={{ marginTop: mvs(15), marginBottom: mvs(20) }}
      >
        <View
          className="flex flex-row items-center justify-between"
          style={{ marginBottom: mvs(8) }}
        >
          <TouchableOpacity
            onPress={handleClose}
            className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
          >
            <SVGIcons.Close className="w-8 h-8" />
          </TouchableOpacity>
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-foreground font-semibold text-center"
          >
            Set up your studio page
          </ScaledText>
          <View className="w-10" />
        </View>
        <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
      </View>

      {/* Progress indicator */}
      <View className="items-center" style={{ marginBottom: mvs(13) }}>
        <View
          className="flex-row items-center gap-1 relative"
          ref={barRef}
          onLayout={handleBarLayout}
          style={{ alignSelf: "center" }}
        >
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const isCompleted = idx < currentStep - 1;
            const isCurrent = idx === currentStep - 1;
            const colorClass = isCurrent
              ? "bg-foreground"
              : isCompleted
                ? "bg-success"
                : "bg-gray";

            return (
              <View
                key={idx}
                className={`${colorClass} rounded-full z-10`}
                style={{
                  width: isCurrent ? LARGE_DOT_SIZE : SMALL_DOT_SIZE,
                  height: isCurrent ? LARGE_DOT_SIZE : SMALL_DOT_SIZE,
                }}
              />
            );
          })}

          {/* Background line */}
          <View
            className="absolute left-0 right-0 top-1/2"
            style={{
              height: 1,
              backgroundColor: "#A49A99",
              zIndex: 0,
              marginLeft: 0,
              marginRight: 0,
            }}
          />

          {/* Success progress line */}
          {indicatorWidth > 0 && currentStep > 1 && (
            <View
              className="absolute left-0 top-1/2 bg-success"
              style={{
                height: 1,
                width: progressPixelWidth,
                zIndex: 1,
              }}
            />
          )}
        </View>
      </View>

      {/* Step name and description */}
      <View style={{ marginBottom: mvs(24) }}>
        <View
          className="flex-row gap-2 items-center justify-center"
          style={{ paddingHorizontal: s(24) }}
        >
          {icon}
          <ScaledText
            allowScaling={false}
            variant="xl"
            className="text-foreground font-neueBold text-center"
          >
            {stepName}
          </ScaledText>
        </View>
        {stepDescription && (
          <View style={{ paddingHorizontal: s(24), marginTop: mvs(10) }}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-[#FFF] text-center font-neueLight"
            >
              {stepDescription}
            </ScaledText>
          </View>
        )}
      </View>
    </View>
  );
}
