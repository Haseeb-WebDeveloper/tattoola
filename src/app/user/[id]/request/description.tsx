import RequestHeader from "@/components/ui/RequestHeader";
import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function DescriptionStep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const description = usePrivateRequestStore((s) => s.answers.description) || "";
  const setDescription = usePrivateRequestStore((s) => s.setDescription);

  return (
    <View className="flex-1 bg-background">
      <RequestHeader title="Inviare una richiesta privata a" stepIndex={3} totalSteps={5} />

      <View className="px-4">
        <Text className="text-foreground tat-body-1 text-center mt-2 mb-6">Describe your tattoo design in brief</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Descrivi la tua idea, lo stile che ti piace"
          placeholderTextColor="#A49A99"
          multiline
          numberOfLines={6}
          className="text-foreground rounded-2xl border border-foreground/40 px-4 py-3"
          style={{ minHeight: 180, textAlignVertical: "top" }}
        />
      </View>

      <View className="flex-row justify-between px-4 py-4 mt-auto">
        <TouchableOpacity onPress={() => router.back()} className="rounded-full border px-6 py-3">
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={!description.trim()} onPress={() => router.push(`/user/${id}/request/age` as any)} className={`rounded-full px-8 py-3 ${description.trim() ? "bg-primary" : "bg-gray/40"}`}>
          <Text className="text-white">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


