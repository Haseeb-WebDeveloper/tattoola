import AuthStepHeader from "@/components/ui/auth-step-header";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { useUserRegistrationStore } from "@/stores";
import type {
    CompleteUserRegistration,
    FormErrors,
    UserV2Step7,
} from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";

export default function UserRegistrationStep7() {
  const { step6, updateStep, clearRegistration, setCurrentStep } =
    useUserRegistrationStore();

  const { completeUserRegistration, loading } = useAuth();
  const [formData, setFormData] = useState<UserV2Step7>({
    isPublic: true,
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});

  // Load existing data if available
  useEffect(() => {
    if (step6 && Object.keys(step6).length > 0) {
      setFormData(step6 as any as UserV2Step7);
    }
  }, [step6]);

  const handleProfileTypeChange = (isPublic: boolean) => {
    setFormData((prev) => ({ ...prev, isPublic }));
  };

  const validateForm = (): boolean => {
    // No validation needed for this step
    return true;
  };

  const handleComplete = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Store final step data
      updateStep("step7", formData);

      // Build payload from current store steps (step3..step6)
      const { step3, step4, step5, step6 } = useUserRegistrationStore.getState() as any;

      const completeData: CompleteUserRegistration = {
        step3: {
          firstName: step3?.firstName || "",
          lastName: step3?.lastName || "",
          phone: step3?.phone || "",
          avatar: step3?.avatar,
        },
        step4: {
          province: step4?.province || "",
          municipality: step4?.municipality || "",
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
      Alert.alert(
        "Registration Failed",
        error instanceof Error
          ? error.message
          : "An error occurred during registration",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <AuthStepHeader />

      <View className="flex-1">
        {/* Progress */}
        <RegistrationProgress
          currentStep={7}
          totalSteps={7}
          name="Profile Type"
          description="Choose how much of your profile you want to share"
          icon={<SVGIcons.User width={22} height={22} />}
        />

        {/* Options */}
        <View style={{ paddingHorizontal: s(24) }}>
          <TouchableOpacity
            className={`rounded-xl p-5 mb-4 border-2 ${formData.isPublic ? "bg-primary/20 border-primary" : "border-gray"}`}
            onPress={() => handleProfileTypeChange(true)}
            style={{ paddingVertical: mvs(20), paddingHorizontal: s(20) }}
          >
            <View className="flex-row items-start relative">
              <View className="flex-1">
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-foreground font-neueBold mb-2"
                >
                  Public Profile
                </ScaledText>
                <ScaledText
                  allowScaling={false}
                  variant="body2"
                  className="text-foreground/70"
                >
                  Your tattoos and followed artists will be visible on your page
                </ScaledText>
              </View>
              {formData.isPublic && (
                <View
                  className="absolute top-0 right-0 w-6 h-6 rounded-full bg-success items-center justify-center"
                  style={{ width: mvs(24), height: mvs(24) }}
                />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`rounded-xl p-5 mb-4 border-2 ${!formData.isPublic ? "bg-primary/20 border-primary" : "border-gray"}`}
            onPress={() => handleProfileTypeChange(false)}
            style={{ paddingVertical: mvs(20), paddingHorizontal: s(20) }}
          >
            <View className="flex-row items-start relative">
              <View className="flex-1">
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-foreground font-neueBold mb-2"
                >
                  Private Profile
                </ScaledText>
                <ScaledText
                  allowScaling={false}
                  variant="body2"
                  className="text-foreground/70"
                >
                  Your tattoos and followed artists are visible only to you
                </ScaledText>
              </View>
              {!formData.isPublic && (
                <View
                  className="absolute top-0 right-0 w-6 h-6 rounded-full bg-success items-center justify-center"
                  style={{ width: mvs(24), height: mvs(24) }}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Complete Registration Button fixed at the bottom */}
      <View
        className="px-6 bg-background flex justify-center items-center w-full"
        style={{
          paddingVertical: mvs(16),
          paddingHorizontal: s(24),
        }}
      >
        <TouchableOpacity
          onPress={handleComplete}
          disabled={loading}
          className={`rounded-full items-center w-full ${loading ? "bg-gray/40" : "bg-success"}`}
          style={{
            paddingVertical: mvs(14),
          }}
        >
          <ScaledText
            allowScaling={false}
            variant="body1"
            className="text-foreground font-neueBold"
          >
            {loading ? "Completing..." : "Complete Registration"}
          </ScaledText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
