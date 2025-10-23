import NextBackFooter from "@/components/ui/NextBackFooter";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { createPrivateRequestConversation } from "@/services/chat.service";
import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { mvs, s } from "@/utils/scale";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { toast } from "sonner-native";

const options = [
  { key: true, label: "Ho più di 18 anni" },
  { key: false, label: "Ho meno di 18 anni" },
] as const;

export default function AgeStep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isAdult = usePrivateRequestStore((s) => s.answers.isAdult);
  const setIsAdult = usePrivateRequestStore((s) => s.setIsAdult);
  const answers = usePrivateRequestStore((s) => s.answers);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
 
    if (!user?.id || !id) {
      toast.error("User information is missing. Please log in again.");
      return;
    }
    
    setSubmitting(true);
    try {
      const { size, color, description, referenceMedia, isAdult } = answers as any;
      console.log("answers", answers);
      console.log("Creating conversation with:", {
        loverId: user.id,
        artistId: String(id),
      });
      
      const conversation = await createPrivateRequestConversation(user.id, String(id), {
        size,
        color,
        desc: description,
        isAdult,
        references: (referenceMedia || []).map((m: any) => m.cloud || m.uri),
      });
      
      console.log("conversation created", conversation);
      toast.success("Request sent successfully");
      router.replace(`/(tabs)/inbox?conversationId=${conversation.conversationId}` as any);
    } catch (e: any) {
      console.error("Error creating conversation:", e);
      toast.error(e?.message || "Failed to send request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
            Potresti confermare la tua età?
          </ScaledText>
          <View style={{ gap: s(16) }}>
            {options.map((opt) => {
              const isSelected = isAdult === opt.key;
              return (
                <Pressable
                  key={String(opt.key)}
                  className="flex-row items-center border-gray/20 bg-gray-foreground border rounded-xl"
                  style={{ paddingHorizontal: s(8), paddingVertical: mvs(16) }}
                  onPress={() => setIsAdult(opt.key as boolean)}
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
          onNext={handleSubmit}
          nextDisabled={isAdult === undefined || submitting}
          nextLabel={submitting ? "Submitting..." : "Submit"}
          backLabel="Back"
        />
      </ScrollView>
    </View>
  );
}
