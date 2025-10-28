import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, TouchableOpacity, View } from "react-native";

type Style = {
  id: string;
  name: string;
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
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds);

  useEffect(() => {
    loadStyles();
  }, []);

  useEffect(() => {
    if (isExpanded) {
      setTempSelectedIds(selectedIds);
    }
  }, [isExpanded, selectedIds]);

  const loadStyles = async () => {
    const { data, error } = await supabase
      .from("tattoo_styles")
      .select("id, name")
      .eq("isActive", true)
      .order("name");

    if (error) {
      console.error("Error loading styles:", error);
    } else {
      setStyles(data || []);
    }
  };

  const toggleStyle = (styleId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(styleId)
        ? prev.filter((id) => id !== styleId)
        : [...prev, styleId]
    );
  };

  const handleApply = () => {
    onSelectionChange(tempSelectedIds);
    setIsExpanded(false);
  };

  const handleReset = () => {
    setTempSelectedIds([]);
  };

  const displayText =
    selectedIds.length === 0
      ? "All"
      : selectedIds.length === 1
        ? styles.find((s) => s.id === selectedIds[0])?.name || "1 selected"
        : `${selectedIds.length} selected`;

  return (
    <>
      {/* Collapsed State */}
      <TouchableOpacity
       activeOpacity={1}
        onPress={() => setIsExpanded(true)}
        className="bg-tat-foreground  border-gray rounded-lg flex-row items-center justify-between"
        style={{
          paddingVertical: mvs(12),
          paddingHorizontal: s(16),
          borderWidth: s(1),
        }}
      >
        <ScaledText
          allowScaling={false}
          variant="md"
          className="text-foreground font-montserratSemiBold"
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
            {/* Modal Header */}
            <View
              className="border-b border-gray"
              style={{
                paddingVertical: mvs(16),
                paddingHorizontal: s(20),
              }}
            >
              <View className="flex-row items-center justify-between">
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-foreground font-neueBold"
                >
                  Seleziona stili
                </ScaledText>
                <TouchableOpacity onPress={handleReset}>
                  <ScaledText
                    allowScaling={false}
                    variant="body2"
                    className="text-gray font-neueLight"
                  >
                    Reset
                  </ScaledText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Styles List */}
            <ScrollView
              className="flex-1"
              style={{ paddingTop: mvs(8) }}
              showsVerticalScrollIndicator={false}
            >
              {styles.map((style) => {
                const isSelected = tempSelectedIds.includes(style.id);
                return (
                  <Pressable
                    key={style.id}
                    onPress={() => toggleStyle(style.id)}
                    className="border-b border-gray/20"
                    style={{
                      paddingVertical: mvs(16),
                      paddingHorizontal: s(20),
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <ScaledText
                        allowScaling={false}
                        variant="body2"
                        className="text-foreground font-neueMedium"
                      >
                        {style.name}
                      </ScaledText>
                      <View
                        className={`w-6 h-6 rounded border-2 items-center justify-center ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-gray"
                        }`}
                      >
                        {isSelected && (
                          <SVGIcons.CheckedCheckbox width={s(16)} height={s(16)} />
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Action Buttons */}
            <View
              className="border-t border-gray"
              style={{
                paddingVertical: mvs(16),
                paddingHorizontal: s(20),
              }}
            >
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setIsExpanded(false)}
                  className="flex-1 border border-foreground rounded-full items-center justify-center"
                  style={{ paddingVertical: mvs(12) }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="body2"
                    className="text-foreground font-neueMedium"
                  >
                    Cancel
                  </ScaledText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleApply}
                  className="flex-1 bg-primary rounded-full items-center justify-center"
                  style={{ paddingVertical: mvs(12) }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="body2"
                    className="text-white font-neueMedium"
                  >
                    Apply
                  </ScaledText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

