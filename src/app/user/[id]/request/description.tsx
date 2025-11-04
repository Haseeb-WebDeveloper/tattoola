import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { mvs, s } from "@/utils/scale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import NextBackFooter from "@/components/ui/NextBackFooter";

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
            Describe your tattoo design in brief
          </ScaledText>
          <ScaledTextInput
            containerClassName="rounded-2xl border border-gray text-foreground"
            style={{
              minHeight: mvs(180),
              textAlignVertical: "top",
              paddingHorizontal: s(16),
              paddingVertical: mvs(12),
              color: "#FFFFFF",
              fontSize: s(12),
            }}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your tattoo design in brief"
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={6}
          />
        </View>
      </KeyboardAwareScrollView>

      <NextBackFooter
        onBack={() => router.back()}
        onNext={() => router.push(`/user/${id}/request/age`)}
        nextLabel="Next"
        backLabel="Back"
      />
    </View>
  );
}
