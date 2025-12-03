import NextBackFooter from "@/components/ui/NextBackFooter";
import ScaledText from "@/components/ui/ScaledText";
import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { mvs, s } from "@/utils/scale";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";

export default function SuccessScreen() {
  const router = useRouter();
  const reset = usePrivateRequestStore((s) => s.reset);
  
  useEffect(() => {
    return () => {
      // optional: keep state if user goes back
    };
  }, []);

  return (
    <View
      className="flex-1 bg-background items-center justify-center"
      style={{ paddingHorizontal: s(24) }}
    >
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground text-center font-montserratMedium"
        style={{ marginBottom: mvs(8) }}
      >
        🎉 Richiesta inviata con successo!
      </ScaledText>
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground text-center font-montserratMedium"
        style={{ marginBottom: mvs(8) }}
      >
        La tua richiesta è stata condivisa con {}
      </ScaledText>
      <NextBackFooter
        showBack={false}
        onNext={() => {
          reset();
          router.replace("/(tabs)/inbox");
        }}
        nextLabel="Chiudi"
      />
    </View>
  );
}
