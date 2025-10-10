import { SVGIcons } from '@/constants/svg';
import React from 'react';
import { Text, View } from 'react-native';

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

export const ServicesSection: React.FC<ServicesSectionProps> = ({ services }) => {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <View className="px-4 mt-6">
      <Text className="text-foreground font-bold font-montserratSemibold mb-3 text-[16px] leading-[23px]">
        Services
      </Text>
      <View className="gap-2">
        {services.map((service) => (
          <View
            key={service.id}
            className="flex-row items-center"
          >
            {/* <SVGIcons.CheckedCheckbox className="w-5 h-5 mr-3 text-green-500" /> */}
            <Text className="text-foreground flex-1 tat-body-4 font-semibold">✅ {service.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
