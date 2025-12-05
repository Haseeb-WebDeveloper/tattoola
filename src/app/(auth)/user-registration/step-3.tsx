import LocationPicker from "@/components/shared/LocationPicker";
import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useUserRegistrationV2Store } from "@/stores/userRegistrationV2Store";
import type { FormErrors, UserV2Step3 } from "@/types/auth";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { UserStep3ValidationSchema, ValidationUtils } from "@/utils/validation";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, TouchableOpacity, View } from "react-native";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function formatPhoneForInput(phone: string, callingCode: string): string {
  // Show only the user part (remove country code prefix)
  const regex = new RegExp(`^\\+?${callingCode}\\s?`);
  return phone.replace(regex, "");
}

export default function UserRegistrationStep3() {
  const insets = useSafeAreaInsets();
  const { step3, updateStep3, setErrors, clearErrors, setCurrentStepDisplay } =
    useUserRegistrationV2Store();

  const [formData, setFormData] = useState<UserV2Step3>({
    firstName: "",
    lastName: "",
    phone: "",
    countryCode: "IT",
    callingCode: "39",
    province: "",
    provinceId: "",
    municipality: "",
    municipalityId: "",
  });
  const [errors, setLocalErrors] = useState<FormErrors>({});
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [modalStep, setModalStep] = useState<
    null | "province" | "municipality"
  >(null);
  const [provinces, setProvinces] = useState<
    { id: string; name: string; imageUrl?: string | null }[]
  >([]);
  const [municipalities, setMunicipalities] = useState<
    { id: string; name: string; imageUrl?: string | null }[]
  >([]);
  const [search, setSearch] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<{
    id: string;
    name: string;
    imageUrl?: string | null;
  } | null>(null);

  // Load existing data if available
  useEffect(() => {
    if (step3 && Object.keys(step3).length > 0) {
      setFormData({
        firstName: step3.firstName || "",
        lastName: step3.lastName || "",
        phone: step3.phone || "",
        countryCode: step3.countryCode || "IT",
        callingCode: step3.callingCode || "39",
        province: step3.province || "",
        provinceId: step3.provinceId || "",
        municipality: step3.municipality || "",
        municipalityId: step3.municipalityId || "",
      });
    }
  }, [step3]);

  // Load provinces on mount (for modal selections)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("provinces")
        .select("id, name, imageUrl")
        .eq("isActive", true)
        .order("name");
      if (error) {
        setProvinces([]);
      } else {
        setProvinces(data || []);
      }
    })();
  }, []);

  // Load municipalities when a province is selected in modal
  useEffect(() => {
    (async () => {
      if (
        modalStep === "municipality" &&
        (selectedProvince || formData.province)
      ) {
        const provinceId =
          selectedProvince?.id ||
          provinces.find((p) => p.name === formData.province)?.id;
        const { data, error } = await supabase
          .from("municipalities")
          .select("id, name, imageUrl")
          .eq("provinceId", provinceId)
          .eq("isActive", true)
          .order("name");
        if (error) {
          const mocks = [
            { id: "1", name: "Aragona" },
            { id: "2", name: "Agrigento" },
            { id: "3", name: "Palermo" },
            { id: "4", name: "Catania" },
          ];
          setMunicipalities(mocks);
        } else {
          setMunicipalities(data || []);
        }
      }
    })();
  }, [modalStep, selectedProvince, formData.province]);

  const handleInputChange = (field: keyof UserV2Step3, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setLocalErrors((prev) => ({ ...prev, [field]: "" }));
      clearErrors();
    }
  };

  const handleCountrySelect = (country: Country) => {
    const callingCode = country.callingCode[0] || "39";
    setFormData((prev) => ({
      ...prev,
      countryCode: country.cca2,
      callingCode: callingCode,
      // Clear phone number when country changes
      phone: "",
    }));
    setCountryPickerVisible(false);
  };

  const handleMunicipalitySelect = (municipality: any) => {
    setFormData((prev) => ({
      ...prev,
      municipality: municipality.name,
      municipalityId: municipality.id,
      province: selectedProvince?.name || formData.province,
      provinceId:
        selectedProvince?.id ||
        provinces.find((p) => p.name === formData.province)?.id ||
        "",
    }));
    setModalStep(null);
    setSearch("");
  };

  const onChange = (
    province: string,
    municipality: string,
    provinceId: string,
    municipalityId: string
  ) => {
    setFormData({
      ...formData,
      province,
      municipality,
      provinceId,
      municipalityId,
    });
    clearErrors();
  };

  const validateForm = (): boolean => {
    // Validate phone number using actual country code
    const phoneNumber = formData.phone || "";
    const phoneDigits = phoneNumber.replace(/[^0-9]/g, "");
    const countryCodeLength = (formData.callingCode || "39").length;
    const phoneNumberLength = phoneDigits.length - countryCodeLength;
    const isPhoneValid = phoneNumberLength >= 10 && phoneNumberLength <= 15;

    const formErrors = ValidationUtils.validateForm(
      formData,
      UserStep3ValidationSchema
    );

    // Override phone error if validation fails with actual country code
    if (!isPhoneValid && phoneNumber) {
      formErrors.phone = "Please enter a valid phone number";
    }

    setLocalErrors(formErrors);
    setErrors(formErrors);
    return !ValidationUtils.hasErrors(formErrors);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }

    // Save form data with country info
    updateStep3(formData);
    setCurrentStepDisplay(3);
    router.push("/(auth)/user-registration/step-4");
  };

  const handleBack = () => {
    router.back();
  };

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
          nameVariant="2xl"
        />

        {/* Inputs */}
        <View style={{ paddingHorizontal: s(24) }}>
          <View>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="mb-2 text-tat textcenter font-montserratSemibold"
            >
              Nome
              <ScaledText variant="sm" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <ScaledTextInput
              containerClassName={`flex-row items-center rounded-xl border border-gray`}
              className="text-foreground rounded-xl"
              style={{ fontSize: s(12) }}
              placeholder="Mario"
              value={formData.firstName}
              onChangeText={(v) => handleInputChange("firstName", v)}
            />
            {!!errors.firstName && (
              <ScaledText variant="11" className="mt-1 text-error">
                {errors.firstName}
              </ScaledText>
            )}
          </View>

          <View style={{ marginTop: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="mb-2 text-tat textcenter font-montserratSemibold"
            >
              Cognome
              <ScaledText variant="sm" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <ScaledTextInput
              containerClassName={`flex-row items-center rounded-xl border border-gray`}
              className="text-foreground rounded-xl"
              style={{ fontSize: s(12) }}
              placeholder="Rossi"
              value={formData.lastName}
              onChangeText={(v) => handleInputChange("lastName", v)}
            />
            {!!errors.lastName && (
              <ScaledText variant="11" className="mt-1 text-error">
                {errors.lastName}
              </ScaledText>
            )}
          </View>

          <View style={{ marginTop: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="mb-2 text-tat textcenter font-montserratSemibold"
            >
              Enter phone number
              <ScaledText variant="sm" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <View className="flex-row items-center border rounded-xl border-gray bg-tat-foreground">
              <Pressable
                onPress={() => setCountryPickerVisible(true)}
                style={{
                  paddingLeft: s(16),
                  // paddingRight: s(2),
                  paddingVertical: mvs(12),
                  flexDirection: "row",
                  alignItems: "center",
                  gap: s(6),
                  borderTopLeftRadius: s(12),
                  borderBottomLeftRadius: s(12),
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                }}
                className="bg-tat-foreground"
              >
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-gray font-montserratSemibold"
                >
                  +{formData.callingCode}
                </ScaledText>
                <SVGIcons.ChevronDownGray width={s(12)} height={s(12)} />
              </Pressable>
              <ScaledTextInput
                containerClassName="flex-1 rounded-xl"
                className="text-foreground font-montserratSemibold"
                style={{ fontSize: s(12) }}
                placeholder="Numero di telefono"
                value={formatPhoneForInput(
                  formData.phone,
                  formData.callingCode || "39"
                )}
                onChangeText={(v) => {
                  const digits = v.replace(/[^0-9]/g, "");
                  // Phone number part (excluding country code) can be up to 15 digits
                  const limitedDigits = digits.slice(0, 15);
                  const phoneValue = `+${formData.callingCode}${limitedDigits}`;

                  // Validate phone number using actual country code
                  // Phone number part (excluding country code) must be 10-15 digits
                  const phoneNumberLength = limitedDigits.length;
                  const isPhoneValid =
                    phoneNumberLength >= 10 && phoneNumberLength <= 15;

                  handleInputChange("phone", phoneValue);

                  // Set error if phone number is invalid
                  if (!isPhoneValid && limitedDigits.length > 0) {
                    setLocalErrors((prev) => ({
                      ...prev,
                      phone: "Please enter a valid phone number",
                    }));
                  } else if (isPhoneValid) {
                    // Clear error if valid
                    setLocalErrors((prev) => {
                      const { phone, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                keyboardType="number-pad"
                textContentType="telephoneNumber"
                maxLength={15}
              />
            </View>

            {/* Country Picker Modal with Safe Area */}
            <Modal
              visible={countryPickerVisible}
              animationType="slide"
              presentationStyle="pageSheet"
              onRequestClose={() => setCountryPickerVisible(false)}
            >
              <SafeAreaView
                style={{
                  flex: 1,
                  backgroundColor: "#000000",
                  paddingBottom: insets.bottom,
                  paddingTop: s(10),
                }}
              >
                <CountryPicker
                  countryCode={formData.countryCode as CountryCode}
                  withFilter
                  withFlag
                  withCallingCode
                  withAlphaFilter={false}
                  withModal={false}
                  onSelect={handleCountrySelect}
                  visible={true}
                  onClose={() => setCountryPickerVisible(false)}
                  theme={{
                    backgroundColor: "#000000",
                    onBackgroundTextColor: "#FFFFFF",
                    fontSize: 16,
                    filterPlaceholderTextColor: "#A49A99",
                    activeOpacity: 0.7,
                    itemHeight: 50,
                  }}
                  renderFlagButton={() => null}
                  containerButtonStyle={{
                    display: "none",
                  }}
                />
              </SafeAreaView>
            </Modal>
            {!!errors.phone && (
              <ScaledText variant="11" className="mt-1 text-error">
                {errors.phone}
              </ScaledText>
            )}
          </View>

          {/* Location Selection */}
          <View style={{ marginTop: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="mb-2 text-tat textcenter font-montserratSemibold"
            >
              Provincia & Comune
              <ScaledText variant="sm" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowLocationPicker(true)}
              className="border rounded-xl border-gray bg-tat-foreground"
              style={{ paddingVertical: mvs(12), paddingHorizontal: s(16) }}
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className={`
                  font-montserratSemibold
                  ${
                    formData.municipality && formData.province
                      ? "text-foreground"
                      : "text-gray"
                  }
                `}
              >
                {formData.municipality && formData.province
                  ? `${formData.province}, ${formData.municipality}`
                  : "Select Province and Municipality"}
              </ScaledText>
            </TouchableOpacity>
            {!!errors.province && (
              <ScaledText variant="11" className="mt-1 text-error">
                {errors.province}
              </ScaledText>
            )}
            {!!errors.municipality && (
              <ScaledText variant="11" className="mt-1 text-error">
                {errors.municipality}
              </ScaledText>
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Footer */}
      <NextBackFooter onNext={handleNext} nextLabel="Next" showBack={false} />

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={(data) => {
          setFormData((prev) => ({
            ...prev,
            province: data.province,
            provinceId: data.provinceId,
            municipality: data.municipality,
            municipalityId: data.municipalityId,
          }));
          clearErrors();
          setShowLocationPicker(false);
        }}
        initialProvinceId={formData.provinceId || null}
        initialMunicipalityId={formData.municipalityId || null}
      />
    </View>
  );
}
