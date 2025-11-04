import RequestHeader from "@/components/ui/RequestHeader";
import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function RequestLayout() {
  return (
    <View className="flex-1 bg-red-500">
      <RequestHeader
        title="Inviare una richiesta privata a"
        stepIndex={0}
        totalSteps={5}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="size" />
        <Stack.Screen name="references" />
        <Stack.Screen name="color" />
        <Stack.Screen name="description" />
        <Stack.Screen name="age" />
        <Stack.Screen name="success" />
      </Stack>
    </View>
  );
}
