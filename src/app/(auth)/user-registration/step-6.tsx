import AbsoluteNextBackFooter from "@/components/ui/AbsoluteNextBackFooter";
import AuthStepHeader from "@/components/ui/auth-step-header";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { TL_MAX_FAVORITE_STYLES } from "@/constants/limits";
import { SVGIcons } from "@/constants/svg";
import { useUserRegistrationV2Store } from "@/stores/userRegistrationV2Store";
import type { FormErrors, UserV2Step6 } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { ValidationUtils } from "@/utils/validation";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

function StyleSkeleton() {
  return (
    <View className="flex-row items-center border-b border-gray/20">
      <View className="w-10 items-center" style={{ paddingVertical: mvs(12) }}>
        <View className="w-5 h-5 rounded-md bg-gray/30" />
      </View>
      <View className="w-36 h-28 bg-gray/30" />
      <View className="flex-1 px-4">
        <View className="w-32 h-4 bg-gray/30 rounded" />
      </View>
    </View>
  );
}

export default function UserRegistrationStep6() {
  const { step6, updateStep6, setErrors, clearErrors, setCurrentStepDisplay } =
    useUserRegistrationV2Store();
  const insets = useSafeAreaInsets();
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
    updateStep6(formData);
    setCurrentStepDisplay(6);
    router.push("/(auth)/user-registration/step-7");
  };

  const handleBack = () => {
    router.back();
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = formData.favoriteStyles.includes(item.id);
    return (
      <View
        className="flex-row items-center border-b border-gray/20"
        style={{ paddingVertical: mvs(12) }}
      >
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
          <ScaledText
            allowScaling={false}
            variant="body1"
            className="text-foreground font-neueBold"
          >
            {item.name}
          </ScaledText>
        </View>
      </View>
    );
  };

  const canProceed = formData.favoriteStyles.length > 0;

  return (
    <View className="flex-1 bg-black">
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={150}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AuthStepHeader />

        {/* Progress */}
        <RegistrationProgress
          currentStep={3}
          totalSteps={7}
          name="Create your profile"
          icon={<SVGIcons.Person width={25} height={25} />}
        />

        {/* Helper Text */}
        <View style={{ paddingHorizontal: s(24), marginBottom: mvs(16) }}>
          <ScaledText
            allowScaling={false}
            variant="body2"
            className="text-foreground/80"
          >
            Choose up to {TL_MAX_FAVORITE_STYLES} styles you love
          </ScaledText>
        </View>

        {/* List */}
        <View className="flex-1" style={{ paddingHorizontal: s(24) }}>
          {loading ? (
            <ScrollView
              contentContainerStyle={{
                paddingBottom: mvs(100) + Math.max(insets.bottom, mvs(20)),
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <StyleSkeleton key={i} />
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={tattooStyles}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{
                paddingBottom: mvs(100) + Math.max(insets.bottom, mvs(20)),
              }}
            />
          )}
        </View>

        {/* Fixed Footer */}
        <AbsoluteNextBackFooter
          onNext={handleNext}
          nextDisabled={!canProceed}
          nextLabel="Continue"
          backLabel="Back"
          onBack={handleBack}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}
