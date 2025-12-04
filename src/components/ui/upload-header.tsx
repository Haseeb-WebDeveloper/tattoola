import DiscardPostConfirmModal from "@/components/ui/DiscardPostConfirmModal";
import { SVGIcons } from "@/constants/svg";
import { usePostUploadStore } from "@/stores/postUploadStore";
import { router, usePathname } from "expo-router";
import { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function UploadHeader() {
  const pathname = usePathname();
  const resetPostUpload = usePostUploadStore((s) => s.reset);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
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

  const LARGE_DOT_SIZE = 16; // w-4 in px (4*4)
  const SMALL_DOT_SIZE = 8; // w-2 in px (2*4)

  const handleBarLayout = (e: any) => {
    if (e?.nativeEvent?.layout?.width)
      setIndicatorWidth(e.nativeEvent.layout.width);
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

  const handleClosePress = () => {
    // Step index 0 => /upload/media. Show confirmation popup here.
    if (currentIndex === 0) {
      setShowDiscardModal(true);
      return;
    }

    // For steps 2–5 go explicitly to the previous step in the wizard.
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0 && prevIndex < steps.length) {
      const prevSlug = steps[prevIndex];
      router.replace(`/upload/${prevSlug}` as any);
    } else {
      // Fallback: regular back navigation.
      router.back();
    }
  };

  const handleConfirmDiscard = () => {
    resetPostUpload();
    setShowDiscardModal(false);

    router.replace("/(tabs)");
  };

  const handleCancelDiscard = () => {
    setShowDiscardModal(false);
  };

  return (
    <>
      <View className="px-4 pt-6 bg-tat-darkMaroon">
        <View className="relative items-center justify-between pb-2">
          <TouchableOpacity
            onPress={handleClosePress}
            className="absolute left-0 top-1.5 w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
          >
            <SVGIcons.Close className="w-8 h-8" />
          </TouchableOpacity>
          <Text className="text-foreground section-title font-neueBold">
            Nuovo post
          </Text>
          {/* Steps Indicator */}
          <View className="items-center mt-4 mb-2">
            <View
              className="relative flex-row items-center gap-1"
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
      <DiscardPostConfirmModal
        visible={showDiscardModal}
        onCancel={handleCancelDiscard}
        onConfirm={handleConfirmDiscard}
      />
    </>
  );
}
