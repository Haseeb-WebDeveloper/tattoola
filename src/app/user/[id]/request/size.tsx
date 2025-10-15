import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, TouchableOpacity, View, Pressable } from "react-native";
import { SVGIcons } from "@/constants/svg";

const options = [
  { key: "credit_card", label: "Le dimensioni di una carta di credito  💳" },
  { key: "palm", label: "Le dimensioni di un palmo di mano ✊" },
  { key: "hand", label: "Le dimensioni di una mano 🖐️" },
  { key: "half_sleeve", label: "“Mezza manica” 💪" },
] as const;

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
      <View className="px-4">
        <Text className="text-foreground tat-body-2-med text-center mt-2 mb-6 px-4">
          Approximately what size would you like the tattoo to be?
        </Text>

        <View className="gap-4">
          {options.map((opt) => {
            const isSelected = size === opt.key;
            return (
              <Pressable
                key={opt.key}
                className={`flex-row items-center px-2 py-4 border-gray/20 bg-gray-foreground border rounded-xl`}
                onPress={() => setSize(opt.key as any)}
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
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-full border border-foreground px-6 py-4"
        >
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!size}
          onPress={() =>
            router.push(("/user/" + id + "/request/references") as any)
          }
          className={`rounded-full px-8 py-4 ${size ? "bg-primary" : "bg-gray/40"}`}
        >
          <Text className="text-foreground">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
