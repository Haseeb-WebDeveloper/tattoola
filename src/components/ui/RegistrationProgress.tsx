import { mvs, s } from "@/utils/scale";
import { useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import ScaledText from "./ScaledText";
import { SVGIcons } from "@/constants/svg";
import { TypographyVariant } from "@/theme/typography";

interface RegistrationProgressProps {
  currentStep: number;
  totalSteps: number;
  name: string;
  description?: string;
  icon: React.ReactNode;
  isIconPressable?: boolean;
  onIconPress?: () => void;
  nameVariant?: TypographyVariant;
  descriptionVariant?: TypographyVariant;
  NameFont?: string;
  DescriptionFont?: string;
}

export default function RegistrationProgress({
  currentStep,
  totalSteps,
  name,
  description,
  icon,
  isIconPressable = false,
  nameVariant = "xl",
  descriptionVariant = "md",
  NameFont = "font-neueBold",
  DescriptionFont = "font-neueLight",
  onIconPress = () => {},
}: RegistrationProgressProps) {
  const barRef = useRef(null);
  const [indicatorWidth, setIndicatorWidth] = useState(0);

  const LARGE_DOT_SIZE = 16; // w-4 in px
  const SMALL_DOT_SIZE = 8; // w-2 in px
  const gap = 4; // gap-1 in tailwind

  const handleBarLayout = (e: any) => {
    if (e?.nativeEvent?.layout?.width) {
      setIndicatorWidth(e.nativeEvent.layout.width);
    }
  };

  // Calculate progress width from first dot to current dot
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

  return (
    <View>
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

      {/* Name and description */}
      <View style={{ marginBottom: mvs(24) }}>
        {isIconPressable ? (
          <TouchableOpacity
            onPress={onIconPress}
            className="flex-row gap-2 items-center justify-center"
            style={{ paddingHorizontal: s(24) }}
          >
            {icon}
            <ScaledText
              allowScaling={false}
              variant={nameVariant}
              className={`text-foreground text-center ${NameFont}`}
            >
              {name}
            </ScaledText>
          </TouchableOpacity>
        ) : (
          <View
            className="flex-row gap-2 items-center justify-center"
            style={{ paddingHorizontal: s(24) }}
          >
            {icon}
            <ScaledText
              allowScaling={false}
              variant={nameVariant}
              className={`text-foreground  text-center ${NameFont}`}
            >
              {name}
            </ScaledText>
          </View>
        )}
        {description && (
          <View style={{ paddingHorizontal: s(24), marginTop: mvs(10) }}>
            <ScaledText
              allowScaling={false}
              variant={descriptionVariant}
              className={`text-[#FFF] text-center ${DescriptionFont}`}
            >
              {description}
            </ScaledText>
          </View>
        )}
      </View>
    </View>
  );
}
