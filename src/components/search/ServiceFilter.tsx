import ServiceInfoModal from "@/components/shared/ServiceInfoModal";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { fetchServices } from "@/services/services.service";
import type { ServiceFacet } from "@/types/facets";
import { mvs, s } from "@/utils/scale";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ServiceFilterProps = {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  facets: ServiceFacet[];
  isLoading?: boolean;
  onConfirm?: () => void;
};

export default function ServiceFilter({
  selectedIds,
  onSelectionChange,
  facets,
  isLoading = false,
  onConfirm,
}: ServiceFilterProps) {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [showServiceInfoModal, setShowServiceInfoModal] = useState(false);
  const [selectedServiceInfo, setSelectedServiceInfo] = useState<{
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    category?: string | null;
  } | null>(null);

  const toggleService = (serviceId: string) => {
    const newSelectedIds = selectedIds.includes(serviceId)
      ? selectedIds.filter((id) => id !== serviceId)
      : [...selectedIds, serviceId];

    onSelectionChange(newSelectedIds);
  };

  const handleServiceInfoPress = async (service: ServiceFacet, e: any) => {
    e.stopPropagation();
    // Try to fetch full service data with description
    try {
      const allServices = await fetchServices();
      const fullService = allServices.find((s) => s.id === service.id);
      if (fullService) {
        setSelectedServiceInfo(fullService);
      } else {
        // Fallback to the service data we have
        setSelectedServiceInfo({
          id: service.id,
          name: service.name,
          description: null,
          imageUrl: null,
          category: service.category,
        });
      }
    } catch (error) {
      // Fallback to the service data we have
      setSelectedServiceInfo({
        id: service.id,
        name: service.name,
        description: null,
        imageUrl: null,
        category: service.category,
      });
    }
    setShowServiceInfoModal(true);
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
        topInset={insets.top + mvs(8)}
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

        {/* Services List */}
        <BottomSheetScrollView
          className="flex-1"
          style={{ paddingTop: mvs(16) }}
          contentContainerStyle={{
            paddingBottom:
              insets.bottom + (sheetIndex === 0 ? mvs(160) : mvs(32)),
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
                Nessun servizio disponibile
              </ScaledText>
            </View>
          ) : (
            availableFacets.map((facet) => {
              const isSelected = selectedIds.includes(facet.id);
              return (
                <Pressable
                  key={facet.id}
                  onPress={() => toggleService(facet.id)}
                  className="border-b border-gray/20"
                  style={{
                    paddingVertical: mvs(14),
                    paddingHorizontal: s(20),
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                      className="flex-1"
                      onPress={(e) => handleServiceInfoPress(facet, e)}
                      activeOpacity={0.7}
                    >
                      <ScaledText
                        allowScaling={false}
                        variant="sm"
                        className="text-gray font-montserratMedium"
                      >
                        {facet.name}
                      </ScaledText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => toggleService(facet.id)}
                      hitSlop={{
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10,
                      }}
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
      <ServiceInfoModal
        visible={showServiceInfoModal}
        service={selectedServiceInfo}
        onClose={() => {
          setShowServiceInfoModal(false);
          setSelectedServiceInfo(null);
        }}
      />
    </>
  );
}
