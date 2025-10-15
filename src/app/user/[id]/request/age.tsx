import RequestHeader from "@/components/ui/RequestHeader";
import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function AgeStep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isAdult = usePrivateRequestStore((s) => s.answers.isAdult);
  const setIsAdult = usePrivateRequestStore((s) => s.setIsAdult);

  return (
    <View className="flex-1 bg-background">
      <RequestHeader title="Inviare una richiesta privata a" stepIndex={4} totalSteps={5} />

      <View className="px-4">
        <Text className="text-foreground tat-body-1 text-center mt-2 mb-6">Potresti confermare la tua età?</Text>
        <View className="gap-4">
          <TouchableOpacity onPress={() => setIsAdult(true)} className={`rounded-xl px-4 py-5 ${isAdult === true ? "border-2 border-primary bg-foreground/10" : "border border-foreground/30"}`}>
            <Text className="text-foreground tat-body-1">Ho più di 18 anni</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsAdult(false)} className={`rounded-xl px-4 py-5 ${isAdult === false ? "border-2 border-primary bg-foreground/10" : "border border-foreground/30"}`}>
            <Text className="text-foreground tat-body-1">Ho meno di 18 anni</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row justify-between px-4 py-4 mt-auto">
        <TouchableOpacity onPress={() => router.back()} className="rounded-full border px-6 py-3">
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={isAdult === undefined} onPress={() => router.push(`/user/${id}/request/success` as any)} className={`rounded-full px-8 py-3 ${isAdult !== undefined ? "bg-primary" : "bg-gray/40"}`}>
          <Text className="text-white">Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


