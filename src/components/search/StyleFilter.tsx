import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import type { StyleFacet } from "@/types/facets";
import { mvs, s } from "@/utils/scale";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

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

  const toggleStyle = (styleId: string) => {
    const newSelectedIds = selectedIds.includes(styleId)
      ? selectedIds.filter((id) => id !== styleId)
      : [...selectedIds, styleId];

    onSelectionChange(newSelectedIds);
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
        onRequestClose={() => setIsExpanded(false)}
      >
        <View className="flex-1 bg-black/50">
          <View
            className="flex-1 bg-background rounded-t-3xl"
            style={{ marginTop: "auto", maxHeight: "80%" }}
          >
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
              className="flex-1"
              style={{ paddingTop: mvs(16) }}
              contentContainerStyle={{ paddingBottom: mvs(32) }}
              showsVerticalScrollIndicator={false}
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
                      }}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                          {facet.imageUrl && (
                            <Image
                              source={{ uri: facet.imageUrl }}
                              style={{
                                width: s(120),
                                height: mvs(72),
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
                        </View>
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
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
