import StyleInfoModal from "@/components/shared/StyleInfoModal";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { fetchTattooStyles } from "@/services/style.service";
import type { StyleFacet } from "@/types/facets";
import { mvs, s } from "@/utils/scale";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type StyleFilterProps = {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  facets: StyleFacet[];
  isLoading?: boolean;
  onConfirm?: () => void;
};

export default function StyleFilter({
  selectedIds,
  onSelectionChange,
  facets,
  isLoading = false,
  onConfirm,
}: StyleFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStyleInfoModal, setShowStyleInfoModal] = useState(false);
  const [fullStyleData, setFullStyleData] = useState<{
    id: string;
    name: string;
    imageUrl?: string | null;
    description?: string | null;
  } | null>(null);

  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });
  const scrollViewRef = useRef<ScrollView>(null);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: Math.max(0, translateY.value) }],
    };
  });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      const newY = context.value.y + event.translationY;
      // Only allow dragging down (positive Y)
      if (newY > 0) {
        translateY.value = newY;
      }
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > 100 || event.velocityY > 500;
      if (shouldClose) {
        translateY.value = withSpring(300, { damping: 50 }, () => {
          runOnJS(setIsExpanded)(false);
          translateY.value = 0;
        });
      } else {
        translateY.value = withSpring(0);
      }
    })
    .activeOffsetY(10)
    .failOffsetX([-10, 10]);

  const toggleStyle = (styleId: string) => {
    const newSelectedIds = selectedIds.includes(styleId)
      ? selectedIds.filter((id) => id !== styleId)
      : [...selectedIds, styleId];

    onSelectionChange(newSelectedIds);
  };

  const handleStyleInfoPress = async (style: StyleFacet, e: any) => {
    e.stopPropagation();
    // Try to fetch full style data with description
    try {
      const allStyles = await fetchTattooStyles();
      const fullStyle = allStyles.find((s) => s.id === style.id);
      if (fullStyle) {
        setFullStyleData(fullStyle);
      } else {
        // Fallback to the style data we have
        setFullStyleData({
          id: style.id,
          name: style.name,
          imageUrl: style.imageUrl,
          description: null,
        });
      }
    } catch (error) {
      // Fallback to the style data we have
      setFullStyleData({
        id: style.id,
        name: style.name,
        imageUrl: style.imageUrl,
        description: null,
      });
    }
    setShowStyleInfoModal(true);
  };

  const displayText =
    selectedIds.length === 0
      ? "Tutti"
      : selectedIds.length === 1
        ? facets.find((s) => s.id === selectedIds[0])?.name || "1 selezionato"
        : `${selectedIds.length} selezionati`;

  // Show all available facets
  const availableFacets = facets;

  return (
    <>
      {/* Collapsed State */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setIsExpanded(true)}
        className="flex-row items-center justify-between bg-tat-foreground border-gray"
        style={{
          paddingVertical: mvs(10),
          paddingHorizontal: s(16),
          borderWidth: s(1),
          borderRadius: s(8),
        }}
      >
        <ScaledText
          allowScaling={false}
          variant="md"
          className="text-gray font-montserratMedium"
        >
          {displayText}
        </ScaledText>
        <SVGIcons.ChevronDown width={s(14)} height={s(14)} />
      </TouchableOpacity>

      {/* Expanded Modal */}
      <Modal
        visible={isExpanded}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsExpanded(false);
          translateY.value = 0;
        }}
      >
        <View className="flex-1 bg-black/50">
          <GestureDetector gesture={panGesture}>
            <Animated.View
              className="flex-1 bg-background rounded-t-3xl"
              style={[{ marginTop: "auto", maxHeight: "80%" }, animatedStyle]}
            >
              {/* Drag Handle - Make it more prominent and touchable */}
              <View
                className="items-center justify-center"
                style={{ 
                  paddingVertical: mvs(16),
                  paddingTop: mvs(12),
                }}
              >
                <View
                  style={{
                    width: s(40),
                    height: mvs(4),
                    backgroundColor: "#908D8F",
                    borderRadius: s(2),
                  }}
                />
              </View>
              {/* Dropdown Header (Collapsed State in Modal) */}
              <TouchableOpacity
                onPress={() => {
                  // User confirms current selection and closes modal
                  onConfirm?.();
                  setIsExpanded(false);
                }}
                activeOpacity={1}
                className="flex-row items-center justify-between bg-background border-gray"
                style={{
                  marginTop: mvs(16),
                  marginHorizontal: s(20),
                  paddingVertical: mvs(12),
                  paddingHorizontal: s(16),
                  borderWidth: s(1),
                  borderRadius: s(8),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-gray font-montserratMedium"
                >
                  {displayText}
                </ScaledText>
                {selectedIds.length === 0 ? (
                  <View style={{ transform: [{ rotate: "180deg" }] }}>
                    <SVGIcons.ChevronDown width={s(14)} height={s(14)} />
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: "#AE0E0E",
                      borderRadius: s(6),
                      paddingHorizontal: s(12),
                      paddingVertical: mvs(4),
                      marginLeft: s(6),
                    }}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-white font-montserratMedium"
                    >
                      Fatto
                    </ScaledText>
                  </View>
                )}
              </TouchableOpacity>

              {/* Styles List */}
              <ScrollView
                ref={scrollViewRef}
                className="flex-1"
                style={{ paddingTop: mvs(16) }}
                contentContainerStyle={{ paddingBottom: mvs(32) }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {isLoading ? (
                  <View
                    className="items-center justify-center"
                    style={{ paddingVertical: mvs(40) }}
                  >
                    <ActivityIndicator size="small" color="#AE0E0E" />
                  </View>
                ) : availableFacets.length === 0 ? (
                  <View
                    className="items-center justify-center"
                    style={{ paddingVertical: mvs(40) }}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-gray font-neueLight"
                    >
                      Nessuno stile disponibile
                    </ScaledText>
                  </View>
                ) : (
                  availableFacets.map((facet) => {
                    const isSelected = selectedIds.includes(facet.id);
                    return (
                      <Pressable
                        key={facet.id}
                        onPress={() => toggleStyle(facet.id)}
                        className="border-b border-gray/20"
                        style={{
                          paddingHorizontal: s(20),
                          paddingVertical: mvs(12),
                        }}
                      >
                        <View className="flex-row items-center justify-between">
                          <TouchableOpacity
                            className="flex-row items-center gap-3 flex-1"
                            onPress={(e) => handleStyleInfoPress(facet, e)}
                            activeOpacity={0.7}
                          >
                            {facet.imageUrl && (
                              <Image
                                source={{ uri: facet.imageUrl }}
                                style={{
                                  width: s(120),
                                  height: mvs(72),
                                  borderRadius: s(8),
                                }}
                                resizeMode="cover"
                              />
                            )}
                            <View className="flex-1">
                              <ScaledText
                                allowScaling={false}
                                variant="md"
                                className="text-gray font-montserratSemibold"
                              >
                                {facet.name}
                              </ScaledText>
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => toggleStyle(facet.id)}
                            hitSlop={{
                              top: 10,
                              bottom: 10,
                              left: 10,
                              right: 10,
                            }}
                          >
                            {isSelected ? (
                              <SVGIcons.CheckedCheckbox
                                width={s(17)}
                                height={s(17)}
                              />
                            ) : (
                              <SVGIcons.UncheckedCheckbox
                                width={s(17)}
                                height={s(17)}
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </Animated.View>
          </GestureDetector>
        </View>
      </Modal>
      <StyleInfoModal
        visible={showStyleInfoModal}
        style={fullStyleData}
        onClose={() => {
          setShowStyleInfoModal(false);
          setFullStyleData(null);
        }}
      />
    </>
  );
}
