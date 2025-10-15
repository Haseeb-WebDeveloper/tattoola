import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, Pressable, View } from "react-native";
import { SVGIcons } from "@/constants/svg";

const options = [
  { key: "black_white", label: "In bianco e nero ◾◽" },
  { key: "color", label: "A colori 🎨" },
] as const;

export default function ColorStep() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const color = usePrivateRequestStore((s) => s.answers.color);
  const setColor = usePrivateRequestStore((s) => s.setColor);
  const setArtist = usePrivateRequestStore((s) => s.setArtist);

  useEffect(() => {
    if (id) setArtist(String(id));
  }, [id]);

  // Keep only one color selection (mimic radio behavior)
  return (
    <View className="flex-1 bg-background">
      <View className="px-4">
        <Text className="text-foreground tat-body-2-med text-center mt-2 mb-6 px-4">
          Would you like a color or black and white tattoo?
        </Text>

        <View className="gap-4">
          {options.map((opt) => {
            const isSelected = color === opt.key;
            return (
              <Pressable
                key={opt.key}
                className={`flex-row items-center px-2 py-4 border-gray/20 bg-gray-foreground border rounded-xl`}
                onPress={() => setColor(opt.key as any)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View className="w-10 items-center">
                  {isSelected ? (
                    <SVGIcons.CircleCheckedCheckbox className="w-5 h-5" />
                  ) : (
                    <SVGIcons.CircleUncheckedCheckbox className="w-5 h-5" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-foreground tat-body-1 font-neueBold">
                    {opt.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-row items-center justify-between px-4 py-4 mt-auto">
        <Pressable
          onPress={() => router.back()}
          className="rounded-full border border-foreground px-6 py-4"
        >
          <Text className="text-foreground">Back</Text>
        </Pressable>
        <Pressable
          disabled={!color}
          onPress={() =>
            router.push(("/user/" + id + "/request/description") as any)
          }
          className={`rounded-full px-8 py-4 ${color ? "bg-primary" : "bg-gray/40"}`}
        >
          <Text className="text-foreground">Next</Text>
        </Pressable>
      </View>
    </View>
  );
}
