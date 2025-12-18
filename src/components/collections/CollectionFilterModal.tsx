import StyleFilter from "@/components/search/StyleFilter";
import ServiceFilter from "@/components/search/ServiceFilter";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import type { StyleFacet, ServiceFacet } from "@/types/facets";
import { mvs, s } from "@/utils/scale";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CollectionFilterModalProps = {
  visible: boolean;
  onClose: () => void;
  styleFacets: StyleFacet[];
  serviceFacets: ServiceFacet[];
  selectedStyleIds: string[];
  selectedServiceIds: string[];
  onChangeSelectedStyleIds: (ids: string[]) => void;
  onChangeSelectedServiceIds: (ids: string[]) => void;
};

export default function CollectionFilterModal({
  visible,
  onClose,
  styleFacets,
  serviceFacets,
  selectedStyleIds,
  selectedServiceIds,
  onChangeSelectedStyleIds,
  onChangeSelectedServiceIds,
}: CollectionFilterModalProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => ["60%"], []);

  // Present / dismiss with `visible`
  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => {
        bottomSheetRef.current?.present();
      });
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleResetStyle = () => {
    onChangeSelectedStyleIds([]);
  };

  const handleResetService = () => {
    onChangeSelectedServiceIds([]);
  };

  const handleApply = () => {
    bottomSheetRef.current?.dismiss();
  };

  const hasActiveFilters =
    selectedStyleIds.length > 0 || selectedServiceIds.length > 0;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDismissOnClose
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: "#100C0C",
        borderTopWidth: s(1),
        borderLeftWidth: s(1),
        borderRightWidth: s(1),
        borderColor: "#908D8F",
        borderTopLeftRadius: s(24),
        borderTopRightRadius: s(24),
      }}
      handleIndicatorStyle={{
        backgroundColor: "#908D8F",
        width: s(30),
        height: mvs(4),
      }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: s(20),
          paddingBottom: Math.max(insets.bottom, mvs(24)) + mvs(12),
          paddingTop: mvs(10),
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Style Filter Section - matching search filter visuals */}
        <View style={{ marginBottom: mvs(18) }}>
          <View
            className="flex-row items-center justify-between"
            style={{ marginBottom: mvs(10) }}
          >
            <View className="flex-row items-center gap-2">
              <SVGIcons.EditBrush width={s(14)} height={s(14)} />
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-montserratSemibold"
              >
                Filtra per stile
              </ScaledText>
            </View>
            <TouchableOpacity onPress={handleResetStyle}>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-gray font-neueLight"
              >
                Reimposta
              </ScaledText>
            </TouchableOpacity>
          </View>
          <StyleFilter
            selectedIds={selectedStyleIds}
            onSelectionChange={onChangeSelectedStyleIds}
            facets={styleFacets}
          />
        </View>

        {/* Service Filter Section */}
        <View style={{ marginBottom: mvs(18) }}>
          <View
            className="flex-row items-center justify-between"
            style={{ marginBottom: mvs(10) }}
          >
            <View className="flex-row items-center gap-2">
              <SVGIcons.MagicStick width={s(14)} height={s(14)} />
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-montserratSemibold"
              >
                Filtra per servizio
              </ScaledText>
            </View>
            <TouchableOpacity onPress={handleResetService}>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-gray font-neueLight"
              >
                Reimposta
              </ScaledText>
            </TouchableOpacity>
          </View>
          <ServiceFilter
            selectedIds={selectedServiceIds}
            onSelectionChange={onChangeSelectedServiceIds}
            facets={serviceFacets}
          />
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-4" style={{ marginTop: mvs(12) }}>
          <TouchableOpacity
            onPress={() => {
              handleResetStyle();
              handleResetService();
            }}
            className="items-center justify-center flex-1 border rounded-full border-gray"
            style={{ paddingVertical: mvs(12) }}
          >
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-neueSemibold"
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
              className="text-white font-neueSemibold"
            >
              Applica filtri
            </ScaledText>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}


