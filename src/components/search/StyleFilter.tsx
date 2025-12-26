import StyleInfoModal from "@/components/shared/StyleInfoModal";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { fetchTattooStyles } from "@/services/style.service";
import type { StyleFacet } from "@/types/facets";
import { mvs, s } from "@/utils/scale";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

type StyleFilterProps = {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  facets: StyleFacet[];
  allStyles: StyleFacet[];
  availableStyleIds: Set<string>;
  isLoading?: boolean;
  onConfirm?: () => void;
};

export default function StyleFilter({
  selectedIds,
  onSelectionChange,
  facets,
  allStyles,
  availableStyleIds,
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
    // Check if style is available
    if (!availableStyleIds.has(styleId)) {
      toast.error(
        "Questo filtro non può essere attivo con i tuoi filtri attuali"
      );
      return;
    }

    const newSelectedIds = selectedIds.includes(styleId)
      ? selectedIds.filter((id) => id !== styleId)
      : [...selectedIds, styleId];

    onSelectionChange(newSelectedIds);
  };

  const handleStyleInfoPress = async (style: StyleFacet, e: any) => {
    e.stopPropagation();
    // Try to fetch full style data with description
    try {
      const fetchedStyles = await fetchTattooStyles();
      const fullStyle = fetchedStyles.find((s) => s.id === style.id);
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
        ? allStyles.find((s) => s.id === selectedIds[0])?.name ||
          facets.find((s) => s.id === selectedIds[0])?.name ||
          "1 selezionato"
        : `${selectedIds.length} selezionati`;

  // Show all styles, not just available facets
  const stylesToShow = allStyles.length > 0 ? allStyles : facets;

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
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.5}
            pressBehavior="close"
          />
        )}
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
          ) : stylesToShow.length === 0 ? (
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
            stylesToShow.map((style) => {
              const isSelected = selectedIds.includes(style.id);
              const isAvailable = availableStyleIds.has(style.id);
              return (
                <Pressable
                  key={style.id}
                  onPress={() => {
                    if (isAvailable) {
                      toggleStyle(style.id);
                    } else {
                      toast.error(
                        "Questo filtro non può essere attivo con i tuoi filtri attuali"
                      );
                    }
                  }}
                  className="border-b border-gray/20"
                  style={{
                    paddingHorizontal: s(20),
                    paddingVertical: mvs(12),
                    opacity: isAvailable ? 1 : 0.5,
                  }}
                  disabled={!isAvailable}
                >
                  <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                      className="flex-row items-center gap-3 flex-1"
                      onPress={(e) => {
                        if (isAvailable) {
                          handleStyleInfoPress(style, e);
                        } else {
                          e.stopPropagation();
                          toast.error(
                            "Questo filtro non può essere attivo con i tuoi filtri attuali"
                          );
                        }
                      }}
                      activeOpacity={isAvailable ? 0.7 : 1}
                      disabled={!isAvailable}
                    >
                      {style.imageUrl && (
                        <Image
                          source={{ uri: style.imageUrl }}
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
                          className="font-montserratSemibold text-gray"
                        >
                          {style.name}
                        </ScaledText>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (isAvailable) {
                          toggleStyle(style.id);
                        } else {
                          toast.error(
                            "Questo filtro non può essere attivo con i tuoi filtri attuali"
                          );
                        }
                      }}
                      hitSlop={{
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10,
                      }}
                      disabled={!isAvailable}
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