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
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type StyleFilterProps = {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  facets: StyleFacet[];
  allStyles: StyleFacet[];
  enabledStyleIds: Set<string>;
  onDisabledFilterPress?: () => void;
  isLoading?: boolean;
  onConfirm?: () => void;
};

export default function StyleFilter({
  selectedIds,
  onSelectionChange,
  facets,
  allStyles,
  enabledStyleIds,
  onDisabledFilterPress,
  isLoading = false,
  onConfirm,
}: StyleFilterProps) {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [showStyleInfoModal, setShowStyleInfoModal] = useState(false);
  const [fullStyleData, setFullStyleData] = useState<{
    id: string;
    name: string;
    imageUrl?: string | null;
    description?: string | null;
  } | null>(null);

  const toggleStyle = (styleId: string) => {
    // Allow deselection even if disabled (user might have selected it before it became disabled)
    if (selectedIds.includes(styleId)) {
      const newSelectedIds = selectedIds.filter((id) => id !== styleId);
      onSelectionChange(newSelectedIds);
      return;
    }

    // Check if style is enabled (data-driven) before allowing selection
    if (!enabledStyleIds.has(styleId)) {
      // Style is disabled, show toast and prevent selection
      onDisabledFilterPress?.();
      return;
    }

    const newSelectedIds = [...selectedIds, styleId];
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
        ? allStyles.find((s) => s.id === selectedIds[0])?.name || facets.find((s) => s.id === selectedIds[0])?.name || "1 selezionato"
        : `${selectedIds.length} selezionati`;

  // Show all available styles (not just data-driven facets)
  const availableFacets = allStyles.length > 0 ? allStyles : facets;

  return (
    <>
      {/* Collapsed State */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => bottomSheetRef.current?.present()}
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

      {/* Expanded Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={["80%", "90%"]}
        enablePanDownToClose
        enableOverDrag={false}
        topInset={insets.top + mvs(80)}
        enableContentPanningGesture={false}
        backgroundStyle={{
          backgroundColor: "#100C0C",
          borderTopLeftRadius: s(24),
          borderTopRightRadius: s(24),
        }}
        handleIndicatorStyle={{
          backgroundColor: "#908D8F",
          width: s(30),
          height: mvs(4),
        }}
        onChange={(index) => {
          if (index >= 0) {
            setSheetIndex(index);
          }
        }}
      >
        {/* Dropdown Header (Collapsed State in Sheet) */}
        <TouchableOpacity
          onPress={() => {
            // User confirms current selection and closes sheet
            onConfirm?.();
            bottomSheetRef.current?.dismiss();
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
        <BottomSheetScrollView
          className="flex-1"
          style={{ paddingTop: mvs(16) }}
          contentContainerStyle={{
            paddingBottom:
              insets.bottom + (sheetIndex === 0 ? mvs(140) : mvs(32)),
          }}
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
              const isEnabled = enabledStyleIds.has(facet.id);
              return (
                <Pressable
                  key={facet.id}
                  onPress={() => toggleStyle(facet.id)}
                  className="border-b border-gray/20"
                  style={{
                    paddingHorizontal: s(20),
                    paddingVertical: mvs(12),
                    opacity: isEnabled ? 1 : 0.5,
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
                      disabled={!isEnabled}
                    >
                      {isSelected ? (
                        <SVGIcons.CheckedCheckbox width={s(17)} height={s(17)} />
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
        </BottomSheetScrollView>
      </BottomSheetModal>
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
