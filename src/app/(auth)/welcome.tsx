import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { mvs, s, scaledVSize } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View
} from "react-native";

export default function WelcomeScreen() {
  const { user, initialized } = useAuth();

  // Removed navigation logic - AuthProvider handles routing after email verification
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#000" }}
      keyboardVerticalOffset={0}
      // Removed className for min-h-[100svh] and set background in style
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          className="flex-1 bg-transparent"
          contentContainerStyle={{ flexGrow: 1 }}
          style={{ zIndex: 1 }}
          showsVerticalScrollIndicator={false}
          bounces
        >
          {/* Hero image */}
          <View className="relative">
            {/* Top logo */}
            <View className="w-full h-fit flex justify-center items-center">
              <SVGIcons.LogoLight width={100} height={100} />
            </View>

            <View className="w-full relative">
              <Image
                source={require("@/assets/auth/welcome-screen.jpg")}
                className="w-full"
                resizeMode="cover"
                style={{ height: scaledVSize(230) }}
              />
              {/* Top-bottom fade gradient overlay */}
              <LinearGradient
                colors={["#000000", "transparent", "transparent", "#000000"]}
                locations={[0, 0.25, 0.75, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                className="absolute w-full top-0 left-0 right-0 bottom-0 z-10"
                style={{
                  height: scaledVSize(230),
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                }}
                pointerEvents="none"
              />
              {/* Headline overlay */}
              <View className="absolute top-2 left-0 right-0 p-6 z-20">
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground text-center font-montserratSemibold"
                >
                  Where tattoos meet their stories.
                </ScaledText>
              </View>
            </View>
          </View>

          {/* CTA section text */}
          <View className="flex-1 bg-black px-6 pt-3">
            <ScaledText
              allowScaling={false}
              variant="md"
              className=" text-gray text-center mb-2 italic font-montserratMedium"
            >
              Create a profile to showcase your work
            </ScaledText>

            {/* Artist Sign up */}
            <View className="flex justify-center items-center mb-10">
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(auth)/artist-register")}
                className="bg-primary rounded-full items-center flex-row"
                style={{ paddingVertical: mvs(10), paddingHorizontal: s(32) }}
              >
                <ScaledText
                  variant="md"
                  allowScaling={false}
                  className="text-foreground font-neueBold"
                >
                  Sign up as Artist
                </ScaledText>
                <SVGIcons.Pen3
                  className="w-6 h-6 ml-2"
                  style={{ width: s(24), height: s(24), marginLeft: s(8) }}
                />
              </Pressable>
            </View>

            {/* OR */}
            <View className="flex-row items-center justify-center">
              <View className="bg-gray/80 flex-1 " style={{ height: s(0.5) }} />
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-gray mx-4 font-montserratMedium"
              >
                OR
              </ScaledText>
              <View className="bg-gray/80 flex-1" style={{ height: s(0.5) }} />
            </View>

            {/* User Sign up text*/}
            <ScaledText
              allowScaling={false}
              variant="md"
              className=" text-gray text-center mt-6 italic font-montserratMedium"
            >
              Discover and connect with artists
            </ScaledText>

            {/* User Sign up button */}
            <View className="flex justify-center items-center mt-2">
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(auth)/register")}
                className="bg-primary rounded-full items-center flex-row"
                style={{ paddingVertical: mvs(10), paddingHorizontal: s(32) }}
              >
                <ScaledText
                  variant="body1"
                  allowScaling={false}
                  className="text-foreground font-neueBold"
                >
                  Sign up as User
                </ScaledText>
                <SVGIcons.UserFilled
                  className="ml-2"
                  style={{ width: s(30), height: s(30), marginLeft: s(8) }}
                />
              </Pressable>
            </View>

            {/* Divider */}
            <View className="w-full mx-auto items-center ">
              <View
                style={{
                  height: s(0.5),
                  width: "40%",
                  backgroundColor: "#A49A99",
                  marginVertical: mvs(30),
                }}
              />
            </View>

            <View className="items-center mb-10">
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-gray font-montserratMedium"
              >
                Already have an account?{" "}
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-montserratSemibold"
                  onPress={() => router.push("/(auth)/login")}
                >
                  Sign in
                </ScaledText>
              </ScaledText>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
