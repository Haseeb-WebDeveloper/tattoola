import LocationPicker from "@/components/shared/LocationPicker";
import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step5Schema } from "@/utils/artistRegistrationValidation";
import { mvs, s } from "@/utils/scale";
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
  const regex = new RegExp(`^\\+?${callingCode}\\s?`);
  return phone.replace(regex, "");
}

export default function ArtistStep5V2() {
  const insets = useSafeAreaInsets();
  const {
    step5,
    updateStep5,
    totalStepsDisplay,
    currentStepDisplay,
    setCurrentStepDisplay,
  } = useArtistRegistrationV2Store();
  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    studioName?: string;
    province?: string;
    municipality?: string;
    studioAddress?: string;
    phone?: string;
  }>({});
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [countryCode, setCountryCode] = useState<CountryCode>("IT");
  const [callingCode, setCallingCode] = useState<string>("39");

  // Ensure progress shows step 5 without setting state during render
  useEffect(() => {
    if (currentStepDisplay !== 5) setCurrentStepDisplay(5);
  }, [currentStepDisplay, setCurrentStepDisplay]);

  const canProceed = isValid(step5Schema, {
    studioName: step5.studioName || "",
    province: step5.province || "",
    municipality: step5.municipality || "",
    studioAddress: step5.studioAddress || "",
    website: step5.website || "",
    phone: (step5.phone || "").replace(/\s+/g, ""),
  });

  const validateAll = () => {
    // Validate phone number using actual country code
    const phoneNumber = step5.phone || "";
    const phoneDigits = phoneNumber.replace(/[^0-9]/g, "");
    const countryCodeLength = (callingCode || "39").length;
    const phoneNumberLength = phoneDigits.length - countryCodeLength;
    const isPhoneValid = phoneNumberLength >= 10 && phoneNumberLength <= 15;

    const result = step5Schema.safeParse({
      studioName: step5.studioName || "",
      province: step5.province || "",
      municipality: step5.municipality || "",
      studioAddress: step5.studioAddress || "",
      website: step5.website || "",
      phone: phoneNumber.replace(/\s+/g, ""),
    });

    if (!result.success || !isPhoneValid) {
      const errs: any = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        errs[key] = issue.message;
      }
      // Override phone error if validation fails with actual country code
      if (!isPhoneValid) {
        errs.phone = "Please enter a valid phone number";
      }
      setErrors(errs);
    } else {
      setErrors({});
    }
  };

  const onNext = () => {
    validateAll();
    if (!canProceed) return;
    router.push("/(auth)/artist-registration/step-6");
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={150}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-black"
    >
      {/* Header */}
      <AuthStepHeader />

      {/* Progress */}
      <RegistrationProgress
        currentStep={currentStepDisplay}
        totalSteps={totalStepsDisplay}
        name="Studio Details"
        icon={<SVGIcons.Studio width={19} height={19} />}
        nameVariant="2xl"
      />

      {/* Form */}
      <View style={{ paddingHorizontal: s(20), rowGap: mvs(15) }}>
        {/* Studio Name */}
        <View>
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-tat font-montserratSemibold"
            style={{ marginBottom: mvs(4) }}
          >
            Name of the Studio
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-error font-montserratSemibold"
            >
              *
            </ScaledText>
          </ScaledText>
          <ScaledTextInput
            containerClassName={`rounded-xl ${focused === "studioName" ? "border-2 border-foreground" : "border border-gray"}`}
            className="text-foreground rounded-xl"
            style={{ fontSize: s(12) }}
            placeholder="Tattoo Paradise"
            value={step5.studioName || ""}
            onChangeText={(v) => updateStep5({ studioName: v })}
            onFocus={() => setFocused("studioName")}
            onBlur={() => {
              setFocused(null);
              validateAll();
            }}
          />
          {!!errors.studioName && (
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-error font-neueLight"
              style={{ marginTop: mvs(4) }}
            >
              {errors.studioName}
            </ScaledText>
          )}
        </View>

        {/* Province & Municipality */}
        <ProvinceMunicipalityInput
          valueProvince={step5.province || ""}
          valueMunicipality={step5.municipality || ""}
          onChange={(
            provinceLabel,
            municipalityLabel,
            provinceId,
            municipalityId
          ) =>
            updateStep5({
              province: provinceLabel,
              municipality: municipalityLabel,
              provinceId,
              municipalityId,
            })
          }
        />

        {/* Address */}
        <View>
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-tat font-montserratSemibold"
            style={{ marginBottom: mvs(4) }}
          >
            Inserisci l’indirizzo dello Studio dove lavori
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-error font-montserratSemibold"
            >
              *
            </ScaledText>
          </ScaledText>
          <ScaledTextInput
            containerClassName={`rounded-xl ${focused === "studioAddress" ? "border-2 border-foreground" : "border border-gray"} bg-tat-foreground`}
            className="text-foreground rounded-xl"
            style={{ fontSize: s(12) }}
            placeholder="Via A.G. Alaimo 139, Ancona, 60044"
            value={step5.studioAddress || ""}
            onChangeText={(v) => updateStep5({ studioAddress: v })}
            onFocus={() => setFocused("studioAddress")}
            onBlur={() => {
              setFocused(null);
              validateAll();
            }}
          />
          {!!errors.studioAddress && (
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-error font-neueLight"
              style={{ marginTop: mvs(4) }}
            >
              {errors.studioAddress}
            </ScaledText>
          )}
        </View>

        {/* Website */}
        <View>
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-tat font-montserratSemibold"
            style={{ marginBottom: mvs(4) }}
          >
            Studio website
          </ScaledText>
          <ScaledTextInput
            containerClassName={`rounded-xl ${focused === "website" ? "border-2 border-foreground" : "border border-gray"} bg-tat-foreground`}
            className="text-foreground rounded-xl"
            style={{ fontSize: s(12) }}
            placeholder="https://..."
            value={step5.website || ""}
            onChangeText={(v) => updateStep5({ website: v })}
            onFocus={() => setFocused("website")}
            onBlur={() => setFocused(null)}
            autoCapitalize="none"
          />
        </View>

        {/* Phone */}
        <View>
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-tat font-montserratSemibold"
            style={{ marginBottom: mvs(4) }}
          >
            Enter phone number
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-error font-montserratSemibold"
            >
              *
            </ScaledText>
          </ScaledText>
          <View
            className={`flex-row items-center rounded-xl ${focused === "phone" ? "border-2 border-foreground" : "border border-gray"} bg-tat-foreground`}
          >
            <Pressable
              onPress={() => setCountryPickerVisible(true)}
              style={{
                paddingLeft: s(16),
                paddingVertical: mvs(12),
                flexDirection: "row",
                alignItems: "center",
                gap: s(6),
                borderTopLeftRadius: s(12),
                borderBottomLeftRadius: s(12),
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              }}
              className="bg-tat-foreground rounded-l-xl"
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-gray font-montserratSemibold"
              >
                +{callingCode}
              </ScaledText>
              <SVGIcons.ChevronDownGray width={s(12)} height={s(12)} />
            </Pressable>
            <ScaledTextInput
              containerClassName="flex-1 rounded-xl"
              className="text-foreground rounded-xl"
              placeholder="Numero di telefono"
              value={formatPhoneForInput(
                step5.phone || "",
                callingCode || "39"
              )}
              style={{ fontSize: s(12) }}
              onChangeText={(v) => {
                const digits = v.replace(/[^0-9]/g, "");

                const limitedDigits = digits.slice(0, 15);
                const phoneValue = `+${callingCode}${limitedDigits}`;
                updateStep5({ phone: phoneValue });

                // Validate phone number using actual country code
                // Phone number part (excluding country code) must be 10-15 digits
                const phoneNumberLength = limitedDigits.length;
                const isPhoneValid =
                  phoneNumberLength >= 10 && phoneNumberLength <= 15;

                // Real-time validation
                const result = step5Schema.safeParse({
                  studioName: step5.studioName || "",
                  province: step5.province || "",
                  municipality: step5.municipality || "",
                  studioAddress: step5.studioAddress || "",
                  website: step5.website || "",
                  phone: phoneValue.replace(/\s+/g, ""),
                });

                // Check phone validation with actual country code
                if (!isPhoneValid) {
                  setErrors((prev) => ({
                    ...prev,
                    phone: "Please enter a valid phone number",
                  }));
                } else if (!result.success) {
                  const phoneError = result.error.issues.find(
                    (issue) => issue.path[0] === "phone"
                  );
                  if (phoneError) {
                    setErrors((prev) => ({
                      ...prev,
                      phone: phoneError.message,
                    }));
                  } else {
                    setErrors((prev) => {
                      const { phone, ...rest } = prev;
                      return rest;
                    });
                  }
                } else {
                  setErrors((prev) => {
                    const { phone, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              onFocus={() => setFocused("phone")}
              onBlur={() => {
                setFocused(null);
                validateAll();
              }}
              keyboardType="number-pad"
              textContentType="telephoneNumber"
              maxLength={15}
            />
          </View>
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
                countryCode={countryCode}
                withFilter
                withFlag
                withCallingCode
                withAlphaFilter={false}
                withModal={false}
                onSelect={(country: Country) => {
                  const cc = country.callingCode[0] || "39";
                  setCountryCode(country.cca2 as CountryCode);
                  setCallingCode(cc);
                  updateStep5({ phone: "" });
                  setCountryPickerVisible(false);
                }}
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
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-error font-neue"
              style={{ marginTop: mvs(4) }}
            >
              {errors.phone}
            </ScaledText>
          )}
        </View>
      </View>

      {/* Footer actions */}

      <NextBackFooter
        onNext={onNext}
        nextDisabled={!canProceed}
        backLabel="Back"
        onBack={() => router.back()}
      />
    </KeyboardAwareScrollView>
  );
}

function ProvinceMunicipalityInput({
  valueProvince,
  valueMunicipality,
  onChange,
}: {
  valueProvince: string;
  valueMunicipality: string;
  onChange: (
    provinceLabel: string,
    municipalityLabel: string,
    provinceId: string,
    municipalityId: string
  ) => void;
}) {
  const insets = useSafeAreaInsets();
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const displayValue =
    valueProvince && valueMunicipality
      ? `${valueProvince}, ${valueMunicipality}`
      : "Roma, Lazio";

  return (
    <View className="">
      <ScaledText
        allowScaling={false}
        variant="sm"
        className="text-tat font-montserratSemibold"
        style={{ marginBottom: mvs(6) }}
      >
        Enter province and municipality
        <ScaledText
          allowScaling={false}
          variant="sm"
          className="text-error font-montserratSemibold"
        >
          *
        </ScaledText>
      </ScaledText>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setShowLocationPicker(true)}
        className="border rounded-xl border-gray bg-tat-foreground"
        style={{
          paddingVertical: mvs(12),
          paddingHorizontal: s(16),
        }}
      >
        <ScaledText
          allowScaling={false}
          variant="sm"
          className={`font-montserratSemibold ${valueProvince ? "text-foreground" : "text-gray"}`}
        >
          {displayValue}
        </ScaledText>
      </TouchableOpacity>

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={(data) => {
          onChange(
            data.province,
            data.municipality,
            data.provinceId,
            data.municipalityId
          );
          setShowLocationPicker(false);
        }}
        initialProvinceId={undefined}
        initialMunicipalityId={undefined}
      />
    </View>
  );
}
