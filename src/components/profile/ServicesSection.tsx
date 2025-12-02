import ScaledText from "@/components/ui/ScaledText";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { View } from "react-native";

interface Service {
  id: string;
  name: string;
  description?: string | null;
  price?: number;
  duration?: number;
}

interface ServicesSectionProps {
  services: Service[];
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
}) => {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-montserratSemibold"
        style={{ marginBottom: mvs(8) }}
      >
        Servizi
      </ScaledText>
      <View style={{ gap: mvs(8) }}>
        {services.map((service) => (
          <View key={service.id} className="flex-row items-center">
            <ScaledText
              allowScaling={false}
              variant="11"
              className="text-foreground flex-1 font-neueBold"
            >
              ✅ {service.name}
            </ScaledText>
          </View>
        ))}
      </View>
    </View>
  );
};
