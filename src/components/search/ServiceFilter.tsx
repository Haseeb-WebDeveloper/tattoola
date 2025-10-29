import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

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

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, category")
      .eq("isActive", true)
      .order("name");

    if (error) {
      console.error("Error loading services:", error);
    } else {
      setServices(data || []);
    }
  };

  const toggleService = (serviceId: string) => {
    const newSelectedIds = selectedIds.includes(serviceId)
      ? selectedIds.filter((id) => id !== serviceId)
      : [...selectedIds, serviceId];

    onSelectionChange(newSelectedIds);
  };

  const displayText =
    selectedIds.length === 0
      ? "All"
      : selectedIds.length === 1
        ? services.find((s) => s.id === selectedIds[0])?.name || "1 selected"
        : `${selectedIds.length} selected`;

  return (
    <>
      {/* Collapsed State */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setIsExpanded(true)}
        className="bg-tat-foreground border-gray flex-row items-center justify-between"
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
              activeOpacity={1}
              onPress={() => setIsExpanded(false)}
              className="bg-background border-gray flex-row items-center justify-between"
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
              <View style={{ transform: [{ rotate: "180deg" }] }}>
                <SVGIcons.ChevronDown width={s(14)} height={s(14)} />
              </View>
            </TouchableOpacity>

            {/* Services List */}
            <ScrollView
              className="flex-1"
              style={{ paddingTop: mvs(16) }}
              contentContainerStyle={{ paddingBottom: mvs(32) }}
              showsVerticalScrollIndicator={false}
            >
              {services.map((service) => {
                const isSelected = selectedIds.includes(service.id);
                return (
                  <Pressable
                    key={service.id}
                    onPress={() => toggleService(service.id)}
                    className="border-b border-gray/20"
                    style={{
                      paddingVertical: mvs(14),
                      paddingHorizontal: s(20),
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <ScaledText
                        allowScaling={false}
                        variant="sm"
                        className="text-gray font-montserratMedium"
                      >
                        {service.name}
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
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
