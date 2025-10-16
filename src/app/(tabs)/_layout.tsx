import { RequireAuth } from "@/components/AuthGuard";
import CustomTabBar from "@/components/CustomTabBar";
import { Tabs } from "expo-router";
import React from "react";
import { View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { KeyboardProvider } from "react-native-keyboard-controller";
// import { SafeAreaView } from "react-native-safe-area-context";

export default function TabLayout() {
  return (
    <RequireAuth>
      <KeyboardProvider>
        <View className="flex-1">
          <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
              headerShown: false,
              tabBarHideOnKeyboard: true,
              tabBarStyle: {
                position: "absolute",
                bottom: 20,
                left: 20,
                right: 20,
                borderRadius: 30,
                backgroundColor: "rgba(0,0,0,0.1)",
                borderTopWidth: 0,
                elevation: 0,
                height: 70,
              },
              tabBarBackground: () => (
                <BlurView
                  tint="dark"
                  intensity={80}
                  style={StyleSheet.absoluteFill}
                />
              ),
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: "Home",
              }}
            />
            <Tabs.Screen
              name="search"
              options={{
                title: "Search",
              }}
            />
            <Tabs.Screen
              name="upload"
              options={{
                title: "Upload",
              }}
            />
            <Tabs.Screen
              name="inbox"
              options={{
                title: "Inbox",
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: "Profile",
              }}
            />
          </Tabs>
        </View>
      </KeyboardProvider>
    </RequireAuth>
  );
}
