import { ScaledText } from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useUser } from "@/providers/AuthProvider";
import { useTabBarStore } from "@/stores/tabBarStore";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { memo } from "react";
import { Image, TouchableOpacity, View } from "react-native";

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

// Map route names to SVGIcons names
const routeIconMap: Record<string, keyof typeof SVGIcons> = {
  index: "Home",
  search: "Search",
  upload: "Plus",
  inbox: "Inbox",
  profile: "Profile",
};

// Memoized Avatar component for better performance
// React Native's Image component has built-in caching (memory + disk cache)
const ProfileAvatar = memo(
  ({ avatar, isFocused }: { avatar?: string; isFocused: boolean }) => {
    const size = s(24);

    if (avatar) {
      return (
        <Image
          source={{ uri: avatar }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: isFocused ? 1 : 0.7,
            borderWidth: isFocused ? 1.5 : 0,
            borderColor: isFocused ? "#ffffff" : "transparent",
          }}
          resizeMode="cover"
          fadeDuration={0} // Instant display from cache
        />
      );
    }

    // Fallback to Profile icon if no avatar
    const ProfileIcon = SVGIcons.Profile;
    return (
      <ProfileIcon
        width={size}
        height={size}
        color={isFocused ? "#ffffff" : "#A49A99"}
        style={{
          opacity: isFocused ? 1 : 0.7,
        }}
      />
    );
  }
);

ProfileAvatar.displayName = "ProfileAvatar";

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: TabBarProps) {
  const user = useUser();
  const setTabBarHeight = useTabBarStore((state) => state.setTabBarHeight);

  const getIcon = (routeName: string, isFocused: boolean) => {
    // Special handling for profile tab to show user avatar
    if (routeName === "profile") {
      return <ProfileAvatar avatar={user?.avatar} isFocused={isFocused} />;
    }

    const iconName = routeIconMap[routeName];
    const IconComponent = iconName ? SVGIcons[iconName] : null;
    if (!IconComponent) return null;
    return (
      <IconComponent
        width={s(24)}
        height={s(24)}
        color={isFocused ? "#ffffff" : "#A49A99"}
        style={{
          opacity: isFocused ? 1 : 0.7,
        }}
      />
    );
  };

  return (
    <LinearGradient
      colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
      locations={[0, 0.3, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      <View
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setTabBarHeight(height);
        }}
        style={{
          paddingHorizontal: s(12),
          paddingBottom: mvs(8),
          paddingTop: mvs(48),
        }}
      >
        <View className="rounded-full" style={{ overflow: "visible" }}>
          <LinearGradient
            colors={["#3a0000", "#000000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-row items-center justify-around"
            style={{
              borderRadius: 9999,
              paddingHorizontal: s(16),
              paddingVertical: mvs(16),
              overflow: "visible",
            }}
          >
            {state.routes.map((route: any, index: number) => {
              const { options } = descriptors[route.key];
              const label =
                options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                    ? options.title
                    : route.name;

              const isFocused = state.index === index;

              const onPress = () => {
                // Intercept Upload tab to open the upload wizard directly, without showing the tab screen
                if (route.name === "upload") {
                  router.push("/upload/media");
                  return;
                }

                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: "tabLongPress",
                  target: route.key,
                });
              };

              // Special styling for the Upload button
              if (route.name === "upload") {
                return (
                  <TouchableOpacity
                    key={route.key}
                    accessibilityRole="button"
                    accessibilityLabel={options.tabBarAccessibilityLabel}
                    testID={options.tabBarTestID}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    className="items-center justify-center z-[300]"
                    style={{
                      width: s(56),
                      height: s(56),
                      borderRadius: s(28),
                      backgroundColor: "#AE0E0E",
                      marginTop: mvs(-32),
                      shadowColor: "#AE0E0E",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    {getIcon(route.name, true)}
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  className="items-center justify-center flex-1"
                >
                  {getIcon(route.name, isFocused)}
                  <ScaledText
                    variant="11"
                    className={` bg-transparent font-neueBold ${
                      isFocused ? "text-foreground" : "text-gray"
                    }`}
                    style={{ marginTop: mvs(4) }}
                  >
                    {label}
                  </ScaledText>
                </TouchableOpacity>
              );
            })}
          </LinearGradient>
        </View>
      </View>
    </LinearGradient>
  );
}
