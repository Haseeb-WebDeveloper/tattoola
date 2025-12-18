import ServiceInfoModal from "@/components/shared/ServiceInfoModal";
import ScaledText from "@/components/ui/ScaledText";
import { mvs, s } from "@/utils/scale";
import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";

type ServiceSummary = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  // Optional category to stay compatible with services that include it
  category?: string | null;
};

interface ServicesSectionProps {
  services: ServiceSummary[];
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
}) => {
  const [selectedServiceInfo, setSelectedServiceInfo] =
    useState<ServiceSummary | null>(null);
  const [showServiceInfoModal, setShowServiceInfoModal] = useState(false);

  if (!services || services.length === 0) {
    return null;
  }

  return (
    <>
      <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
        <ScaledText
          allowScaling={false}
          variant="lg"
          className="text-foreground font-montserratSemibold"
          style={{ marginBottom: mvs(8) }}
        >
          Servizi
        </ScaledText>
        <View style={{ gap: mvs(8) }}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              className="flex-row items-center"
              onPress={() => {
                setSelectedServiceInfo(service);
                setShowServiceInfoModal(true);
              }}
              activeOpacity={0.7}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="flex-1 text-foreground font-neueMedium"
              >
                ✅ {service.name}
              </ScaledText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
};
