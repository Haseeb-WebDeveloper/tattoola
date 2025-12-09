import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

type Style = {
  id: string;
  name: string;
  imageUrl: string | null;
};

type StyleFilterProps = {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
};

export default function StyleFilter({
  selectedIds,
  onSelectionChange,
}: StyleFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [styles, setStyles] = useState<Style[]>([]);

  useEffect(() => {
    loadStyles();
  }, []);

  const loadStyles = async () => {
    const { data, error } = await supabase
      .from("tattoo_styles")
      .select("id, name, imageUrl")
      .eq("isActive", true)
      .order("name");

    if (error) {
      console.error("Error loading styles:", error);
    } else {
      setStyles(data || []);
    }
  };

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
        ? styles.find((s) => s.id === selectedIds[0])?.name || "1 selezionato"
        : `${selectedIds.length} selezionati`;

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
              onPress={() => setIsExpanded(false)}
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
              {styles.map((style) => {
                const isSelected = selectedIds.includes(style.id);
                return (
                  <Pressable
                    key={style.id}
                    onPress={() => toggleStyle(style.id)}
                    className="border-b border-gray/20"
                    style={{
                      paddingVertical: mvs(8),
                      paddingHorizontal: s(20),
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        {style.imageUrl && (
                          <Image
                            source={{ uri: style.imageUrl }}
                            style={{
                              width: s(43),
                              height: s(46),
                              borderRadius: s(8),
                            }}
                            resizeMode="cover"
                          />
                        )}
                        <ScaledText
                          allowScaling={false}
                          variant="md"
                          className="text-gray font-montserratSemibold"
                        >
                          {style.name}
                        </ScaledText>
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
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
