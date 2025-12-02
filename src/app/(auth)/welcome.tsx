import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s, scaledFont, scaledVSize } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";

export default function WelcomeScreen() {
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
            <View
              className="w-full h-fit flex justify-center items-center"
              style={{ height: mvs(100) }}
            >
              {/* <SVGIcons.Logo /> */}
            </View>

            <View className="w-full relative">
              <Image
                source={require("@/assets/auth/welcome-screen.jpg")}
                className="w-full"
                resizeMode="cover"
                style={{ height: scaledVSize(200) }}
              />
              {/* Top-bottom fade gradient overlay */}
              <LinearGradient
                colors={["#000000", "transparent", "transparent", "#000000"]}
                locations={[0, 0.25, 0.75, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                className="absolute w-full top-0 left-0 right-0 bottom-0 z-10"
                style={{
                  height: scaledVSize(200),
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                }}
                pointerEvents="none"
              />
              {/* Headline overlay */}
              <View
                className="absolute left-0 right-0 p-6 z-20"
                style={{ top: mvs(-70) }}
              >
                {/* Top logo */}
                <View
                  className="w-full h-fit flex justify-center items-center" 
                  style={{ height: mvs(55) }}
                >
                  <SVGIcons.Logo height={s(50)} />
                </View>
                <ScaledText
                  allowScaling={false}
                  // variant="lg"
                  className="text-foreground text-center font-montserratBold"
                  style={{ fontSize: scaledFont(18) }}
                >
                  Dove i tatuaggi incontrano le loro storie.
                </ScaledText>
              </View>
            </View>
          </View>

          {/* CTA section text */}
          <View className="flex-1 bg-black px-6 pt-3">
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-center mb-2 font-montserratMediumItalic"
              style={{ color: "#A49A99" }}
            >
              Crea un profilo per mostrare i tuoi lavori
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
                  variant="lg"
                  allowScaling={false}
                  className="text-foreground font-neueBold"
                >
                  Registrati come artista
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
                OPPURE
              </ScaledText>
              <View className="bg-gray/80 flex-1" style={{ height: s(0.5) }} />
            </View>

            {/* User Sign up text*/}
            <ScaledText
              allowScaling={false}
              variant="md"
              className=" text-center mt-6  font-montserratMediumItalic"
              style={{ color: "#A49A99" }}
            >
              Scopri e connettiti con gli artisti
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
                  variant="lg"
                  allowScaling={false}
                  className="text-foreground font-neueBold"
                >
                  Registrati come utente
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
                Hai già un account?{" "}
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-montserratSemibold"
                  onPress={() => router.push("/(auth)/login")}
                >
                  Accedi
                </ScaledText>
              </ScaledText>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
