import NextBackFooter from "@/components/ui/NextBackFooter";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { sizeOptions } from "@/constants/request-questions";
import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { mvs, s } from "@/utils/scale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, View } from "react-native";


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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={{ paddingHorizontal: s(16) }}>
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
            Che dimensioni approssimative vorresti per il tatuaggio?
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

        <NextBackFooter
          onBack={() => router.back()}
          onNext={() => router.push(`/user/${id}/request/references`)}
          nextLabel="Avanti"
          backLabel="Indietro"
        />
      </ScrollView>
    </View>
  );
}
