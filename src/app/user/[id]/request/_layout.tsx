import { Stack } from "expo-router";
import React from "react";

export default function RequestLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="size" />
      <Stack.Screen name="references" />
      <Stack.Screen name="color" />
      <Stack.Screen name="description" />
      <Stack.Screen name="age" />
      <Stack.Screen name="success" />
    </Stack>
  );
}


