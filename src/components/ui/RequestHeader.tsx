import { SVGIcons } from "@/constants/svg";
import { fetchArtistSelfProfile } from "@/services/profile.service";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type Props = { title: string; stepIndex: number; totalSteps: number };

export default function RequestHeader({ title, stepIndex, totalSteps }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  // Progress indicator state (mirrors upload-header behavior)
  const barRef = useRef(null);
  const [indicatorWidth, setIndicatorWidth] = useState(0);

  const totalStepsDisplay = Math.max(1, totalSteps ?? 1);
  // Ensure current step stays within [1, totalStepsDisplay]
  const currentStepDisplay = Math.min(
    totalStepsDisplay,
    Math.max(1, (stepIndex ?? 0) + 1)
  );

  const LARGE_DOT_SIZE = 16; // px
  const SMALL_DOT_SIZE = 8; // px

  const handleBarLayout = (e: any) => {
    if (e?.nativeEvent?.layout?.width) setIndicatorWidth(e.nativeEvent.layout.width);
  };

  const getProgressPixelWidth = () => {
    if (indicatorWidth === 0) return 0;
    if (totalStepsDisplay === 1) return indicatorWidth;
    const gap = 4; // px
    let progressDistance = 0;
    for (let i = 0; i < currentStepDisplay; i++) {
      progressDistance += (i === 0 ? LARGE_DOT_SIZE : SMALL_DOT_SIZE) / 2;
      if (i > 0) progressDistance += gap + SMALL_DOT_SIZE / 2;
    }
    return progressDistance;
  };

  const progressPixelWidth = getProgressPixelWidth();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        const p = await fetchArtistSelfProfile(String(id));
        if (mounted) setProfile(p);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <View className="b">
      <View className="bg-tat-darkMaroon px-4 pt-8 pb-10 border-b border-gray/20 flex flex-col justify-between">
        <View className="flex flex-row items-center justify-center mb-2 relative">
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-0 top-1 w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
          >
            <SVGIcons.Close className="w-8 h-8" />
          </TouchableOpacity>
          <View className="w-full items-center">
            <Text className="text-foreground text-[16px] leading-[23px] font-neueBold">
              {title}
            </Text>
          </View>
          {/* This right side is to keep the title perfectly centered */}
          <View className="w-8 h-8" />
        </View>
        {profile && (
          <View className="items-center flex-row gap-3 justify-center mt-4">
            <Image
              source={{
                uri: profile?.user?.avatar || "https://via.placeholder.com/64",
              }}
              className="w-[80px] h-[80px] rounded-full"
            />
            <View className="">
              <View className=" flex-row gap-2 items-center">
                <Text className="text-foreground tat-body-1 font-neueBold">
                  {profile?.user?.firstName} {profile?.user?.lastName}
                </Text>
                {/* Verified/Icon if needed */}
                <SVGIcons.VarifiedGreen width={18} height={18} />
              </View>
              <Text className="text-foreground tat-body-1 font-neueMedium">
                {profile?.user?.username}
              </Text>
              <View className="flex-row gap-1 items-center">
                <SVGIcons.Studio width={12} height={12} />
                {!!profile?.artistProfile?.businessName && (
                  <Text className="text-foreground/80">
                    Titolare di Studio{" "}
                    <Text className="font-neueBold text-foreground">
                      {profile.artistProfile.businessName}
                    </Text>
                  </Text>
                )}
              </View>
              <View className="flex-row gap-1 items-center">
                <SVGIcons.Location width={14} height={14} />
                <Text className="text-foreground/80">
                  {profile?.artistProfile?.municipality ||
                    profile?.user?.municipality}
                  {profile?.artistProfile?.province || profile?.user?.province
                    ? ` (${profile?.artistProfile?.province || profile?.user?.province})`
                    : ""}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
      <View className="items-center py-6 bg-background">
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
                style={{
                  width: isCurrent ? LARGE_DOT_SIZE : SMALL_DOT_SIZE,
                  height: isCurrent ? LARGE_DOT_SIZE : SMALL_DOT_SIZE,
                }}
              />
            );
          })}
          {/* Base line */}
          <View
            className="absolute left-0 right-0 top-1/2"
            style={{ height: 1, backgroundColor: "#A49A99", zIndex: 0, marginLeft: 0, marginRight: 0 }}
          />
          {/* Success progress line */}
          {indicatorWidth > 0 && currentStepDisplay > 1 && (
            <View
              className="absolute left-0 top-1/2 bg-success"
              style={{ height: 1, width: progressPixelWidth, zIndex: 1 }}
            />
          )}
        </View>
      </View>
    </View>
  );
}
