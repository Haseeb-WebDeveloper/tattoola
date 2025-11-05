import { mvs, s } from "@/utils/scale";
import React from "react";
import { Platform, TextInput, TextInputProps, View, ViewStyle } from "react-native";

type Props = TextInputProps & {
  containerClassName?: string;
  containerStyle?: ViewStyle | ViewStyle[];
  rightAccessory?: React.ReactNode;
};

export const ScaledTextInput: React.FC<Props> = ({
  containerClassName,
  containerStyle,
  style,
  rightAccessory,
  ...rest
}) => {
  // When autofill/suggestions are used on Android, default background is white. 
  // We override it to transparent so that input stays visually consistent.
  // On iOS, by default, backgroundColor stays transparent and respects parent.
  const autofillStyle =
    Platform.OS === "android"
      ? { backgroundColor: "transparent", borderRadius: s(12) }
      : {};

  return (
    <View className={`${containerClassName} bg-gray-foreground`} style={containerStyle}>
      <TextInput
        allowFontScaling={false}
        style={[
          {
            paddingHorizontal: s(12),
            paddingVertical: mvs(8.5),
            fontSize: s(12),
            lineHeight: mvs(23),
            fontFamily: "Montserrat-SemiBold",
          },
          autofillStyle,
          style,
        ]}
        // Setting underlineColorAndroid to transparent also to avoid underline highlight
        underlineColorAndroid="transparent"
        {...rest}
        placeholderTextColor={rest.placeholderTextColor ?? "#262626"}
        // placeholderTextColor={rest.placeholderTextColor ?? "#A49A99"}
      />
      {rightAccessory}
    </View>
  );
};

export default ScaledTextInput;

