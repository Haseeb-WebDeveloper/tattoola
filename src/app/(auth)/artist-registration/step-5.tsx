import AbsoluteNextBackFooter from "@/components/ui/AbsoluteNextBackFooter";
import NextBackFooter from "@/components/ui/NextBackFooter";
import AuthStepHeader from "@/components/ui/auth-step-header";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { getMunicipalities, getProvinces } from "@/services/location.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step5Schema } from "@/utils/artistRegistrationValidation";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ArtistStep5V2() {
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
    const result = step5Schema.safeParse({
      studioName: step5.studioName || "",
      province: step5.province || "",
      municipality: step5.municipality || "",
      studioAddress: step5.studioAddress || "",
      website: step5.website || "",
      phone: (step5.phone || "").replace(/\s+/g, ""),
    });
    if (!result.success) {
      const errs: any = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        errs[key] = issue.message;
      }
      setErrors(errs);
    } else {
      setErrors({});
    }
  };

  const onNext = () => {
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
            placeholder="Tattoo Paradise"
            placeholderTextColor="#A49A99"
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
              className="text-error font-montserratSemibold"
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
          onChange={(provinceLabel, municipalityLabel, provinceId, municipalityId) =>
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
            containerClassName={`rounded-xl ${focused === "studioAddress" ? "border-2 border-foreground" : "border border-gray"}`}
            className="text-foreground rounded-xl"
            placeholder="Via A.G. Alaimo 139, Ancona, 60044"
            placeholderTextColor="#A49A99"
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
              className="text-error font-montserratSemibold"
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
            containerClassName={`rounded-xl ${focused === "website" ? "border-2 border-foreground" : "border border-gray"}`}
            className="text-foreground rounded-xl"
            placeholder="https://..."
            placeholderTextColor="#A49A99"
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
            className={`flex-row items-center rounded-xl ${focused === "phone" ? "border-2 border-foreground" : "border border-gray"}`}
          >
            <View
              className="flex-row items-center"
              style={{
                paddingLeft: s(16),
                paddingRight: s(8),
                paddingVertical: mvs(12),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueBold"
              >
                +39
              </ScaledText>
            </View>
            <ScaledTextInput
              containerClassName="flex-1"
              className="text-foreground rounded-xl"
              placeholder="3XXXXXXXXX"
              placeholderTextColor="#A49A99"
              value={(step5.phone || "").replace(/^\+?39\s?/, "")}
              onChangeText={(v) => {
                const digits = v.replace(/[^0-9]/g, "");
                updateStep5({ phone: `+39 ${digits}` });
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
          {!!errors.phone && (
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-error font-montserratSemibold"
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
  onChange: (provinceLabel: string, municipalityLabel: string, provinceId: string, municipalityId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [modalStep, setModalStep] = useState<
    "province" | "municipality" | null
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

  useEffect(() => {
    if (modalStep === "province" && provinces.length === 0) {
      getProvinces()
        .then(setProvinces)
        .catch(() => setProvinces([]));
    }
  }, [modalStep]);

  useEffect(() => {
    if (modalStep === "municipality" && selectedProvince) {
      getMunicipalities(selectedProvince.id)
        .then(setMunicipalities)
        .catch(() => setMunicipalities([]));
    }
  }, [modalStep, selectedProvince]);

  const topSix = provinces.slice(0, 6);
  const topSixIds = new Set(topSix.map((p) => p.id));
  const isSearching = search.trim().length > 0;

  const listFiltered = (modalStep === "province" ? provinces : municipalities)
    .filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))
    // When searching, include all results (including popular cities)
    // When not searching, exclude popular cities from the "Other provinces" list
    .filter((r) =>
      modalStep === "province" && !isSearching ? !topSixIds.has(r.id) : true
    );

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
        onPress={() => {
          setModalStep("province");
          setSearch("");
        }}
        className="rounded-xl border border-gray bg-[#100C0C] px-4 py-3"
      >
        <ScaledText
          allowScaling={false}
          variant="md"
          className={valueProvince ? "text-foreground" : "text-[#A49A99]"}
        >
          {displayValue}
        </ScaledText>
      </TouchableOpacity>

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
              className="border-b border-gray flex-row items-center justify-between  relative bg-primary/30"
              style={{
                paddingBottom: mvs(20),
                paddingTop: mvs(70),
                paddingHorizontal: s(20),
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setModalStep(null);
                  setSelectedProvince(null);
                  setSearch("");
                }}
                className=" rounded-full bg-foreground/20 items-center justify-center"
                style={{
                  width: s(30),
                  height: s(30),
                }}
              >
                <SVGIcons.Close width={s(10)} height={s(10)} />
              </TouchableOpacity>
              <View className="flex-row items-center  justify-center">
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

              {/* empty view */}
              <View style={{ height: mvs(30), width: mvs(30) }} />
            </View>

            {/* Content */}
            <ScrollView
              className="flex-1 pt-8"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: mvs(100) + Math.max(insets.bottom, mvs(20)),
              }}
            >
              {/* Selected province pill with edit (with image preview) */}
              {modalStep === "municipality" && selectedProvince && (
                <View className="flex-row items-center justify-between mb-6 px-6 bg-[#100C0C]">
                  <View className="flex-row items-center gap-4">
                    <View className="overflow-hidden bg-gray/20 w-24 h-16">
                      {selectedProvince.imageUrl ? (
                        <Image
                          source={{ uri: selectedProvince.imageUrl }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full bg-gray/30" />
                      )}
                    </View>
                    <View className="h-16 flex items-center justify-center">
                      <Text className="text-foreground tat-body-1">
                        Province :{" "}
                        <Text className="font-neueBold">
                          {selectedProvince.name}
                        </Text>
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setModalStep("province");
                      setSearch("");
                    }}
                    accessibilityRole="button"
                  >
                    <SVGIcons.Pen2 className="w-5 h-5" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Search */}
              <View
                className="border border-gray rounded-full flex-row items-center"
                style={{
                  paddingHorizontal: s(12),
                  marginHorizontal: s(24),
                  marginBottom: mvs(16),
                }}
              >
                <SVGIcons.Search width={s(20)} height={s(20)} />
                <ScaledTextInput
                  containerClassName="flex-1"
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

              {/* Popular six for province step - only show when not searching */}
              {modalStep === "province" &&
                topSix.length > 0 &&
                !isSearching && (
                  <View
                    style={{
                      paddingBottom: mvs(16),
                    }}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="lg"
                      className="text-gray font-neueBold mb-3 ml-1"
                      style={{
                        paddingHorizontal: s(20),
                      }}
                    >
                      Popular cities
                    </ScaledText>
                    <View className="flex-row flex-wrap gap-[2px] bg-background">
                      {topSix.map((p, idx) => {
                        const active =
                          selectedProvince?.id === p.id ||
                          valueProvince === p.name ||
                          valueMunicipality === p.name;
                        return (
                          <TouchableOpacity
                            key={p.id}
                            onPress={() => {
                              // Select only; move next via Next button
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
                              className={`h-[25%] flex items-center justify-center  ${active ? "bg-primary" : "bg-background"}`}
                            >
                              <ScaledText
                                allowScaling={false}
                                variant="body2"
                                className={`text-foreground text-center`}
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
              <View className="">
                <ScaledText
                  allowScaling={false}
                  variant="body1"
                  className="px-6 mb-2 text-gray font-semibold"
                >
                  {isSearching
                    ? `Search results${listFiltered.length > 0 ? ` (${listFiltered.length})` : ""}`
                    : modalStep === "province"
                      ? "Other provinces"
                      : `Comunes  under ${selectedProvince?.name || valueProvince || "Roma"}`}
                </ScaledText>
                {listFiltered.length === 0 && isSearching ? (
                  <View className="py-8 px-6">
                    <ScaledText
                      allowScaling={false}
                      variant="body1"
                      className="text-gray text-center"
                    >
                      No results found for "{search}"
                    </ScaledText>
                  </View>
                ) : (
                  listFiltered.map((item) => (
                    <Pressable
                      key={item.id}
                      className={`py-4 border-b border-gray/20 
                      ${valueMunicipality === item.name && valueProvince === selectedProvince?.name ? "bg-primary" : " bg-[#100C0C]"}`}
                      onPress={() => {
                        if (modalStep === "province") {
                          // Select province only; proceed with Next button
                          setSelectedProvince(item);
                          setSearch("");
                        } else {
                          onChange(
                            selectedProvince?.name || valueProvince,
                            item.name,
                            selectedProvince?.id || '',
                            item.id
                          );
                          setModalStep(null);
                          setSearch("");
                        }
                      }}
                    >
                      <View className="flex-row items-center gap-3 px-6">
                        {/* <View
                        className="rounded-lg overflow-hidden bg-gray/20"
                        style={{ width: 28, height: 28 }}
                      >
                        {item.imageUrl ? (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={{ width: 28, height: 28 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full bg-gray/30" />
                        )}
                      </View> */}
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

            {/* Footer actions  */}
            <NextBackFooter
              onNext={() => {
                if (modalStep === "province") {
                  if (selectedProvince) {
                    setModalStep("municipality");
                    setSearch("");
                  }
                } else {
                  setModalStep(null);
                  setSearch("");
                }
              }}
              nextDisabled={false}
              backLabel="Back"
              onBack={() => {
                if (modalStep === "municipality") {
                  setModalStep("province");
                  setSearch("");
                } else {
                  setModalStep(null);
                  setSelectedProvince(null);
                  setSearch("");
                }
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
