import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

interface AnimatedDotsProps {
  color?: string;
  size?: number;
}

export const AnimatedDots: React.FC<AnimatedDotsProps> = ({
  color = "#F4C430",
  size = 4,
}) => {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (
      dotOpacity: Animated.Value,
      delay: number
    ): Animated.CompositeAnimation => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);
    };

    const animation = Animated.loop(
      Animated.stagger(0, [
        animateDot(dot1Opacity, 0),
        animateDot(dot2Opacity, 300),
        animateDot(dot3Opacity, 600),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  return (
    <View style={{ flexDirection: "row", gap: 3, alignItems: "center" }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: dot1Opacity,
        }}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: dot2Opacity,
        }}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: dot3Opacity,
        }}
      />
    </View>
  );
};
