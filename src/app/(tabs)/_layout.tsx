import { RequireAuth } from "@/components/AuthGuard";
import CustomTabBar from "@/components/CustomTabBar";
import { Tabs } from "expo-router";
import React from "react";
// import { SafeAreaView } from "react-native-safe-area-context";

export default function TabLayout() {
  return (
    <RequireAuth>
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
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
    </RequireAuth>
  );
}
