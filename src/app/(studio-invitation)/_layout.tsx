import { Stack } from "expo-router";

export default function StudioInvitationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="accept" />
    </Stack>
  );
}

