import RequestHeader from "@/components/ui/RequestHeader";
import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";

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

  return (
    <View className="flex-1 bg-background">
      <RequestHeader title="Inviare una richiesta privata a" stepIndex={0} totalSteps={5} />
      <View className="px-4">
        <Text className="text-foreground tat-body-1 text-center mt-2 mb-6">
          Approximately what size would you like the tattoo to be?
        </Text>

        <View className="gap-4">
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSize(opt.key as any)}
              className={`rounded-xl px-4 py-5 ${size === opt.key ? "border-2 border-primary bg-foreground/10" : "border border-foreground/30"}`}
              activeOpacity={0.9}
            >
              <Text className="text-foreground tat-body-1">{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="flex-row justify-between px-4 py-4 mt-auto">
        <TouchableOpacity onPress={() => router.back()} className="rounded-full border px-6 py-3">
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!size}
          onPress={() => router.push("/user/" + id + "/request/references" as any)}
          className={`rounded-full px-8 py-3 ${size ? "bg-primary" : "bg-gray/40"}`}
        >
          <Text className="text-white">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


