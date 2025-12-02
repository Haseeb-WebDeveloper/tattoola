import { mvs, s } from "@/utils/scale";
import React from "react";
import {
  Platform,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

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
  // iOS-specific text alignment fix: lineHeight should be closer to fontSize for proper vertical centering
  const fontSize = s(12);
  const borderRadius = s(12);

  // Check if this is a password field
  const isPasswordField = rest.secureTextEntry === true;

  // Base style with consistent background and border radius to prevent autofill highlight issues
  const baseStyle = {
    paddingHorizontal: s(12),
    paddingVertical: mvs(8.5),
    fontSize: fontSize,
    fontFamily: "Montserrat-SemiBold",
    backgroundColor: "transparent", // Always transparent to prevent autofill yellow background
    borderRadius: borderRadius, // Always rounded to maintain shape during autofill
    ...(Platform.OS === "ios"
      ? {
          // On iOS, lineHeight closer to fontSize ensures text aligns with cursor
          lineHeight: fontSize * 1.2, // ~14.4 for fontSize 12
          paddingVertical: mvs(10), // Slightly more padding for iOS to center better
        }
      : {
          // Android can use the larger lineHeight
          lineHeight: mvs(23),
          // For Android password fields, add additional style to prevent autofill highlight
          ...(isPasswordField && {
            backgroundColor: "transparent", // Force transparent for password fields
          }),
        }),
  };

  // Extract autoComplete from rest to handle it separately if needed
  const { autoComplete, ...textInputProps } = rest;

  return (
    <View
      className={`${containerClassName} bg-gray-foreground`}
      style={[
        {
          borderRadius: borderRadius,
          overflow: "hidden",
        },
        containerStyle,
      ]}
    >
      <TextInput
        allowFontScaling={false}
        style={[
          baseStyle,
          style,
          // Force backgroundColor to be transparent at the end to override any system autofill styles
          // This must be last in the array to ensure it overrides everything
          { backgroundColor: "transparent" },
        ]}
        // Setting underlineColorAndroid to transparent also to avoid underline highlight
        underlineColorAndroid="transparent"
        // Control autofill behavior - use provided autoComplete or default based on field type
        // Using "password" instead of "password-new" might reduce yellow highlight on some Android versions
        autoComplete={
          autoComplete || (isPasswordField ? "password" : undefined)
        }
        // On iOS, use textContentType for better autofill control
        {...(Platform.OS === "ios" && isPasswordField
          ? { textContentType: "newPassword" as const }
          : {})}
        {...textInputProps}
        placeholderTextColor={textInputProps.placeholderTextColor ?? "#262626"}
        // placeholderTextColor={textInputProps.placeholderTextColor ?? "#A49A99"}
      />
      {rightAccessory}
    </View>
  );
};

export default ScaledTextInput;
