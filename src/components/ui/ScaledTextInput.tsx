import { mvs, s } from "@/utils/scale";
import React from "react";
import { TextInput, TextInputProps, View, ViewStyle } from "react-native";

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
  return (
    <View className={containerClassName} style={containerStyle}>
      <TextInput
        allowFontScaling={false}
        style={[
          {
            paddingHorizontal: s(12),
            paddingVertical: mvs(8),
            fontSize: s(12),
            lineHeight: mvs(23),
          },
          style,
        ]}
        {...rest}
      />
      {rightAccessory}
    </View>
  );
};

export default ScaledTextInput;


