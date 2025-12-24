import ScaledText from "@/components/ui/ScaledText";
import { mvs, s, scaledFont } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";

export default function WelcomeScreen() {
  // Video player setup - autoplay, muted, looping
  const videoSource = require("@/assets/video/intro.mp4");
  const videoPlayer = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={0}
    >
      <View style={{ flex: 1, position: "relative" }}>
        <VideoView
          player={videoPlayer}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
          }}
          contentFit="cover"
          nativeControls={false}
        />

        <LinearGradient
          colors={["rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 0.3)", "transparent"]}
          locations={[0, 0.3, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
          }}
          pointerEvents="none"
        />

        {/* Dark background overlay for bottom section and cards area */}
        <LinearGradient
          colors={["#0A020200", "#0A0101", "#0A0101"]}
          locations={[0.1, 0.9, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "30%",
          }}
          pointerEvents="none"
        />

        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            paddingHorizontal: s(24),
            paddingBottom: mvs(40),
          }}
        >
         
          {/* Start button */}
          <Pressable
            onPress={() => router.replace('/(tabs)' as any)}
            style={{
              backgroundColor: '#C61E1E',
              borderRadius: s(24),
              height: mvs(48),
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              width: '100%',
            }}
          >
            <ScaledText
              allowScaling={false}
              className="text-white font-neueSemibold"
              style={{ fontSize: scaledFont(16) }}
            >
              Start
            </ScaledText>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
