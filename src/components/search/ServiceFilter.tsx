import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, TouchableOpacity, View } from "react-native";

type Service = {
  id: string;
  name: string;
  category: string;
};

type ServiceFilterProps = {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
};

export default function ServiceFilter({
  selectedIds,
  onSelectionChange,
}: ServiceFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (isExpanded) {
      setTempSelectedIds(selectedIds);
    }
  }, [isExpanded, selectedIds]);

  const loadServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, category")
      .eq("isActive", true)
      .order("category")
      .order("name");

    if (error) {
      console.error("Error loading services:", error);
    } else {
      setServices(data || []);
    }
  };

  const toggleService = (serviceId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
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
        ? services.find((s) => s.id === selectedIds[0])?.name || "1 selected"
        : `${selectedIds.length} selected`;

  // Group services by category
  const servicesByCategory = services.reduce(
    (acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    },
    {} as Record<string, Service[]>
  );

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
                  Seleziona servizi
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

            {/* Services List by Category */}
            <ScrollView
              className="flex-1"
              style={{ paddingTop: mvs(8) }}
              showsVerticalScrollIndicator={false}
            >
              {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                <View key={category} style={{ marginBottom: mvs(16) }}>
                  <ScaledText
                    allowScaling={false}
                    variant="body2"
                    className="text-gray font-neueBold"
                    style={{
                      paddingHorizontal: s(20),
                      paddingVertical: mvs(8),
                    }}
                  >
                    {category}
                  </ScaledText>
                  {categoryServices.map((service) => {
                    const isSelected = tempSelectedIds.includes(service.id);
                    return (
                      <Pressable
                        key={service.id}
                        onPress={() => toggleService(service.id)}
                        className="border-b border-gray/20"
                        style={{
                          paddingVertical: mvs(12),
                          paddingHorizontal: s(20),
                        }}
                      >
                        <View className="flex-row items-center justify-between">
                          <ScaledText
                            allowScaling={false}
                            variant="body2"
                            className="text-foreground font-neueMedium"
                          >
                            {service.name}
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
                </View>
              ))}
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

