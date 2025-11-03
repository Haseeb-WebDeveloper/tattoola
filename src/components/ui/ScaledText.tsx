import { typography, TypographyVariant } from "@/theme/typography";
import React from "react";
import { Text, TextProps, TextStyle } from "react-native";

type Props = TextProps & {
  variant?: TypographyVariant;
  allowScaling?: boolean; // allow OS font scaling override per instance
  style?: TextStyle | TextStyle[];
};

 export const ScaledText: React.FC<Props> = ({
   variant = "md",
   allowScaling = false,
   style,
   children,
   ...rest
 }) => {
   const variantStyle = typography[variant];
   return (
     <Text allowFontScaling={allowScaling} style={[variantStyle, style]} {...rest}>
       {children}
     </Text>
   );
 };

export default ScaledText;
