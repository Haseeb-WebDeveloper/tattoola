import AuthStepHeader from "@/components/ui/auth-step-header";
import FixedFooter from "@/components/ui/FixedFooter";
import { TL_MAX_FAVORITE_STYLES } from "@/constants/limits";
import { SVGIcons } from "@/constants/svg";
import { useUserRegistrationStore } from "@/stores";
import type { FormErrors, UserV2Step6 } from "@/types/auth";
import { supabase } from "@/utils/supabase";
import { ValidationUtils } from "@/utils/validation";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserRegistrationStep6() {
  const { step6, updateStep, setErrors, clearErrors, setCurrentStep } =
    useUserRegistrationStore();
  const [formData, setFormData] = useState<UserV2Step6>({
    favoriteStyles: [],
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});
  const [tattooStyles, setTattooStyles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load existing data if available
  useEffect(() => {
    if (step6 && Object.keys(step6).length > 0) {
      setFormData(step6 as any as UserV2Step6);
    }
  }, [step6]);

  // Load tattoo styles on mount
  useEffect(() => {
    loadTattooStyles();
  }, []);

  const loadTattooStyles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tattoo_styles")
        .select("id, name, description, imageUrl")
        .eq("isActive", true)
        .order("name");

      if (error) {
        // Fallback to mock data
        const mockStyles = [
          {
            id: "1",
            name: "3D",
            description: "Three-dimensional tattoos",
            imageUrl: null,
          },
          {
            id: "2",
            name: "Abstract",
            description: "Non-representational designs",
            imageUrl: null,
          },
          {
            id: "3",
            name: "Anime",
            description: "Japanese animation style",
            imageUrl: null,
          },
          {
            id: "4",
            name: "Black & Grey",
            description: "Monochrome shading",
            imageUrl: null,
          },
        ];
        setTattooStyles(mockStyles);
      } else {
        setTattooStyles(data || []);
      }
    } catch (error) {
      console.error("Error loading tattoo styles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStyleToggle = (styleId: string) => {
    setFormData((prev) => {
      const isSelected = prev.favoriteStyles.includes(styleId);
      let newStyles;

      if (isSelected) {
        // Remove style
        newStyles = prev.favoriteStyles.filter((id) => id !== styleId);
      } else {
        // Add style (check limit)
        if (prev.favoriteStyles.length >= TL_MAX_FAVORITE_STYLES) {
          return prev;
        }
        newStyles = [...prev.favoriteStyles, styleId];
      }

      return { ...prev, favoriteStyles: newStyles };
    });
  };

  const validateForm = (): boolean => {
    const formErrors: FormErrors = {};

    if (formData.favoriteStyles.length === 0) {
      formErrors.favoriteStyles = "Please select at least one favorite style";
    }

    setLocalErrors(formErrors);
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    // Store data in registration context
    updateStep("step6", formData);
    setCurrentStep(8);
    router.push("/(auth)/user-registration/step-7");
  };

  const handleBack = () => {
    router.back();
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = formData.favoriteStyles.includes(item.id);
    return (
      <View className="flex-row items-center px-4 border-b border-gray/20">
        <TouchableOpacity
          className="w-10 items-center"
          onPress={() => handleStyleToggle(item.id)}
        >
          {isSelected ? (
            <SVGIcons.CheckedCheckbox className="w-5 h-5" />
          ) : (
            <SVGIcons.UncheckedCheckbox className="w-5 h-5" />
          )}
        </TouchableOpacity>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            className="w-36 h-28"
            resizeMode="cover"
          />
        ) : (
          <View className="w-36 h-28 bg-gray/30" />
        )}
        <View className="flex-1 px-4">
          <Text className="text-foreground tat-body-1 font-neueBold">
            {item.name}
          </Text>
          {/* {!!item.description && (
            <Text className="text-white/60 mt-1" numberOfLines={2}>
              {item.description}
            </Text>
          )} */}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <AuthStepHeader />

      {/* Progress */}
      <View className="items-center mb-4 mt-8">
        <View className="flex-row items-center gap-1">
          {Array.from({ length: 8 }).map((_, idx) => (
            <View
              key={idx}
              className={`${idx < 7 ? (idx === 6 ? "bg-foreground w-4 h-4" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
            />
          ))}
        </View>
      </View>

      {/* Title */}
      <View className="px-6 mb-6 ">
        <Text className="text-center text-foreground section-title font-neueBold">
          Favorite Styles
        </Text>
      </View>

      {/* List */}
      <View className="flex-1 mb-24">
        <Text className="mb-4 px-4 text-tat ta-body-3-button-text mt-1">
          Choose up to {TL_MAX_FAVORITE_STYLES} styles you love
        </Text>
        {loading ? (
          <View className="px-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                className="flex-row items-center justify-between border-b border-gray/20 px-4"
              >
                <View className="w-6 h-6 rounded-md bg-gray/30 mr-3" />
                <View className="w-36 h-28 bg-gray/30" />
                <View className="flex-1 px-4">
                  <View className="w-32 h-4 bg-gray/30 rounded" />
                </View>
                {/* <View className="w-6 h-6 rounded-full bg-gray/30" /> */}
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={tattooStyles}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={true}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        )}
      </View>

      {/* Fixed Footer */}
      <FixedFooter
        onBack={handleBack}
        onNext={handleNext}
        nextDisabled={formData.favoriteStyles.length === 0}
        nextLabel="Continue"
      />
    </View>
  );
}
