import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type InvoiceStatusFilter = "ALL" | "PAID" | "OPEN" | "UNCOLLECTIBLE";

type InvoiceFilterModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedStatuses: InvoiceStatusFilter[];
  onApply: (statuses: InvoiceStatusFilter[]) => void;
};

const STATUS_OPTIONS: { value: InvoiceStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tutte" },
  { value: "PAID", label: "Pagate" },
  { value: "OPEN", label: "In sospeso" },
  { value: "UNCOLLECTIBLE", label: "Non riscosse" },
];

export default function InvoiceFilterModal({
  visible,
  onClose,
  selectedStatuses,
  onApply,
}: InvoiceFilterModalProps) {
  const insets = useSafeAreaInsets();
  const [tempSelectedStatuses, setTempSelectedStatuses] =
    useState<InvoiceStatusFilter[]>(selectedStatuses);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (visible) {
      setTempSelectedStatuses(selectedStatuses);
      setIsExpanded(false);
    }
  }, [visible, selectedStatuses]);

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

  const toggleStatus = (status: InvoiceStatusFilter) => {
    if (status === "ALL") {
      // If "All" is selected, clear all other selections
      setTempSelectedStatuses(["ALL"]);
    } else {
      // Remove "ALL" if any specific status is selected
      const newStatuses = tempSelectedStatuses.includes(status)
        ? tempSelectedStatuses.filter((s) => s !== status)
        : [...tempSelectedStatuses.filter((s) => s !== "ALL"), status];
      
      // If no statuses selected, default to "ALL"
      setTempSelectedStatuses(newStatuses.length > 0 ? newStatuses : ["ALL"]);
    }
  };

  const handleReset = () => {
    setTempSelectedStatuses(["ALL"]);
  };

  const handleApply = () => {
    onApply(tempSelectedStatuses);
    onClose();
  };

  const displayText =
    tempSelectedStatuses.length === 0 ||
    (tempSelectedStatuses.length === 1 && tempSelectedStatuses[0] === "ALL")
      ? "Tutte"
      : tempSelectedStatuses.length === 1
        ? STATUS_OPTIONS.find((opt) => opt.value === tempSelectedStatuses[0])
            ?.label || "Tutte"
        : `${tempSelectedStatuses.length} selezionate`;

  const hasActiveFilters =
    tempSelectedStatuses.length > 0 &&
    !(tempSelectedStatuses.length === 1 && tempSelectedStatuses[0] === "ALL");

  const handleBackdropPress = () => {
    onClose();
  };

  return (
    <>
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
                backgroundColor: "rgba(0, 0, 0, 0.90)",
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
                paddingTop: mvs(10),
              }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View
                className="flex-row items-center justify-between"
                style={{ marginBottom: mvs(20) }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-foreground font-neueBold"
                >
                  Filtra fatture
                </ScaledText>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={handleReset}>
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-gray font-neueLight"
                    >
                      Reimposta
                    </ScaledText>
                  </TouchableOpacity>
                )}
              </View>

              {/* Status Filter Dropdown */}
              <View style={{ marginBottom: mvs(24) }}>
                {/* Collapsed State */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setIsExpanded(!isExpanded)}
                  className="bg-tat-foreground border-gray flex-row items-center justify-between"
                  style={{
                    paddingVertical: mvs(12),
                    paddingHorizontal: s(16),
                    borderWidth: s(1),
                    borderRadius: s(8),
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-montserratMedium"
                  >
                    {displayText}
                  </ScaledText>
                  <View
                    style={{
                      transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
                    }}
                  >
                    <SVGIcons.ChevronDown width={s(14)} height={s(14)} />
                  </View>
                </TouchableOpacity>

                {/* Expanded Options */}
                {isExpanded && (
                  <View
                    className="bg-tat-foreground border-gray mt-2"
                    style={{
                      borderWidth: s(1),
                      borderRadius: s(8),
                      overflow: "hidden",
                    }}
                  >
                    {STATUS_OPTIONS.map((option) => {
                      const isSelected = tempSelectedStatuses.includes(
                        option.value
                      );
                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => toggleStatus(option.value)}
                          style={{
                            paddingVertical: mvs(14),
                            paddingHorizontal: s(16),
                            borderBottomWidth:
                              option.value !==
                              STATUS_OPTIONS[STATUS_OPTIONS.length - 1].value
                                ? s(0.5)
                                : 0,
                            borderBottomColor: "#908D8F",
                          }}
                        >
                          <View className="flex-row items-center justify-between">
                            <ScaledText
                              allowScaling={false}
                              variant="sm"
                              className="text-gray font-montserratMedium"
                            >
                              {option.label}
                            </ScaledText>
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
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-4" style={{ marginTop: mvs(12) }}>
                <TouchableOpacity
                  onPress={handleReset}
                  className="flex-1 border border-gray rounded-full items-center justify-center"
                  style={{ paddingVertical: mvs(12) }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueSemibold text-center"
                  >
                    Reimposta
                  </ScaledText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleApply}
                  className={`flex-1 rounded-full items-center justify-center ${
                    hasActiveFilters ? "bg-primary" : "bg-primary/50"
                  }`}
                  style={{ paddingVertical: mvs(12) }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-white font-neueSemibold text-center"
                    numberOfLines={1}
                    style={{ flexShrink: 1 }}
                  >
                    Applica filtri
                  </ScaledText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

