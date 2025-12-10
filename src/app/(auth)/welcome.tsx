import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s, scaledFont } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";

export default function WelcomeScreen() {
  // Video player setup - autoplay, muted, looping
  const videoSource = require("@/assets/images/tattoo.mp4");
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
        {/* Video background - full screen */}
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

        {/* Top gradient overlay for logo and tagline readability */}
        <LinearGradient
          colors={["rgba(0, 0, 0, 0.4)", "rgba(0, 0, 0, 0.2)", "transparent"]}
          locations={[0, 0.3, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "30%",
          }}
          pointerEvents="none"
        />

        {/* Dark background overlay for bottom section (buttons area) */}
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
            height: "75%",
          }}
          pointerEvents="none"
        />

        {/* Content overlay - all positioned absolutely over video */}
        <View
          style={{
            flex: 1,
            position: "relative",
            paddingHorizontal: s(24),
          }}
        >
          {/* Top logo and tagline */}
          <View
            style={{
              position: "absolute",
              top: mvs(40),
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 10,
            }}
          >
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
              allowScaling={false}
              className="text-center text-white font-neueRoman"
              style={{ fontSize: scaledFont(16), lineHeight: 23 }}
            >
              Dove i tatuaggi incontrano le loro storie.
            </ScaledText>
          </View>

          {/* Bottom CTA section - positioned at bottom */}
          <View
            style={{
              position: "absolute",
              bottom: mvs(16),
              left: s(24),
              right: s(24),
              alignItems: "center",
              zIndex: 10,

              borderRadius: 0,
              paddingVertical: mvs(20),
              paddingHorizontal: s(16),
            }}
          >
            {/* Artist Sign up button */}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(auth)/artist-register")}
              style={{
                backgroundColor: "rgba(174, 14, 14, 0.2)",
                borderWidth: 1,
                borderColor: "#AE0E0E",
                borderRadius: 62,
                paddingVertical: mvs(15),
                paddingHorizontal: s(33),
                flexDirection: "row",
                alignItems: "center",
                // width: s(211),
                justifyContent: "center",
                marginBottom: mvs(20),
              }}
            >
              <ScaledText
                allowScaling={false}
                className="text-white font-neueMedium"
                style={{ fontSize: scaledFont(16), lineHeight: 23 }}
              >
                Registrati come artista{" "}
              </ScaledText>
              <SVGIcons.Pen3
                style={{ width: s(24), height: s(18.63), marginLeft: s(8) }}
              />
            </Pressable>

            {/* OR separator */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                marginBottom: mvs(20),
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: s(0.5),
                  backgroundColor: "#A49A99",
                  marginRight: s(8),
                }}
              />
              <ScaledText
                allowScaling={false}
                className="text-gray font-montserratRegular"
                style={{
                  fontSize: scaledFont(14),
                  lineHeight: 23,
                  color: "#A49A99",
                  marginHorizontal: s(8),
                }}
              >
                OPPURE
              </ScaledText>
              <View
                style={{
                  flex: 1,
                  height: s(0.5),
                  backgroundColor: "#A49A99",
                  marginLeft: s(8),
                }}
              />
            </View>

            {/* User Sign up button */}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(auth)/register")}
              style={{
                backgroundColor: "rgba(174, 14, 14, 0.2)",
                borderWidth: 1,
                borderColor: "#AE0E0E",
                borderRadius: 62,
                paddingVertical: mvs(15),
                paddingHorizontal: s(38),
                flexDirection: "row",
                alignItems: "center",
                // width: s(211),
                justifyContent: "center",
                marginBottom: mvs(30),
              }}
            >
              <ScaledText
                allowScaling={false}
                className="text-white font-neueMedium"
                style={{ fontSize: scaledFont(16), lineHeight: 23 }}
              >
                Registrati come utente{" "}
              </ScaledText>
              <SVGIcons.UserFilled
                style={{
                  width: s(17.89),
                  height: s(8.41),
                  marginLeft: s(8),
                }}
              />
            </Pressable>

            {/* Sign in link */}
            <ScaledText
              allowScaling={false}
              className="text-gray font-montserratMedium"
              style={{
                fontSize: scaledFont(14),
                lineHeight: 23,
                color: "#A49A99",
                textAlign: "center",
              }}
            >
              Hai già un account?{" "}
              <ScaledText
                allowScaling={false}
                className="text-white font-montserratBold"
                style={{
                  fontSize: scaledFont(14),
                  lineHeight: 23,
                }}
                onPress={() => router.push("/(auth)/login")}
              >
                Accedi
              </ScaledText>
            </ScaledText>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
