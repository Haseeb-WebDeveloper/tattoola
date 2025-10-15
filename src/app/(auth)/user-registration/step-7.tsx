import AuthStepHeader from "@/components/ui/auth-step-header";
import { useAuth } from "@/providers/AuthProvider";
import { useUserRegistrationStore } from "@/stores";
import type {
  CompleteUserRegistration,
  FormErrors,
  UserV2Step7,
} from "@/types/auth";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

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

      console.log("step3", step3);
      console.log("step4", step4);
      console.log("step5", step5);
      console.log("step6", step6);
      console.log("formData", formData);

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

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-background px-4">
      {/* Header */}
      <AuthStepHeader />

      <View>
        {/* Progress */}
        <View className="items-center mb-4 mt-8">
          <View className="flex-row items-center">
            {Array.from({ length: 8 }).map((_, idx) => (
              <View
                key={idx}
                className={`
                  ${
                    idx < 8
                      ? idx === 7
                        ? "bg-white w-4 h-4"
                        : "bg-success w-2 h-2"
                      : "bg-gray w-2 h-2"
                  }
                  rounded-full mr-1
                `}
              />
            ))}
          </View>
        </View>

        {/* Title */}
        <View className="flex-col items-center mb-6">
          <Text className="text-center text-foreground section-title font-neueBold">
            Profile Type
          </Text>
          <Text className="text-tat ta-body-3-button-text mt-1">
            Choose how much of your profile you want to share
          </Text>
        </View>

        {/* Options */}
        <View>
          <TouchableOpacity
            className={`
              rounded-xl p-5 mb-4 border-2 border-gray
              ${formData.isPublic ? "bg-tat-darkMaroon border-tat-darkMaroon" : ""}
            `}
            onPress={() => handleProfileTypeChange(true)}
          >
            <View className="flex-row items-start relative">
              <View className="flex-1">
                <Text className="text-lg font-semibold mb-2 text-foreground">
                  Public Profile
                </Text>
                <Text className="text-sm leading-5 text-tat">
                  Your tattoos and followed artists will be visible on your page
                </Text>
              </View>
              {formData.isPublic && (
                <View className="absolute top-0 right-0 w-6 h-6 rounded-full bg-success items-center justify-center" />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`
              rounded-xl p-5 mb-4 border-2 border-gray
              ${!formData.isPublic ? "bg-tat-darkMaroon border-tat-darkMaroon" : ""}
            `}
            onPress={() => handleProfileTypeChange(false)}
          >
            <View className="flex-row items-start relative">
              <View className="flex-1">
                <Text className="text-lg font-semibold mb-2 text-foreground">
                  Private Profile
                </Text>
                <Text className="text-sm leading-5 text-tat">
                  Your tattoos and followed artists are visible only to you
                </Text>
              </View>
              {!formData.isPublic && (
                <View className="absolute top-0 right-0 w-6 h-6 rounded-full bg-success items-center justify-center" />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Complete Registration Button fixed at the bottom */}
      <View className="absolute left-0 right-0 bottom-0 px-4 pb-6 bg-background flex justify-center items-center w-full">
        <TouchableOpacity
          onPress={handleComplete}
          className="bg-success rounded-full py-3.5 items-center w-full max-w-[440px] mx-auto"
        >
          <Text className="text-white font-bold">
            {loading ? "Completing..." : "Complete Registration"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
