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
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function StyleSkeleton() {
  return (
    <View className="flex-row items-center">
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: mvs(6),
          paddingRight: s(16),
        }}
      >
        <SVGIcons.UncheckedCheckbox width={s(20)} height={s(20)} />
      </View>
      <View className="border-b border-gray/20 flex-row items-center justify-center">
        <View
          style={{
            width: s(120),
            height: mvs(72),
            backgroundColor: "#A49A9950",
          }}
        />
        <View className="flex-1  " style={{ paddingLeft: s(16) }}>
          <ScaledText
            allowScaling={false}
            style={{ fontSize: 12.445 }}
            className="text-foreground font-montserratSemibold"
          >
            ...
          </ScaledText>
        </View>
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
  const [showLimitModal, setShowLimitModal] = useState(false);

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
          setShowLimitModal(true);
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
      formErrors.favoriteStyles = "Seleziona almeno uno stile preferito";
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
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleStyleToggle(item.id)}
        className="flex-row items-center"
      >
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: mvs(6),
            paddingRight: s(16),
          }}
        >
          {isSelected ? (
            <SVGIcons.CheckedCheckbox width={s(20)} height={s(20)} />
          ) : (
            <SVGIcons.UncheckedCheckbox width={s(20)} height={s(20)} />
          )}
        </View>
        <View className="border-b border-gray/20 flex-row items-center justify-center">
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: s(120), height: mvs(72) }}
              resizeMode="cover"
              className=" border-b border-gray/20"
            />
          ) : (
            <View
              style={{
                width: s(155),
                height: mvs(72),
                backgroundColor: "#A49A9950",
              }}
            />
          )}
          <View className="flex-1" style={{ paddingLeft: s(16) }}>
            <ScaledText
              allowScaling={false}
              style={{ fontSize: 12.445 }}
              className="text-foreground font-montserratSemibold"
            >
              {item.name}
            </ScaledText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const canProceed = formData.favoriteStyles.length > 0;

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <AuthStepHeader />

      {/* Progress */}
        <RegistrationProgress
          currentStep={3}
          totalSteps={7}
          name="I tuoi stili preferiti"
          nameVariant="2xl"
          icon={<SVGIcons.Style width={20} height={20} />}
          description={`Puoi scegliere fino a ${TL_MAX_FAVORITE_STYLES} stili preferiti.`}
          descriptionVariant="md"
        />

      {/* List */}
      <View
        className="flex-1"
        style={{ paddingHorizontal: s(16), flexGrow: 1 }}
      >
        {loading ? (
          <View>
            {[...Array(6)].map((_, i) => (
              <StyleSkeleton key={i} />
            ))}
          </View>
        ) : (
          <FlatList
            data={tattooStyles}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{
              paddingBottom: mvs(47) + Math.max(insets.bottom, mvs(20)),
            }}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>

      {/* Fixed Footer */}
      <AbsoluteNextBackFooter
        onNext={handleNext}
        nextDisabled={!canProceed}
        nextLabel="Avanti"
        backLabel="Indietro"
        onBack={handleBack}
      />

      {/* Limit Exceeded Modal */}
      <Modal
        visible={showLimitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLimitModal(false)}
      >
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <View
            className="bg-[#fff] rounded-xl"
            style={{
              width: s(342),
              paddingHorizontal: s(24),
              paddingVertical: mvs(32),
            }}
          >
            {/* Warning Icon */}
            <View className="items-center" style={{ marginBottom: mvs(16) }}>
              <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
            </View>

            {/* Title */}
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-background font-neueBold text-center"
              style={{ marginBottom: mvs(4) }}
            >
              Limite Stili Raggiunto
            </ScaledText>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-background font-montserratMedium text-center"
              style={{ marginBottom: mvs(16) }}
            >
              Puoi selezionare solo {TL_MAX_FAVORITE_STYLES} stili.
            </ScaledText>

            {/* Action Button */}
            <View className="flex-row justify-center">
              <TouchableOpacity
                onPress={() => setShowLimitModal(false)}
                className="rounded-full items-center justify-center"
                style={{
                  backgroundColor: "#AD2E2E",
                  paddingVertical: mvs(8),
                  paddingLeft: s(32),
                  paddingRight: s(32),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-white font-neueSemibold"
                >
                  OK
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
