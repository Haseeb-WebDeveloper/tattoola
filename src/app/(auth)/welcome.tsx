import { router } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Hero image */}
      <View className="relative">
        {/* Top logo */}
        <View className="mt-4 w-full flex justify-center items-center">
          <Image
            source={require("@/assets/logo/logo-light.png")}
            className="h-16 "
            resizeMode="contain"
          />
        </View>

        <View className="w-full relative">
          <Image
            source={require("@/assets/auth/welcome-screen.jpg")}
            className="w-full h-[320px]"
            resizeMode="cover"
          />
          {/* Top-bottom fade gradient overlay */}
          <LinearGradient
            colors={["#000000", "transparent", "transparent", "#000000"]}
            locations={[0, 0.25, 0.75, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="absolute w-full h-[320px] top-0 left-0 right-0 bottom-0 z-10"
          />
          {/* Headline overlay */}
          <View className="absolute top-2 left-0 right-0 p-6 z-20">
            <Text className="text-foreground text-center text-[18.26px] leading-[30px] font-montserratSemibold">
              Where tattoos meet their stories.
            </Text>
          </View>
        </View>
      </View>

      {/* CTA section text */}
      <View className="flex-1 bg-black px-6 pt-6">
        <Text className="tat-body-2-light text-center mb-2 italic font-montserratMedium">
          Create a profile to showcase your work
        </Text>

        {/* Artist Sign up */}
        <View className="flex justify-center items-center mb-10">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(auth)/artist-register")}
            className="bg-primary rounded-full py-3 px-8 items-center flex-row"
          >
            <Text className="text-foreground tat-body-1 font-neueBold">
              Sign up as Artist
            </Text>
            <Image
              source={require("@/assets/images/icons/pen.png")}
              className="w-6 h-6 ml-2"
              resizeMode="contain"
            />
          </Pressable>
        </View>

        {/* OR */}
        <View className="flex-row items-center justify-center">
          <View className="h-[0.2px] bg-[#A49A99] flex-1 " />
          <Text className="text-[#A49A99] mx-4 font-montserratMedium">OR</Text>
          <View className="h-[0.2px] bg-[#A49A99] flex-1" />
        </View>

        {/* User Sign up text*/}
        <Text className="tat-body-2-light text-center mt-8 italic font-montserratMedium">
          Discover and connect with artists
        </Text>

        {/* User Sign up button */}
        <View className="flex justify-center items-center mt-2">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(auth)/register")}
            className="bg-primary rounded-full py-3 px-8 items-center flex-row"
          >
            <Text className="text-foreground tat-body-1 font-neueBold">
              Sign up as User
            </Text>
            <Image
              source={require("@/assets/images/icons/user.png")}
              className="w-5 h-5 ml-2"
              resizeMode="contain"
            />
          </Pressable>
        </View>

        {/* Divider */}
        <View className="w-full mx-auto items-center ">
          <View
            style={{
              height: 0.5,
              width: "40%",
              backgroundColor: "#A49A99",
              marginVertical: 30,
            }}
          />
        </View>

        <View className="items-center">
          <Text className="text-[#A49A99]">
            Already have an account?{" "}
            <Text
              className="text-foreground font-semibold"
              onPress={() => router.push("/(auth)/login")}
            >
              Sign in
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
