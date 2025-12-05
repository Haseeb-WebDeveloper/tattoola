import NextBackFooter from "@/components/ui/NextBackFooter";
import { SVGIcons } from "@/constants/svg";
import { usePostUploadStore } from "@/stores/postUploadStore";
import { s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function UploadDescriptionStep() {
  const caption = usePostUploadStore((s) => s.caption);
  const setCaption = usePostUploadStore((s) => s.setCaption);
  const media = usePostUploadStore((s) => s.media);

  // Animate the pen icon and input padding when the field is focused.
  const [isFocused, setIsFocused] = useState(false);
  const iconAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(iconAnim, {
      toValue: isFocused ? 0 : 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [iconAnim, isFocused]);

  const paddingLeft = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [s(16), s(42)],
  });

  const iconTranslateX = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <ScrollView className="px-6 pt-6">
        {/* Title + helper */}
        <Text className="text-foreground tat-body-1 font-neueBold mb-0.5">
          Descrizione
        </Text>
        <Text className="mb-6 tat-body-4 text-gray font-neueMedium">
          Descrivi il tuo post in poche parole
        </Text>

        {/* Media previews (9/16 aspect, horizontal scroll) */}
        {media.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ gap: 12 }}
          >
            {media.map((m, idx) => (
              <View
                key={`${m.uri}-${idx}`}
                className="rounded-xl overflow-hidden bg-black/40 w-24 aspect-[9/16] relative"
              >
                {m.type === "video" ? (
                  <View className="w-full h-full items-center justify-center bg-black/60">
                    <SVGIcons.Video width={s(30)} height={s(30)} />
                  </View>
                ) : (
                  <Image
                    source={{ uri: m.cloud || m.uri }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                )}
              </View>
            ))}
          </ScrollView>
        )}

        {/* Description input with edit icon */}
        <View className="relative border rounded-2xl border-gray">
          <Animated.View
            className="absolute z-10 items-center justify-center"
            style={{
              top: s(12),
              left: s(16),
              opacity: iconAnim,
              transform: [{ translateX: iconTranslateX }],
            }}
          >
            <SVGIcons.Pen1 width={s(20)} height={s(20)} />
          </Animated.View>
          <AnimatedTextInput
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            className="text-foreground bg-tat-darkMaroon rounded-2xl min-h-[180px] font-neueMedium"
            style={{
              fontSize: s(12),
              paddingLeft,
              paddingRight: s(16),
              paddingVertical: s(12),
            }}
            placeholder="Scrivi una descrizione per il tuo post..."
            value={caption || ""}
            onChangeText={(v) => setCaption(v)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>
      </ScrollView>

      <NextBackFooter
        onBack={() => router.back()}
        onNext={() => router.push("/upload/style")}
        nextDisabled={!caption}
        nextLabel="Avanti"
        backLabel="Indietro"
      />
    </View>
  );
}
