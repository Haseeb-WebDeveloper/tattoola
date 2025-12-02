import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface StudioFAQsProps {
  faqs: FAQ[];
}

export const StudioFAQs: React.FC<StudioFAQsProps> = ({ faqs }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!faqs || faqs.length === 0) {
    return null;
  }

  const toggleFAQ = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <View style={{ paddingHorizontal: s(16), marginTop: mvs(24) }}>
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-foreground font-montserratSemibold"
        style={{ marginBottom: mvs(12) }}
      >
        Domande frequenti
      </ScaledText>

      <View style={{ gap: mvs(12) }}>
        {faqs.map((faq) => {
          const isExpanded = expandedIds.has(faq.id);

          return (
            <View key={faq.id}>
              <TouchableOpacity
                onPress={() => toggleFAQ(faq.id)}
                className="flex-row items-center justify-between border-gray"
                style={{
                  paddingVertical: mvs(12),
                  paddingHorizontal: s(16),
                  borderRadius: s(8),
                  borderWidth: s(0.5),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="flex-1 text-foreground font-montserratSemibold"
                >
                  {faq.question}
                </ScaledText>

                <View
                  style={{
                    transform: [{ rotate: isExpanded ? "270deg" : "180deg" }],
                    marginLeft: s(8),
                  }}
                >
                  <SVGIcons.ChevronLeft
                    style={{ width: s(11), height: s(11) }}
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View
                  className="border-gray"
                  style={{
                    paddingVertical: mvs(12),
                    paddingHorizontal: s(16),
                    borderRadius: s(8),
                    borderWidth: s(0.5),
                    marginTop: mvs(6),
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="text-foreground font-neueLight"
                  >
                    {faq.answer}
                  </ScaledText>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};
