import ScaledText from "@/components/ui/ScaledText";
import { mvs, s } from "@/utils/scale";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Image,
    Modal,
    PanResponder,
    ScrollView,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Feature = {
  text: string;
  index?: number;
  details?: string;
  imageUrl?: string;
  imageUrls?: string[]; // Support multiple images
};

type FeatureDetailsModalProps = {
  visible: boolean;
  onClose: () => void;
  feature: Feature | null;
};

export default function FeatureDetailsModal({
  visible,
  onClose,
  feature,
}: FeatureDetailsModalProps) {
  const insets = useSafeAreaInsets();

  // --- Animated sliding mechanics ---
  const translateY = useRef(new Animated.Value(0)).current;
  const dragOffset = useRef(0);
  const isClosingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_evt, gestureState) => {
        return true;
      },
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        dragOffset.current = 0;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        dragOffset.current = 0;
        if (gestureState.dy > 85) {
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: 600,
            duration: 140,
            useNativeDriver: true,
          }).start(() => {
            // Don't reset translateY here - let it stay at the final position
            // Use setTimeout to ensure animation is fully complete before closing
            setTimeout(() => {
              isClosingRef.current = false;
              onClose();
            }, 50);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Only reset when opening, not when closing
      if (!isClosingRef.current) {
        translateY.setValue(0);
      }
    } else {
      // Reset when modal is closed (for next open)
      isClosingRef.current = false;
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  const handleBackdropPress = () => {
    onClose();
  };

  if (!feature) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.90)",
            }}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          className="bg-background"
          {...panResponder.panHandlers}
          style={{
            marginTop: "auto",
            transform: [{ translateY }],
            paddingBottom: Math.max(insets.bottom, mvs(20)),
            borderTopWidth: s(1),
            borderLeftWidth: s(1),
            borderRightWidth: s(1),
            borderColor: "#908D8F",
            borderRadius: s(24),
            maxHeight: "90%",
          }}
        >
          {/* Handle */}
          <View
            className="items-center"
            style={{ paddingTop: mvs(12), paddingBottom: mvs(8) }}
          >
            <View
              className="bg-gray rounded-lg"
              style={{ width: s(30), height: mvs(4) }}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: s(20),
              paddingBottom: mvs(24),
              paddingTop: mvs(12),
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Feature Text */}
            <View style={{ marginBottom: mvs(16) }}>
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-foreground font-neueBold text-center"
              >
                {feature.text}
              </ScaledText>
            </View>

            {/* Feature Images */}
            {(feature.imageUrl || (feature.imageUrls && feature.imageUrls.length > 0)) && (
              <View style={{ marginBottom: mvs(16) }}>
                {feature.imageUrls && feature.imageUrls.length > 0 ? (
                  // Multiple images in a grid (2x2)
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: s(8),
                    }}
                  >
                    {feature.imageUrls.slice(0, 4).map((url, idx) => (
                      <View
                        key={idx}
                        style={{
                          width: "48%",
                          aspectRatio: 1,
                          borderRadius: s(100),
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          source={{ uri: url }}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          resizeMode="cover"
                        />
                      </View>
                    ))}
                  </View>
                ) : feature.imageUrl ? (
                  // Single image
                  <View
                    style={{
                      borderRadius: s(12),
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={{ uri: feature.imageUrl }}
                      style={{
                        width: "100%",
                        height: mvs(200),
                      }}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}
              </View>
            )}

            {/* Feature Details/Description */}
            {feature.details && (
              <View style={{ marginBottom: mvs(16) }}>
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-[#FFF] font-neueLight text-center"
                >
                  {feature.details}
                </ScaledText>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

