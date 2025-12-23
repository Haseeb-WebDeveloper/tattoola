import NextBackFooter from "@/components/ui/NextBackFooter";
import ScaledText from "@/components/ui/ScaledText";
import { sizeOptions } from "@/constants/request-questions";
import { SVGIcons } from "@/constants/svg";
import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { mvs, s } from "@/utils/scale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, View } from "react-native";

export default function SizeStep() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const size = usePrivateRequestStore((s) => s.answers.size);
  const setSize = usePrivateRequestStore((s) => s.setSize);
  const setArtist = usePrivateRequestStore((s) => s.setArtist);

  useEffect(() => {
    if (id) setArtist(String(id));
  }, [id]);

  // User can only select one size. When a Pressable is pressed, only that one will be selected.
  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingHorizontal: s(16), paddingBottom: mvs(100) }}>
        <ScaledText
          allowScaling={false}
          variant="md"
          className="text-foreground text-center font-montserratMedium"
          style={{
            marginTop: mvs(8),
            marginBottom: mvs(24),
            paddingHorizontal: s(16),
          }}
        >
          Che dimensioni approssimative vorresti per il tatuaggio?{" "}
          <ScaledText variant="md" className="text-primary">
            *
          </ScaledText>
        </ScaledText>

        <View style={{ gap: s(16) }}>
          {sizeOptions.map((opt) => {
            const isSelected = size === opt.key;
            return (
              <Pressable
                key={opt.key}
                className="flex-row items-center border-gray/20 bg-gray-foreground border rounded-xl"
                style={{ paddingHorizontal: s(8), paddingVertical: mvs(16) }}
                onPress={() => setSize(opt.key as any)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View className="items-center" style={{ width: s(40) }}>
                  {isSelected ? (
                    <SVGIcons.CircleCheckedCheckbox
                      width={s(20)}
                      height={s(20)}
                    />
                  ) : (
                    <SVGIcons.CircleUncheckedCheckbox
                      width={s(20)}
                      height={s(20)}
                    />
                  )}
                </View>
                <View className="flex-1">
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-montserratMedium"
                  >
                    {opt.label}
                  </ScaledText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#000000",
        }}
      >
        <NextBackFooter
          onBack={() => router.back()}
          onNext={() => router.push(`/user/${id}/request/references`)}
          nextLabel="Avanti"
          backLabel="Indietro"
          nextDisabled={!size}
        />
      </View>
    </View>
  );
}
