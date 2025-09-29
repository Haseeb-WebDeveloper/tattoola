import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Feather from '@expo/vector-icons/Feather';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

// Map route names to Feather icon names
const routeIconMap: Record<string, keyof typeof Feather.glyphMap> = {
  index: "home",
  search: "search",
  upload: "upload",
  inbox: "message-circle",
  profile: "user",
};

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: TabBarProps) {

  const getIcon = (routeName: string, isFocused: boolean) => {
    const iconName = routeIconMap[routeName] || "circle";
    return (
      <Feather
        name={iconName}
        size={24}
        color={isFocused ? "#ffffff" : "#A49A99"}
      />
    );
  };

  return (
    <View className="bg-background p-4 relative">
      <View className="rounded-full overflow-hidden">
        <LinearGradient
          colors={["#3a0000", "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="flex-row items-center justify-around px-4 py-4"
          style={{ borderRadius: 9999 }}
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
                <Text
                  className={`ta-body-4 mt-1 ${
                    isFocused ? "text-foreground" : "text-gray"
                  }`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </LinearGradient>
      </View>
    </View>
  );
}
