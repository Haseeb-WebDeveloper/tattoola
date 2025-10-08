import { getMunicipalities, getProvinces } from "@/services/location.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function ArtistStep5V2() {
  const {
    step5,
    updateStep5,
    totalStepsDisplay,
    currentStepDisplay,
    setCurrentStepDisplay,
  } = useArtistRegistrationV2Store();
  const [focused, setFocused] = useState<string | null>(null);

  // Ensure progress shows step 5 without setting state during render
  useEffect(() => {
    if (currentStepDisplay !== 5) setCurrentStepDisplay(5);
  }, [currentStepDisplay, setCurrentStepDisplay]);

  const onNext = () => {
    router.push("/(auth)/artist-registration/step-6");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 10}
      className="flex-1 bg-black"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView className="flex-1 relative" contentContainerClassName="flex-grow">
          {/* Header */}
          <View className="px-4 my-8">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/welcome")}
                className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
              >
                <Image
                  source={require("@/assets/images/icons/close.png")}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Image
                source={require("@/assets/logo/logo-light.png")}
                className="h-10"
                resizeMode="contain"
              />
              <View className="w-10" />
            </View>
            <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
          </View>

          {/* Progress */}
          <View className="items-center mb-8">
            <View className="flex-row items-center gap-1">
              {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
                <View
                  key={idx}
                  className={`${idx < 5 ? (idx === 4 ? "bg-foreground w-3 h-3" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
                />
              ))}
            </View>
          </View>

          {/* Title */}
          <View className="px-6 mb-6 flex-row gap-2 items-center">
            <Image
              source={require("@/assets/images/icons/store.png")}
              className="w-6 h-6"
              resizeMode="contain"
            />
            <Text className="text-foreground section-title font-neueBold">
              Studio Details
            </Text>
          </View>

          {/* Form */}
          <View className="px-6 gap-6">
            {/* Studio Name */}
            <View>
              <Text className="text-foreground mb-2 tat-body-2-med">
                Name of the Studio<Text className="text-error">*</Text>
              </Text>
              <View
                className={`rounded-xl bg-black/40 ${focused === "studioName" ? "border-2 border-foreground" : "border border-gray"}`}
              >
                <TextInput
                  className="px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
                  placeholder="Tattoo Paradise"
                  placeholderTextColor="#A49A99"
                  value={step5.studioName || ""}
                  onChangeText={(v) => updateStep5({ studioName: v })}
                  onFocus={() => setFocused("studioName")}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            {/* Province & Municipality */}
            <ProvinceMunicipalityInput
              valueProvince={step5.province || ""}
              valueMunicipality={step5.municipality || ""}
              onChange={(provinceLabel, municipalityLabel) =>
                updateStep5({
                  province: provinceLabel,
                  municipality: municipalityLabel,
                })
              }
            />

            {/* Address */}
            <View>
              <Text className="text-foreground mb-2 tat-body-2-med">
                Inserisci l’indirizzo dello Studio dove lavori
                <Text className="text-error">*</Text>
              </Text>
              <View
                className={`rounded-xl bg-black/40 ${focused === "studioAddress" ? "border-2 border-foreground" : "border border-gray"}`}
              >
                <TextInput
                  className="px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
                  placeholder="Via A.G. Alaimo 139, Ancona, 60044"
                  placeholderTextColor="#A49A99"
                  value={step5.studioAddress || ""}
                  onChangeText={(v) => updateStep5({ studioAddress: v })}
                  onFocus={() => setFocused("studioAddress")}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            {/* Website */}
            <View>
              <Text className="text-foreground mb-2 tat-body-2-med">
                Studio website
              </Text>
              <View
                className={`rounded-xl bg-black/40 ${focused === "website" ? "border-2 border-foreground" : "border border-gray"}`}
              >
                <TextInput
                  className="px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
                  placeholder="https://..."
                  placeholderTextColor="#A49A99"
                  value={step5.website || ""}
                  onChangeText={(v) => updateStep5({ website: v })}
                  onFocus={() => setFocused("website")}
                  onBlur={() => setFocused(null)}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone */}
            <View>
              <Text className="text-foreground mb-2 tat-body-2-med">
                Enter phone number<Text className="text-error">*</Text>
              </Text>
              <View
                className={`flex-row items-center rounded-xl bg-black/40 ${focused === "phone" ? "border-2 border-foreground" : "border border-gray"}`}
              >
                <View className="pl-4 pr-2 py-3 flex-row items-center">
                  <Text className="text-foreground font-neueBold">+39</Text>
                </View>
                <TextInput
                  className="flex-1 pr-4 py-3 text-base text-foreground bg-[#100C0C] rounded-xl"
                  placeholder="3XXXXXXXXX"
                  placeholderTextColor="#A49A99"
                  value={(step5.phone || "").replace(/^\+?39\s?/, "")}
                  onChangeText={(v) => {
                    const digits = v.replace(/[^0-9]/g, "");
                    updateStep5({ phone: `+39 ${digits}` });
                  }}
                  onFocus={() => setFocused("phone")}
                  onBlur={() => setFocused(null)}
                  keyboardType="number-pad"
                  textContentType="telephoneNumber"
                  maxLength={15}
                />
              </View>
            </View>
          </View>

          {/* Footer actions */}
          <View className="flex-row justify-between px-6 mt-10 mb-10 absolute top-[80vh] left-0 right-0">
            <TouchableOpacity
              onPress={() => router.back()}
              className="rounded-full border border-foreground px-6 py-4"
            >
              <Text className="text-foreground">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNext}
              className="rounded-full px-8 py-4 bg-primary"
            >
              <Text className="text-foreground">Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function ProvinceMunicipalityInput({
  valueProvince,
  valueMunicipality,
  onChange,
}: {
  valueProvince: string;
  valueMunicipality: string;
  onChange: (provinceLabel: string, municipalityLabel: string) => void;
}) {
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
  const listFiltered = (
    modalStep === "province" ? provinces : municipalities
  ).filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()));

  const displayValue =
    valueProvince && valueMunicipality
      ? `${valueProvince}, ${valueMunicipality}`
      : "Roma, Lazio";

  console.log(valueProvince, valueMunicipality);
  console.log(topSix, topSix);

  return (
    <View className="">
      <Text className="text-foreground mb-2 tat-body-2-med">
        Enter province and municipality<Text className="text-error">*</Text>
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => {
          setModalStep("province");
          setSearch("");
        }}
        className="rounded-xl border border-gray bg-black/40 px-4 py-3"
      >
        <Text className={valueProvince ? "text-foreground" : "text-[#A49A99]"}>
          {displayValue}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={!!modalStep}
        transparent
        animationType="slide"
        onRequestClose={() => setModalStep(null)}
      >
        <View className="flex-1 justify-end ">
          <View className="w-full bg-black rounded-t-3xl h-[100vh] ">
            {/* Header */}
            <View className="px-6 pb-6 pt-20 border-b border-gray flex-row items-center justify-between  relative bg-primary/30">
              <TouchableOpacity
                onPress={() => {
                  setModalStep(null);
                  setSelectedProvince(null);
                  setSearch("");
                }}
                className="absolute left-6 top-20 w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
              >
                <Image
                  source={require("@/assets/images/icons/close.png")}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <View className="flex-row items-center  justify-center w-full">
                <Text className="text-foreground text-lg font-neueBold tat-body-1">
                  {modalStep === "province"
                    ? "Seleziona la provincia"
                    : "Seleziona il comune"}
                </Text>
              </View>
            </View>

            {/* Content */}
            <View className="pt-8 mb-28 relative">
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
                    <Image
                      source={require("@/assets/images/icons/pen.png")}
                      className="w-5 h-5"
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Search */}
              <View className="mx-6 border border-gray py-0.5 px-4 mb-8 rounded-full flex-row items-center">
                <Image
                  source={require("@/assets/images/icons/search.png")}
                  className="w-5 h-5 mr-2"
                  resizeMode="contain"
                />
                <TextInput
                  className="text-foreground flex-1"
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

              {/* Popular six for province step */}
              {modalStep === "province" && topSix.length > 0 && (
                <View className="mb-6">
                  <Text className="px-6 text-lg font-semibold text-gray tat-body-1 mb-3 ml-1">
                    Popular cities
                  </Text>
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
                            <Text
                              className={`text-foreground text-center text-[11px] `}
                            >
                              {p.name}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* List */}
              <View className="">
                <Text className="px-6 mb-2 tat-body-1 text-gray font-semibold">
                  {modalStep === "province"
                    ? "Other provinces"
                    : `Comunes  under ${selectedProvince?.name || valueProvince || "Roma"}`}
                </Text>
                <FlatList
                  data={listFiltered}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <Pressable
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
                            item.name
                          );
                          setModalStep(null);
                          setSearch("");
                        }
                      }}
                    >
                      <View className="flex-row items-center gap-3 px-6 tat-body-2-light">
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
                        <Text className="text-foreground">{item.name}</Text>
                      </View>
                    </Pressable>
                  )}
                  style={{ maxHeight: 360 }}
                />
              </View>

              {/* Footer actions (fixed at bottom) */}
              <View className="absolute top-[75vh] left-0 right-0 px-6 pt-4 pb-10 bg-background/90 blur-sm backdrop-blur-xl flex-row justify-between">
                <TouchableOpacity
                  onPress={() => {
                    if (modalStep === "municipality") setModalStep("province");
                    else setModalStep(null);
                  }}
                  className="rounded-full border border-foreground px-6 py-3"
                >
                  <Text className="text-foreground">Back</Text>
                </TouchableOpacity>
                {modalStep === "province" ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedProvince) {
                        setModalStep("municipality");
                        setSearch("");
                      }
                    }}
                    className={`rounded-full px-8 py-3 ${selectedProvince ? "bg-primary" : "bg-gray/40"}`}
                    disabled={!selectedProvince}
                  >
                    <Text className="text-foreground">Next</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
