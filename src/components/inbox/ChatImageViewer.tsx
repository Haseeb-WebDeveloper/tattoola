import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React, { useState } from "react";
import { Dimensions, Image, Linking, Modal, TouchableOpacity, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { toast } from "sonner-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface ChatImageViewerProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

// Zoomable Image Component
const ZoomableImage: React.FC<{
  imageUrl: string;
}> = ({ imageUrl }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const imageWidth = screenWidth;
  const imageHeight = screenHeight * 0.7; // Use 70% of screen height

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        // Reset if zoomed out too much
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > 4) {
        // Cap max zoom at 4x
        scale.value = withSpring(4);
        savedScale.value = 4;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .activeOffsetY([-10, 10])
    .onUpdate((e) => {
      // Only allow panning when zoomed in
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value > 1) {
        // Constrain panning to image bounds
        const maxTranslateX = (imageWidth * (scale.value - 1)) / 2;
        const maxTranslateY = (imageHeight * (scale.value - 1)) / 2;

        if (Math.abs(translateX.value) > maxTranslateX) {
          translateX.value = withSpring(
            translateX.value > 0 ? maxTranslateX : -maxTranslateX
          );
        }
        if (Math.abs(translateY.value) > maxTranslateY) {
          translateY.value = withSpring(
            translateY.value > 0 ? maxTranslateY : -maxTranslateY
          );
        }

        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        // Reset zoom
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom in to 2x
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      // Single tap does nothing - handled by parent
    });

  const composedGesture = Gesture.Simultaneous(
    doubleTapGesture,
    pinchGesture,
    panGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ] as any,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          {
            width: imageWidth,
            height: imageHeight,
            alignItems: "center",
            justifyContent: "center",
          },
          animatedStyle,
        ]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: imageWidth,
            height: imageHeight,
          }}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
};

export const ChatImageViewer: React.FC<ChatImageViewerProps> = ({
  visible,
  imageUrl,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // Open the image URL in browser - the browser/OS will handle the download
      const canOpen = await Linking.canOpenURL(imageUrl);
      
      if (canOpen) {
        await Linking.openURL(imageUrl);
        toast.success("Immagine aperta nel browser");
      } else {
        toast.error("Cannot open this file");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Impossibile aprire l'immagine");
    } finally {
      setDownloading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView className="flex-1">
        <View
          className="flex-1 bg-black/95 items-center justify-center"
          style={{
            paddingTop: mvs(56),
            paddingBottom: mvs(20),
          }}
        >
          {/* Action Buttons */}
          <View
            className="absolute flex-row items-center"
            style={{
              top: mvs(56),
              right: s(16),
              zIndex: 10,
              gap: s(12),
            }}
          >
            {/* Download Button */}
            <TouchableOpacity
              onPress={handleDownload}
              disabled={downloading}
              className="items-center justify-center rounded-full bg-foreground/20"
              style={{
                width: s(40),
                height: s(40),
                opacity: downloading ? 0.5 : 1,
              }}
            >
              {downloading ? (
                <SVGIcons.Loading width={s(16)} height={s(16)} />
              ) : (
                <SVGIcons.Download width={s(16)} height={s(16)} />
              )}
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              className="items-center justify-center rounded-full bg-foreground/20"
              style={{
                width: s(40),
                height: s(40),
              }}
            >
              <SVGIcons.Close width={s(12)} height={s(12)} opacity={0.8} />
            </TouchableOpacity>
          </View>

          {/* Zoomable Image */}
          <View className="flex-1 items-center justify-center">
            <ZoomableImage imageUrl={imageUrl} />
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

