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
import { Image, Modal, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import CountryPicker, { Country, CountryCode } from "react-native-country-picker-modal";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [modalStep, setModalStep] = useState<null | "province" | "municipality">(null);
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
        const provinceId = selectedProvince?.id || provinces.find((p) => p.name === formData.province)?.id;
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
      provinceId: selectedProvince?.id || (provinces.find(p => p.name === formData.province)?.id || '')
    }));
    setModalStep(null);
    setSearch("");
  };

  const onChange = (province: string, municipality: string, provinceId: string, municipalityId: string) => {
    setFormData({ ...formData, province, municipality, provinceId, municipalityId });
    clearErrors();
  };

  const validateForm = (): boolean => {
    const formErrors = ValidationUtils.validateForm(
      formData,
      UserStep3ValidationSchema
    );
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
              className="text-tat textcenter mb-2 font-montserratSemibold"
            >
              Nome
              <ScaledText variant="sm" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <ScaledTextInput
              containerClassName={`flex-row items-center rounded-xl border border-gray`}
              className="text-foreground rounded-xl"
              placeholder="Mario"
              placeholderTextColor="#A49A99"
              value={formData.firstName}
              onChangeText={(v) => handleInputChange("firstName", v)}
            />
            {!!errors.firstName && (
              <ScaledText variant="11" className="text-error mt-1">
                {errors.firstName}
              </ScaledText>
            )}
          </View>

          <View style={{ marginTop: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat textcenter mb-2 font-montserratSemibold"
            >
              Cognome
              <ScaledText variant="sm" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <ScaledTextInput
              containerClassName={`flex-row items-center rounded-xl border border-gray`}
              className="text-foreground rounded-xl"
              placeholder="Rossi"
              placeholderTextColor="#A49A99"
              value={formData.lastName}
              onChangeText={(v) => handleInputChange("lastName", v)}
            />
            {!!errors.lastName && (
              <ScaledText variant="11" className="text-error mt-1">
                {errors.lastName}
              </ScaledText>
            )}
          </View>

          <View style={{ marginTop: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat textcenter mb-2 font-montserratSemibold"
            >
              Enter phone number
              <ScaledText variant="sm" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <View className="flex-row items-center rounded-xl border border-gray bg-tat-foreground">
              <Pressable
                onPress={() => setCountryPickerVisible(true)}
                style={{ 
                  paddingLeft: s(16), 
                  paddingRight: s(2),
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
                  variant="body1"
                  className="text-foreground font-neueBold"
                >
                  +{formData.callingCode}
                </ScaledText>
                <SVGIcons.ChevronDown width={s(14)} height={s(14)} fill="#A49A99" />
              </Pressable>
              <ScaledTextInput
                containerClassName="flex-1 rounded-xl"
                className="text-foreground"
                placeholder="Numero di telefono"
                placeholderTextColor="#A49A99"
                value={formatPhoneForInput(formData.phone, formData.callingCode || "39")}
                onChangeText={(v) => {
                  const digits = v.replace(/[^0-9]/g, "");
                  handleInputChange("phone", `+${formData.callingCode}${digits}`);
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
              <SafeAreaView style={{ flex: 1, backgroundColor: "#000000", paddingBottom: insets.bottom, paddingTop: s(10), }}>
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
              <ScaledText variant="11" className="text-error mt-1">
                {errors.phone}
              </ScaledText>
            )}
          </View>

          {/* Location Selection */}
          <View style={{ marginTop: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat textcenter mb-2 font-montserratSemibold"
            >
              Location
              <ScaledText variant="sm" className="text-error">
                *
              </ScaledText>
            </ScaledText>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setModalStep("province");
                setSearch("");
              }}
              className="rounded-xl border border-gray px-4 py-3"
              style={{ paddingVertical: mvs(12), paddingHorizontal: s(16) }}
            >
              <ScaledText
                allowScaling={false}
                variant="body1"
                className={
                  formData.municipality && formData.province
                    ? "text-foreground"
                    : "text-gray"
                }
              >
                {formData.municipality && formData.province
                  ? `${formData.province}, ${formData.municipality}`
                  : "Select Province and Municipality"}
              </ScaledText>
            </TouchableOpacity>
            {!!errors.province && (
              <ScaledText variant="11" className="text-error mt-1">
                {errors.province}
              </ScaledText>
            )}
            {!!errors.municipality && (
              <ScaledText variant="11" className="text-error mt-1">
                {errors.municipality}
              </ScaledText>
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Footer */}
      <NextBackFooter
        onNext={handleNext}
        nextLabel="Next"
        backLabel="Back"
        onBack={handleBack}
      />

      {/* Location Selection Modal */}
      <Modal
        visible={!!modalStep}
        transparent
        animationType="slide"
        onRequestClose={() => setModalStep(null)}
      >
        <View className="flex-1 bg-black/50">
          <View
            className="flex-1 bg-black rounded-t-3xl"
            style={{ marginTop: "auto" }}
          >
            {/* Header */}
            <View
              className="border-b border-gray flex-row items-center justify-between relative bg-primary/30"
              style={{
                paddingBottom: mvs(12),
                paddingTop: mvs(50),
                paddingHorizontal: s(20),
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (modalStep === "municipality") setModalStep("province");
                  else setModalStep(null);
                }}
                className="rounded-full bg-foreground/20 items-center justify-center"
                style={{ width: s(30), height: s(30) }}
              >
                <SVGIcons.Close className="w-8 h-8" />
              </TouchableOpacity>
              <View className="flex-row items-center justify-center">
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueBold"
                >
                  {modalStep === "province"
                    ? "Seleziona la provincia"
                    : "Seleziona il comune"}
                </ScaledText>
              </View>
              <View style={{ height: mvs(30), width: mvs(30) }} />
            </View>

            {/* Search */}
            <View
              style={{ paddingHorizontal: s(20), paddingVertical: mvs(16) }}
            >
              <View className="border border-gray rounded-full flex-row items-center bg-tat-foreground">
                <View style={{ paddingLeft: s(16) }}>
                  <SVGIcons.Search className="w-5 h-5 mr-2" />
                </View>
                <ScaledTextInput
                  containerClassName="rounded-l-full bg-tat-foreground"
                  className="text-foreground"
                  placeholder={
                    modalStep === "province"
                      ? "Cerca provincia"
                      : "Cerca comune"
                  }
                  placeholderTextColor="#A49A99"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            </View>

            {/* Content */}
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: mvs(100) + Math.max(insets.bottom, mvs(20)),
              }}
            >
              {/* Popular six for province step - only show when not searching */}
              {modalStep === "province" && provinces.slice(0, 6).length > 0 && search.trim().length === 0 && (
                <View style={{ paddingBottom: mvs(16) }}>
                  <ScaledText
                    allowScaling={false}
                    variant="lg"
                    className="text-gray font-neueBold mb-3 ml-1"
                    style={{ paddingHorizontal: s(20) }}
                  >
                    Popular cities
                  </ScaledText>
                  <View className="flex-row flex-wrap gap-[2px] bg-background">
                    {provinces.slice(0, 6).map((p) => {
                      const active =
                        selectedProvince?.id === p.id || formData.province === p.name;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => {
                            setSelectedProvince(p);
                            setSearch("");
                          }}
                          style={{
                            width: "32%",
                            overflow: "hidden",
                          }}
                          className="h-32"
                        >
                          {p.imageUrl ? (
                            <Image
                              source={{ uri: p.imageUrl }}
                              className="w-full h-[75%]"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="w-full h-[70%] bg-gray/30" />
                          )}
                          <View
                            className={`h-[25%] flex items-center justify-center ${active ? "bg-primary" : "bg-background"}`}
                          >
                            <ScaledText
                              allowScaling={false}
                              variant="body2"
                              className="text-foreground text-center"
                            >
                              {p.name}
                            </ScaledText>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* List */}
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-gray font-neueBold mb-3 ml-1"
                  style={{ paddingHorizontal: s(20) }}
                >
                  {search.trim().length > 0
                    ? "Search results"
                    : modalStep === "province"
                      ? "Other provinces"
                      : `Comunes under ${selectedProvince?.name || formData.province || "Roma"}`}
                </ScaledText>
                {(modalStep === "province" ? provinces : municipalities)
                  .filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))
                  .filter((r) =>
                    modalStep === "province" && search.trim().length === 0
                      ? !provinces.slice(0, 6).map(p => p.id).includes(r.id)
                      : true
                  ).length === 0 ? (
                  <View style={{ paddingHorizontal: s(20), paddingVertical: mvs(40) }}>
                    <ScaledText
                      allowScaling={false}
                      variant="body2"
                      className="text-gray text-center"
                    >
                      No results found
                    </ScaledText>
                  </View>
                ) : (
                  (modalStep === "province" ? provinces : municipalities)
                    .filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))
                    .filter((r) =>
                      modalStep === "province" && search.trim().length === 0
                        ? !provinces.slice(0, 6).map(p => p.id).includes(r.id)
                        : true
                    )
                    .map((item) => (
                      <Pressable
                        key={item.id}
                        className={`py-4 border-b border-gray/20 ${formData.municipality === item.name && formData.province === selectedProvince?.name ? "bg-primary" : "bg-[#100C0C]"}`}
                        onPress={() => {
                          if (modalStep === "province") {
                            setSelectedProvince(item);
                            setSearch("");
                          } else {
                            onChange(
                              selectedProvince?.name || formData.province,
                              item.name,
                              selectedProvince?.id || (provinces.find(p => p.name === formData.province)?.id || ''),
                              item.id
                            );
                            setModalStep(null);
                            setSearch("");
                          }
                        }}
                      >
                        <View className="flex-row items-center gap-3 px-6">
                          <ScaledText
                            allowScaling={false}
                            variant="body2"
                            className="text-foreground"
                          >
                            {item.name}
                          </ScaledText>
                        </View>
                      </Pressable>
                    ))
                )}
              </View>
            </ScrollView>

            {/* Footer actions */}
            <View
              className="flex-row justify-between absolute left-0 right-0 bg-background border-t border-gray/20"
              style={{
                paddingHorizontal: s(20),
                paddingTop: mvs(16),
                paddingBottom: Math.max(insets.bottom, mvs(20)),
                bottom: 0,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (modalStep === "municipality") setModalStep("province");
                  else setModalStep(null);
                }}
                className="rounded-full border border-foreground items-center flex-row gap-3"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground"
                >
                  Back
                </ScaledText>
              </TouchableOpacity>
              {modalStep === "province" ? (
                <TouchableOpacity
                  onPress={() => {
                    if (selectedProvince) {
                      setModalStep("municipality");
                      setSearch("");
                    }
                  }}
                  className={`rounded-full items-center flex-row gap-3 ${selectedProvince ? "bg-primary" : "bg-gray/40"}`}
                  style={{
                    paddingVertical: mvs(10.5),
                    paddingLeft: s(18),
                    paddingRight: s(20),
                  }}
                  disabled={!selectedProvince}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground"
                  >
                    Next
                  </ScaledText>
                  <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
                </TouchableOpacity>
              ) : (
                <View />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
