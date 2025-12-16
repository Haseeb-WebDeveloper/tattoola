import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, Image, Modal, TouchableOpacity, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface StudioPhoto {
  id: string;
  imageUrl: string;
  order: number;
}

interface StudioPhotoViewerProps {
  visible: boolean;
  photos: StudioPhoto[];
  initialIndex?: number;
  onClose: () => void;
  studioName?: string;
}

// Zoomable Image Component
const ZoomableImage: React.FC<{
  imageUrl: string;
  width: number;
  height: number;
}> = ({ imageUrl, width, height }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

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
      } else if (scale.value > 3) {
        // Cap max zoom
        scale.value = withSpring(3);
        savedScale.value = 3;
      } else {
        savedScale.value = scale.value;
      }
    });

  // Pan only when zoomed in, and require 2 fingers so one-finger swipes go to FlatList
  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value > 1) {
        const maxTranslateX = (width * (scale.value - 1)) / 2;
        const maxTranslateY = (height * (scale.value - 1)) / 2;

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
        // Zoom in
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    doubleTapGesture,
    pinchGesture,
    panGesture
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          {
            width,
            height,
            alignItems: "center",
            justifyContent: "center",
          },
          animatedStyle,
        ]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{
            width,
            height,
          }}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
};

export const StudioPhotoViewer: React.FC<StudioPhotoViewerProps> = ({
  visible,
  photos,
  initialIndex = 0,
  onClose,
  studioName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible && initialIndex !== undefined && initialIndex >= 0 && initialIndex < photos.length) {
      setCurrentIndex(initialIndex);
      // Scroll to initial index after a short delay to ensure FlatList is rendered
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: initialIndex,
            animated: false,
          });
        } catch (error) {
          // Fallback to scrollToOffset if scrollToIndex fails
          flatListRef.current?.scrollToOffset({
            offset: initialIndex * screenWidth,
            animated: false,
          });
        }
      }, 100);
    }
  }, [visible, initialIndex, photos.length]);

  const handleScroll = (event: any) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / screenWidth
    );
    if (index >= 0 && index < photos.length) {
      setCurrentIndex(index);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      try {
        flatListRef.current?.scrollToIndex({
          index: newIndex,
          animated: true,
        });
      } catch (error) {
        flatListRef.current?.scrollToOffset({
          offset: newIndex * screenWidth,
          animated: true,
        });
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      try {
        flatListRef.current?.scrollToIndex({
          index: newIndex,
          animated: true,
        });
      } catch (error) {
        flatListRef.current?.scrollToOffset({
          offset: newIndex * screenWidth,
          animated: true,
        });
      }
    }
  };

  if (!visible || photos.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView className="flex-1">
        <View className="flex-1 bg-black">
        {/* Header */}
        <View
          className="relative flex-row items-center justify-center"
          style={{
            paddingHorizontal: s(16),
            paddingTop: mvs(56),
            paddingBottom: mvs(16),
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            className="absolute items-center justify-center rounded-full"
            style={{
              width: s(34),
              height: s(34),
              left: s(21),
              top: mvs(56),
              padding: s(8),
              backgroundColor: "rgba(0, 0, 0, 0.50)",
            }}
          >
            <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
          </TouchableOpacity>

          {/* Studio Name */}
          {studioName && (
            <ScaledText
              allowScaling={false}
              className="text-white"
              style={{
                fontFamily: "font-neueBold",
                fontSize: 14,
                fontStyle: "normal",
                fontWeight: "600",
                lineHeight: 23,
                paddingTop: mvs(5),
              }}
            >
              {studioName}
            </ScaledText>
          )}
        </View>

        {/* Full-screen Photo Carousel */}
        <View className="flex-1 items-center justify-center" style={{ position: "relative" }}>
          <FlatList
            ref={flatListRef}
            data={photos}
            horizontal
            pagingEnabled
            scrollEnabled={photos.length > 1}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            keyExtractor={(item) => item.id}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            contentContainerStyle={{
              alignItems: "center",
              justifyContent: "center",
            }}
            renderItem={({ item }) => (
              <View 
                style={{ 
                  width: screenWidth,
                  height: screenHeight * 0.7,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ZoomableImage
                  imageUrl={item.imageUrl}
                  width={screenWidth}
                  height={screenHeight * 0.7}
                />
              </View>
            )}
          />

          {/* Navigation Arrows - Centered in the image container */}
          {photos.length > 1 && (
            <>
              {currentIndex > 0 && (
                <TouchableOpacity
                  onPress={handlePrevious}
                  className="absolute items-center justify-center rounded-full"
                  style={{
                    left: s(16),
                    top: "50%",
                    marginTop: -s(17.5), // Center the arrow button itself
                    width: s(35),
                    height: s(35),
                    padding: s(8),
                    backgroundColor: "rgba(0, 0, 0, 0.50)",
                  }}
                >
                  <SVGIcons.ChevronLeft width={s(20)} height={s(20)} />
                </TouchableOpacity>
              )}

              {currentIndex < photos.length - 1 && (
                <TouchableOpacity
                  onPress={handleNext}
                  className="absolute items-center justify-center rounded-full"
                  style={{
                    right: s(16),
                    top: "50%",
                    marginTop: -s(17.5), // Center the arrow button itself
                    width: s(35),
                    height: s(35),
                    padding: s(8),
                    backgroundColor: "rgba(0, 0, 0, 0.50)",
                  }}
                >
                  <SVGIcons.ChevronRight width={s(20)} height={s(20)} />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Page Indicators - Dots at bottom of viewer */}
          {photos.length > 1 && (
            <View
              className="absolute flex-row items-center justify-center"
              style={{
                bottom: mvs(50),
                left: 0,
                right: 0,
                gap: s(4),
              }}
            >
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: s(6),
                    height: s(6),
                    borderRadius: s(3),
                    backgroundColor: index === currentIndex ? "#AE0E0E" : "rgba(255, 255, 255, 0.3)",
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

