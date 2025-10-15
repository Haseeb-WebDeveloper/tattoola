import React from 'react';
import { Text, View } from 'react-native';
import { SVGIcons } from '@/constants/svg';

interface BodyPart {
  id: string;
  name: string;
}

interface BodyPartsSectionProps {
  bodyParts: BodyPart[];
}

export const BodyPartsSection: React.FC<BodyPartsSectionProps> = ({ bodyParts }) => {
  if (!bodyParts || bodyParts.length === 0) {
    return null;
  }

  return (
    <View className="px-4 mt-8 mb-12">
      <View className="flex-row items-center mb-3 gap-2">
        <SVGIcons.Stop className="w-4 h-4" />
        <Text className="text-foreground font-bold font-montserratSemibold text-[16px] leading-[23px]">
          Parti del corpo su cui non lavoro
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {bodyParts.map((bodyPart) => (
          <View
            key={bodyPart.id}
            className="px-3 py-1 rounded-xl bg-black/40 border border-error"
          >
            <Text className="text-foreground">{bodyPart.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
