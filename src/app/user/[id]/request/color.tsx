import RequestHeader from "@/components/ui/RequestHeader";
import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function ColorStep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const color = usePrivateRequestStore((s) => s.answers.color);
  const setColor = usePrivateRequestStore((s) => s.setColor);

  return (
    <View className="flex-1 bg-background">
      <RequestHeader title="Inviare una richiesta privata a" stepIndex={2} totalSteps={5} />

      <View className="px-4">
        <Text className="text-foreground tat-body-1 text-center mt-2 mb-6">Would you like a color or black and white tattoo?</Text>
        <View className="gap-4">
          <TouchableOpacity onPress={() => setColor("black_white") as any} className={`rounded-xl px-4 py-5 ${color === "black_white" ? "border-2 border-primary bg-foreground/10" : "border border-foreground/30"}`}>
            <Text className="text-foreground tat-body-1">In bianco e nero ◾◽</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setColor("color") as any} className={`rounded-xl px-4 py-5 ${color === "color" ? "border-2 border-primary bg-foreground/10" : "border border-foreground/30"}`}>
            <Text className="text-foreground tat-body-1">A colori 🎨</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row justify-between px-4 py-4 mt-auto">
        <TouchableOpacity onPress={() => router.back()} className="rounded-full border px-6 py-3">
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={!color} onPress={() => router.push(`/user/${id}/request/description` as any)} className={`rounded-full px-8 py-3 ${color ? "bg-primary" : "bg-gray/40"}`}>
          <Text className="text-white">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


