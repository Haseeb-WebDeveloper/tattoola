import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { fetchArtistSelfProfile } from "@/services/profile.service";
import { mvs, s } from "@/utils/scale";
import { TrimText } from "@/utils/text-trim";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Image, TouchableOpacity, View } from "react-native";

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

  const LARGE_DOT_SIZE = s(16); // px
  const SMALL_DOT_SIZE = s(8); // px

  const handleBarLayout = (e: any) => {
    if (e?.nativeEvent?.layout?.width)
      setIndicatorWidth(e.nativeEvent.layout.width);
  };

  const getProgressPixelWidth = () => {
    if (indicatorWidth === 0) return 0;
    // @ts-ignore
    if (totalStepsDisplay === 1) return indicatorWidth;
    const gap = 4; // gap-1 in tailwind (0.25rem = 4px)
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
      <View
        className="bg-tat-darkMaroon border-b border-gray/20 flex flex-col justify-between"
        style={{
          paddingHorizontal: s(16),
          paddingTop: mvs(32),
          paddingBottom: mvs(40),
        }}
      >
        <View
          className="flex flex-row items-center justify-between relative"
          style={{ marginBottom: mvs(8) }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-full bg-foreground/20 items-center justify-center"
            style={{ width: s(32), height: s(32) }}
          >
            <SVGIcons.Close width={s(12)} height={s(12)} />
          </TouchableOpacity>
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-foreground font-neueBold"
          >
            {title}
          </ScaledText>
          {/* This right side is to keep the title perfectly centered */}
          <View style={{ width: s(24), height: s(24) }} />
        </View>
        {profile && (
          <View
            className="items-center flex-row justify-center"
            style={{ gap: s(12), marginTop: mvs(16) }}
          >
            <Image
              source={{
                uri: profile?.user?.avatar ||  `https://api.dicebear.com/7.x/initials/png?seed=${profile?.user?.firstName?.split(" ")[0] || profile?.user?.username?.split(" ")[0]}`,
              }}
              className="rounded-full"
              style={{ width: s(67), height: s(67) }}
            />
            <View
             style={{ gap: s(4) }}
            >
              <View className="flex-row items-center" style={{ gap: s(8) }}>
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-foreground font-neueBold"
                >
                  {TrimText(
                    `${profile?.user?.firstName} ${profile?.user?.lastName}`,
                    20
                  )}
                </ScaledText>
                {/* Verified/Icon if needed */}
                <SVGIcons.VarifiedGreen width={s(18)} height={s(18)} />
              </View>
              {/* <ScaledText
                allowScaling={false}
                variant="md"
                className="text-gray font-neueMedium"
              >
                {profile?.user?.username}
              </ScaledText> */}
              <View className="flex-row items-center" style={{ gap: s(4) }}>
                <SVGIcons.Studio width={s(12)} height={s(12)} />
                {!!profile?.artistProfile?.businessName && (
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="text-foreground"
                  >
                    Titolare di Studio{" "}
                    <ScaledText
                      allowScaling={false}
                      variant="11"
                      className="font-neueBold text-foreground"
                    >
                      {profile.artistProfile.businessName}
                    </ScaledText>
                  </ScaledText>
                )}
              </View>
              <View className="flex-row items-center" style={{ gap: s(4) }}>
                <SVGIcons.Location width={s(14)} height={s(14)} />
                <ScaledText
                  allowScaling={false}
                  variant="11"
                  className="text-foreground"
                >
                  {profile?.location?.municipality?.name}
                  {profile?.location?.province?.name
                    ? ` (${profile?.location?.province?.name})`
                    : ""}
                </ScaledText>
              </View>
            </View>
          </View>
        )}
      </View>
      <View
        className="items-center bg-background"
        style={{ paddingVertical: mvs(24) }}
      >
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
    </View>
  );
}
