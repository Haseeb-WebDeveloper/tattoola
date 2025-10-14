import { SVGIcons } from "@/constants/svg";
import { router, usePathname } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useRef, useState } from "react";

export default function UploadHeader() {
  const pathname = usePathname();
  const steps = [
    "media",
    "description",
    "style",
    "collection",
    "preview",
  ] as const;
  const currentSlug = pathname?.split("/").pop() ?? "media";
  const currentIndex = Math.max(
    0,
    steps.indexOf(currentSlug as (typeof steps)[number])
  );
  const totalStepsDisplay = steps.length;
  const currentStepDisplay = currentIndex + 1;

  // Fix: Dynamically measure the width of the indicators row to precisely control success progress width
  const barRef = useRef(null);
  const [indicatorWidth, setIndicatorWidth] = useState(0);

  // For the progress, subtract the diameter of a step, so that when progress is 100% the bar ends at the final dot's center
  // We'll assume 16px as base for large dot, 8px for small dots (w-4 vs w-2 in tailwind); always ending on large dot
  const LARGE_DOT_SIZE = 16; // w-4 in px (4*4)
  const SMALL_DOT_SIZE = 8; // w-2 in px (2*4)
  // The dot gap is 4px (gap-1 in tailwind, i.e. 0.25rem = 4px)

  // Number of gaps = totalStepsDisplay-1, gap size = 4
  // So bar total width = (LARGE_DOT_SIZE * 1) + (SMALL_DOT_SIZE * (totalStepsDisplay-1)) + (gap * (totalStepsDisplay-1))
  // But we will just measure the row for accuracy

  const handleBarLayout = (e: any) => {
    if (e?.nativeEvent?.layout?.width) setIndicatorWidth(e.nativeEvent.layout.width);
  };

  // Calculate how much to fill: between first and last dot
  // If only one step, fill 100% if on that step, 0% before
  const getProgressPixelWidth = () => {
    if (indicatorWidth === 0) return 0;
    // @ts-ignore
    if (totalStepsDisplay === 1) return indicatorWidth;
    // The progress should go from the center of the first dot to the center of the current dot
    const gap = 4;
    let progressDistance = 0;
    for (let i = 0; i < currentStepDisplay; i++) {
      progressDistance += (i === 0 ? LARGE_DOT_SIZE : SMALL_DOT_SIZE) / 2;
      if (i > 0) progressDistance += gap + SMALL_DOT_SIZE / 2;
    }
    return progressDistance;
  };

  const progressPixelWidth = getProgressPixelWidth();

  return (
    <View className="px-4 pt-6 bg-tat-darkMaroon">
      <View className="items-center justify-between pb-2 relative">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-0 top-1.5 w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
        >
          <SVGIcons.Close className="w-8 h-8" />
        </TouchableOpacity>
        <Text className="text-foreground section-title font-neueBold">
          New Post
        </Text>
        {/* Steps Indicator */}
        <View className="items-center mb-2 mt-4">
          <View
            className="flex-row items-center gap-1 relative"
            ref={barRef}
            onLayout={handleBarLayout}
            style={{ alignSelf: "center" }}
          >
            {Array.from({ length: totalStepsDisplay }).map((_, idx) => {
              const isCompleted = idx < currentStepDisplay - 1;
              const isCurrent = idx === currentStepDisplay - 1;
              const baseSize = isCurrent ? "w-4 h-4" : "w-2 h-2";
              const colorClass = isCurrent
                ? "bg-foreground"
                : isCompleted
                  ? "bg-success"
                  : "bg-gray";
              return (
                <View
                  key={idx}
                  className={`${colorClass} ${baseSize} rounded-full z-10`}
                  // for correct measurement of both sizes for progress math, ensure fixed width/height
                  style={{
                    width: isCurrent ? LARGE_DOT_SIZE : SMALL_DOT_SIZE,
                    height: isCurrent ? LARGE_DOT_SIZE : SMALL_DOT_SIZE,
                  }}
                />
              );
            })}
            {/* Turncut Line */}
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
            {/* Line that shows success progress in success color */}
            {indicatorWidth > 0 && currentStepDisplay > 1 && (
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
        <View className="w-10" />
      </View>
      <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
    </View>
  );
}
