import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s, scaledFont } from "@/utils/scale";
import { BlurView } from "expo-blur";
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
          locations={[0.1, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "100%",
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
          {/* Bottom Section */}
          <View>
            {/* Logo and tagline */}
            <View style={{ alignItems: "center", marginBottom: mvs(32) }}>
              {/* Logo */}
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: mvs(8),
                }}
              >
                <SVGIcons.Logo height={s(50)} />
              </View>
              {/* Tagline */}
              <ScaledText
                variant="lg"
                allowScaling={false}
                className="text-center text-white font-neueLight"
              >
                Dove i tatuaggi incontrano le loro storie.
              </ScaledText>
            </View>

            {/* Two Cards in a Row */}
            <View
              style={{
                flexDirection: "row",
                gap: s(14),
                marginBottom: mvs(24),
              }}
            >
              {/* Discover tattoos card */}
              <Pressable
                onPress={() => router.push("/(tabs)" as any)}
                style={{
                  width: s(147),
                  height: mvs(153),
                  borderRadius: s(8),
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <BlurView
                  intensity={10}
                  tint="dark"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                <LinearGradient
                  colors={["rgba(58, 0, 0, 0.50)", "rgba(25, 10, 10, 0.50)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.34, y: 1 }}
                  style={{
                    flex: 1,
                    padding: mvs(8),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                <View style={{ marginBottom: mvs(12) }}>
                  <SVGIcons.DiscoverTattoo width={s(56)} height={s(38)} />
                </View>
                <ScaledText
                  allowScaling={false}
                  className="text-white font-neueSemibold"
                  style={{
                    fontSize: scaledFont(16),
                    marginBottom: mvs(4),
                    textAlign: "center",
                  }}
                >
                  Discover tattoos
                </ScaledText>
                <ScaledText
                  allowScaling={false}
                  className="text-gray font-montserratRegular"
                  style={{
                    fontSize: scaledFont(12),
                    color: "#A49A99",
                    textAlign: "center",
                  }}
                >
                  Discover styles that match your identity
                </ScaledText>
                </LinearGradient>
              </Pressable>

              {/* Explore artists card */}
              <Pressable
                onPress={() => router.push("/(tabs)/search" as any)}
                style={{
                  width: s(147),
                  height: mvs(153),
                  borderRadius: s(8),
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <BlurView
                  intensity={10}
                  tint="dark"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                <LinearGradient
                  colors={["rgba(58, 0, 0, 0.50)", "rgba(25, 10, 10, 0.50)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.34, y: 1 }}
                  style={{
                    flex: 1,
                    padding: mvs(8),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                <View style={{ marginBottom: mvs(12) }}>
                  <SVGIcons.ExploreArtist width={s(32)} height={s(32)} />
                </View>
                <ScaledText
                  allowScaling={false}
                  className="text-white font-neueSemibold"
                  style={{
                    fontSize: scaledFont(16),
                    marginBottom: mvs(4),
                    textAlign: "center",
                  }}
                >
                  Explore artists
                </ScaledText>
                <ScaledText
                  allowScaling={false}
                  className="text-gray font-montserratRegular"
                  style={{
                    fontSize: scaledFont(12),
                    color: "#A49A99",
                    textAlign: "center",
                  }}
                >
                  Meet talented tattoo artists near you
                </ScaledText>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Bottom text links in corners */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Pressable onPress={() => router.push("/(tabs)")}>
                <ScaledText
                  allowScaling={false}
                  className="text-white font-montserratRegular"
                  style={{
                    fontSize: scaledFont(18),
                  }}
                >
                  Salta
                </ScaledText>
              </Pressable>

              <Pressable onPress={() => router.push("/(auth)/login")}>
                <ScaledText
                  allowScaling={false}
                  className="text-white font-montserratRegular"
                  style={{
                    fontSize: scaledFont(18),
                  }}
                >
                  Accedi
                </ScaledText>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
