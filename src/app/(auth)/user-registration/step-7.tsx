import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { useUserRegistrationV2Store } from "@/stores/userRegistrationV2Store";
import type { CompleteUserRegistration, UserV2Step7 } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

// Circle checkboxes for profile type selection
const CircleUncheckedCheckbox = SVGIcons.CircleUncheckedCheckbox;
const CircleCheckedCheckbox = SVGIcons.CircleCheckedCheckbox;

export default function UserRegistrationStep7() {
  const { step7, updateStep, clearRegistration } = useUserRegistrationV2Store();

  const { completeUserRegistration, loading } = useAuth();
  const [formData, setFormData] = useState<UserV2Step7>({
    isPublic: true,
  });
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [initialValue, setInitialValue] = useState(true);

  // Load existing data if available
  useEffect(() => {
    if (step7 && Object.keys(step7).length > 0) {
      const isPublic = (step7 as any).isPublic ?? true;
      setFormData({ isPublic });
      setInitialValue(isPublic);
    }
  }, [step7]);

  const hasUnsavedChanges = formData.isPublic !== initialValue;

  const handleProfileTypeChange = (isPublic: boolean) => {
    setFormData((prev) => ({ ...prev, isPublic }));
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      router.back();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedModal(false);
    router.back();
  };

  const handleContinueEditing = () => {
    setShowUnsavedModal(false);
  };

  const handleComplete = async () => {
    try {
      // Store final step data
      updateStep("step7", formData);

      // Build payload from current store steps (step3..step6)
      const { step3, step4, step5, step6 } =
        useUserRegistrationV2Store.getState() as any;

      const completeData: CompleteUserRegistration = {
        step3: {
          firstName: step3?.firstName || "",
          lastName: step3?.lastName || "",
          phone: step3?.phone || "",
          countryCode: step3?.countryCode,
          callingCode: step3?.callingCode,
          province: step3?.province || "",
          provinceId: step3?.provinceId || "",
          municipality: step3?.municipality || "",
          municipalityId: step3?.municipalityId || "",
        },
        step4: {
          avatar: step4?.avatar,
        },
        step5: {
          instagram: step5?.instagram,
          tiktok: step5?.tiktok,
        },
        step6: {
          favoriteStyles: Array.isArray(step6?.favoriteStyles)
            ? step6.favoriteStyles
            : [],
        },
        step7: {
          isPublic: !!(formData as any)?.isPublic,
        },
      };

      await completeUserRegistration(completeData);

      // Clear registration data
      clearRegistration();

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred during registration"
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: mvs(32) }}
        >
          {/* Header */}
          <AuthStepHeader />

          {/* Progress */}
          <RegistrationProgress
            currentStep={7}
            totalSteps={7}
            name="Visibilità del profilo"
            icon={<SVGIcons.SecurePerson width={20} height={20} />}
            nameVariant="2xl"
          />

          {/* Options */}
          <View style={{ paddingHorizontal: s(32) }}>
            {/* Public Profile Option */}
            <TouchableOpacity
              onPress={() => handleProfileTypeChange(true)}
              activeOpacity={0.7}
              className="border-gray"
              style={{
                borderWidth: formData.isPublic ? s(1) : s(0.5),
                backgroundColor: "#100C0C",
                paddingHorizontal: s(11),
                paddingVertical: mvs(20),
                marginBottom: mvs(16),
                borderRadius: s(12),
              }}
            >
              <View className="flex-row items-start">
                {/* Use checked/unchecked circle */}
                <View
                  className="items-center justify-center"
                  style={{
                    width: s(17),
                    height: s(17),
                    marginRight: s(9),
                  }}
                >
                  {formData.isPublic ? (
                    <CircleCheckedCheckbox width={s(17)} height={s(17)} />
                  ) : (
                    <CircleUncheckedCheckbox width={s(17)} height={s(17)} />
                  )}
                </View>

                {/* Text Content */}
                <View className="flex-1">
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-montserratSemibold"
                    style={{ marginBottom: mvs(4) }}
                  >
                    Profilo pubblico
                  </ScaledText>
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="text-foreground font-neueRoman"
                  >
                    I tuoi tatuaggi, l'artista che segui sarà visibile sulla tua pagina
                  </ScaledText>
                </View>
              </View>
            </TouchableOpacity>

            {/* Private Profile Option */}
            <TouchableOpacity
              onPress={() => handleProfileTypeChange(false)}
              activeOpacity={0.7}
              className="border-gray"
              style={{
                borderWidth: !formData.isPublic ? s(1) : s(0.5),
                backgroundColor: "#100C0C",
                paddingHorizontal: s(11),
                paddingVertical: mvs(20),
                marginBottom: mvs(24),
                borderRadius: s(12),
              }}
            >
              <View className="flex-row items-start">
                {/* Use checked/unchecked circle */}
                <View
                  className="items-center justify-center"
                  style={{
                    width: s(17),
                    height: s(17),
                    marginRight: s(9),
                  }}
                >
                  {!formData.isPublic ? (
                    <CircleCheckedCheckbox width={s(17)} height={s(17)} />
                  ) : (
                    <CircleUncheckedCheckbox width={s(17)} height={s(17)} />
                  )}
                </View>

                {/* Text Content */}
                <View className="flex-1">
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-montserratSemibold"
                    style={{ marginBottom: mvs(4) }}
                  >
                    Private profile
                  </ScaledText>
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="text-foreground font-neueRoman"
                  >
                    I tuoi tatuaggi e gli artisti che segui sono visibili solo a
                    te
                  </ScaledText>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Complete Registration Button fixed at the bottom */}
        <NextBackFooter
          onNext={handleComplete}
          nextDisabled={loading}
          nextLabel="Quasi pronto!"
          backLabel="Indietro"
          onBack={handleBack}
        />
      </LinearGradient>

      {/* Unsaved Changes Modal */}
      <Modal
        visible={showUnsavedModal}
        transparent
        animationType="fade"
        onRequestClose={handleContinueEditing}
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
            <View className="items-center" style={{ marginBottom: mvs(20) }}>
              <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
            </View>

            {/* Title */}
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-background font-neueBold text-center"
              style={{ marginBottom: mvs(4) }}
            >
              Hai modifiche non salvate nella visibilità del profilo
            </ScaledText>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-background font-montserratMedium text-center"
              style={{ marginBottom: mvs(32) }}
            >
              Do you want to discard them?
            </ScaledText>

            {/* Action Buttons */}
            <View style={{ gap: mvs(4) }} className="flex-row justify-center">
              {/* Continue Editing Button */}
              <TouchableOpacity
                onPress={handleContinueEditing}
                className="rounded-full border-2 items-center justify-center flex-row"
                style={{
                  borderColor: "#AD2E2E",
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                  gap: s(8),
                }}
              >
                <SVGIcons.PenRed
                  style={{ width: s(14), height: s(14) }}
                  fill="#AD2E2E"
                />
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="font-montserratMedium"
                  style={{ color: "#AD2E2E" }}
                >
                  Continue Editing
                </ScaledText>
              </TouchableOpacity>

              {/* Discard Changes Button */}
              <TouchableOpacity
                onPress={handleDiscardChanges}
                className="rounded-full items-center justify-center"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-gray font-montserratMedium"
                >
                  Discard changes
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
