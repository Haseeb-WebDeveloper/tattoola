import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function DescriptionStep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const description =
    usePrivateRequestStore((s) => s.answers.description) || "";
  const setDescription = usePrivateRequestStore((s) => s.setDescription);

  return (
    <View className="flex-1 bg-background relative">
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={150}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">
          <Text className="text-foreground tat-body-2-med text-center mt-2 mb-6 px-4">
            Describe your tattoo design in brief
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your tattoo design in brief"
            placeholderTextColor="#A49A99"
            multiline
            numberOfLines={6}
            className="text-foreground rounded-2xl border border-foreground/40 px-4 py-3"
            style={{ minHeight: 180, textAlignVertical: "top" }}
          />
        </View>
      </KeyboardAwareScrollView>

      <View className="flex-row items-center justify-between px-6 py-4 bg-background absolute bottom-0 left-0 right-0 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-full border border-foreground px-6 py-4"
        >
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!description.trim()}
          onPress={() => router.push(`/user/${id}/request/age` as any)}
          className={`rounded-full px-8 py-4 ${description.trim() ? "bg-primary" : "bg-gray/40"}`}
        >
          <Text className="text-foreground">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
