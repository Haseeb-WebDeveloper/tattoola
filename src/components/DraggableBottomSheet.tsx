import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  View,
  StyleSheet,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function DraggableBottomSheet({
  children,
  maxHeight = SCREEN_HEIGHT * 0.75,
  onClose,
}: {
  children: React.ReactNode;
  maxHeight?: number;
  onClose: () => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const CLOSE_THRESHOLD = 120;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only allow downward drag
        return gesture.dy > 5;
      },

      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(lastOffset.current + gesture.dy);
        }
      },

      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > CLOSE_THRESHOLD) {
          // Close the modal
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          // Snap back into place
          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 3,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          maxHeight,
          transform: [{ translateY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000", 
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
});
