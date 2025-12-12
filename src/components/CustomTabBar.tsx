import { Badge } from "@/components/ui/Badge";
import { ScaledText } from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useUser } from "@/providers/AuthProvider";
import { useAuthRequiredStore } from "@/stores/authRequiredStore";
import { useTotalUnreadCount } from "@/stores/chatInboxStore";
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
    const size = s(26);

    if (avatar) {
      return (
        <Image
          source={{ uri: avatar }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: isFocused ? 1 : 0.7,
            // borderWidth: isFocused ? 1.5 : 0,
            // borderColor: isFocused ? "#ffffff" : "transparent",
          }}
          resizeMode="cover"
          fadeDuration={0} // Instant display from cache
        />
      );
    }

    // Fallback to Profile icon if no avatar
    const ProfileIcon = SVGIcons.NoUser;
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
  const totalUnreadCount = useTotalUnreadCount();

  const getIcon = (routeName: string, isFocused: boolean) => {
    // Special handling for profile tab to show user avatar or Accedi icon
    if (routeName === "profile") {
      if (!user) {
        // Show Accedi icon for anonymous users
        return <SVGIcons.Accedi width={s(24)} height={s(24)} />;
      }
      return <ProfileAvatar avatar={user?.avatar} isFocused={isFocused} />;
    }

    const iconName = routeIconMap[routeName];
    const IconComponent = iconName ? SVGIcons[iconName] : null;
    if (!IconComponent) return null;
    
    const icon = (
      <IconComponent
        width={s(24)}
        height={s(24)}
        color={isFocused ? "#ffffff" : "#A49A99"}
        style={{
          opacity: isFocused ? 1 : 0.7,
        }}
      />
    );

    // Add badge to inbox icon if there are unread messages
    if (routeName === "inbox" && totalUnreadCount > 0) {
      return (
        <View style={{ position: "relative" }}>
          {icon}
          <View
            style={{
              position: "absolute",
              top: -s(4),
              right: -s(4),
              zIndex: 10,
            }}
          >
            <Badge count={totalUnreadCount} />
          </View>
        </View>
      );
    }

    return icon;
  };

  // Find the upload route for the floating button
  const uploadRoute = state.routes.find((route: any) => route.name === "upload");
  const uploadOptions = uploadRoute ? descriptors[uploadRoute.key].options : {};

  const handleUploadPress = () => {
    if (!user) {
      useAuthRequiredStore.getState().show("Sign in to share your tattoos");
      return;
    }
    router.push("/upload/media");
  };

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      {/* Floating + button - positioned outside the clipping container */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={uploadOptions.tabBarAccessibilityLabel}
        testID={uploadOptions.tabBarTestID}
        onPress={handleUploadPress}
        style={{
          position: "absolute",
          alignSelf: "center",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 400,
          width: s(56),
          height: s(56),
          borderRadius: s(28),
          backgroundColor: "#AE0E0E",
          top: mvs(20),
          shadowColor: "#AE0E0E",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {getIcon("upload", true)}
      </TouchableOpacity>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
        locations={[0, 0.3, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setTabBarHeight(height);
          }}
          style={{
            paddingHorizontal: s(12),
            paddingBottom: mvs(8),
            paddingTop: mvs(32),
          }}
        >
          <LinearGradient
            colors={["#3a0000ec", "#000000f5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 9999,
              paddingHorizontal: s(16),
              paddingVertical: mvs(16),
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
                // Skip upload - it's handled by the floating button
                if (route.name === "upload") {
                  return;
                }

                // For anonymous users, inbox shows auth modal
                if (route.name === "inbox" && !user) {
                  useAuthRequiredStore.getState().show("Sign in to access your messages");
                  return;
                }

                // For anonymous users, profile tab goes to login
                if (route.name === "profile" && !user) {
                  router.push("/(auth)/login");
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

              // Render a spacer for the upload position to maintain layout
              if (route.name === "upload") {
                return (
                  <View
                    key={route.key}
                    style={{
                      width: s(56),
                      height: s(24),
                    }}
                  />
                );
              }

              // Special handling for profile tab when user is anonymous
              const isProfileTab = route.name === "profile";
              const showAccediLabel = isProfileTab && !user;

              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  className={showAccediLabel ? "bg-primary " : ""}
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                  }}
                >
                  {getIcon(route.name, isFocused)}
                  <ScaledText
                    variant="11"
                    className={` bg-transparent font-neueBold ${
                      showAccediLabel
                        ? "text-foreground"
                        : isFocused
                          ? "text-foreground"
                          : "text-gray"
                    }`}
                    style={{ marginTop: mvs(4) }}
                  >
                    {showAccediLabel ? "Accedi" : label}
                  </ScaledText>
                </TouchableOpacity>
              );
            })}
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>
  );
}
