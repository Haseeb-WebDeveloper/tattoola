import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Text, View, Pressable } from "react-native";
import { SVGIcons } from "@/constants/svg";

const options = [
  { key: true, label: "Ho più di 18 anni" },
  { key: false, label: "Ho meno di 18 anni" },
] as const;

export default function AgeStep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isAdult = usePrivateRequestStore((s) => s.answers.isAdult);
  const setIsAdult = usePrivateRequestStore((s) => s.setIsAdult);

  return (
    <View className="flex-1 bg-background">
      <View className="px-4">
        <Text className="text-foreground tat-body-2-med text-center mt-2 mb-6 px-4">
          Potresti confermare la tua età?
        </Text>
        <View className="gap-4">
          {options.map((opt) => {
            const isSelected = isAdult === opt.key;
            return (
              <Pressable
                key={String(opt.key)}
                className={`flex-row items-center px-2 py-4 border-gray/20 bg-gray-foreground border rounded-xl`}
                onPress={() => setIsAdult(opt.key as boolean)}
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

      <View className="flex-row justify-between px-4 py-4 mt-auto">
        <Pressable
          onPress={() => router.back()}
          className="rounded-full border border-foreground px-6 py-4"
        >
          <Text className="text-foreground">Back</Text>
        </Pressable>
        <Pressable
          disabled={isAdult === undefined}
          onPress={() => router.push(`/user/${id}/request/success` as any)}
          className={`rounded-full px-8 py-4 ${isAdult !== undefined ? "bg-primary" : "bg-gray/40"}`}
        >
          <Text className="text-foreground">Submit</Text>
        </Pressable>
      </View>
    </View>
  );
}
