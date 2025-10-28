import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
    fetchStudioDetails,
    updateStudioNameAddress,
} from "@/services/studio.service";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    TouchableOpacity,
    View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function StudioNameAddressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    name: "",
    province: "",
    provinceId: "",
    municipality: "",
    municipalityId: "",
    address: "",
  });

  const [initialData, setInitialData] = useState({
    name: "",
    province: "",
    provinceId: "",
    municipality: "",
    municipalityId: "",
    address: "",
  });

  const [modalStep, setModalStep] = useState<null | "province" | "municipality">(
    null
  );
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

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Fetch current studio data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setIsFetching(true);
        const studio = await fetchStudioDetails(user.id);

        // Fetch location data
        const { data: locationData } = await supabase
          .from("municipalities")
          .select(
            `
            id,
            name,
            province:provinces!inner(id, name)
          `
          )
          .eq("name", studio.city)
          .maybeSingle();

        const province = locationData?.province as any;

        const data = {
          name: studio.name || "",
          province: province?.name || "",
          provinceId: province?.id || "",
          municipality: studio.city || "",
          municipalityId: locationData?.id || "",
          address: studio.address || "",
        };

        setFormData(data);
        setInitialData(data);
      } catch (error: any) {
        console.error("Error fetching studio:", error);
        toast.error(error.message || "Failed to load studio data");
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Load provinces on mount
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("provinces")
        .select("id, name, imageUrl")
        .eq("isActive", true)
        .order("name");
      if (error) {
        console.error("Error loading provinces:", error);
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
          console.error("Error loading municipalities:", error);
          setMunicipalities([]);
        } else {
          setMunicipalities(data || []);
        }
      }
    })();
  }, [modalStep, selectedProvince, formData.province]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenProvinceModal = () => {
    setModalStep("province");
    setSearch("");
  };

  const handleMunicipalitySelect = (municipality: {
    id: string;
    name: string;
    imageUrl?: string | null;
  }) => {
    setFormData((prev) => ({
      ...prev,
      province: selectedProvince?.name || formData.province,
      provinceId: selectedProvince?.id || formData.provinceId,
      municipality: municipality.name,
      municipalityId: municipality.id,
    }));
    setModalStep(null);
    setSearch("");
  };

  const handleBackInModal = () => {
    if (modalStep === "municipality") {
      setModalStep("province");
      setSearch("");
    } else {
      setModalStep(null);
      setSearch("");
    }
  };

  const topSix = provinces.slice(0, 6);
  const topSixIds = new Set(topSix.map((p) => p.id));
  const isSearching = search.trim().length > 0;

  const listFiltered = (modalStep === "province" ? provinces : municipalities)
    .filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((r) =>
      modalStep === "province" && !isSearching ? !topSixIds.has(r.id) : true
    );

  const displayValue =
    formData.municipality && formData.province
      ? `${formData.province}, ${formData.municipality}`
      : formData.province || "";

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    JSON.stringify(formData) !== JSON.stringify(initialData);

  const canSave =
    formData.name.trim() !== "" &&
    formData.province.trim() !== "" &&
    formData.municipality.trim() !== "" &&
    formData.address.trim() !== "";

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

  const handleSave = async () => {
    if (!canSave || !user?.id) return;

    try {
      setIsLoading(true);

      const result = await updateStudioNameAddress(
        user.id,
        formData.name,
        formData.address,
        formData.municipality
      );

      if (result.success) {
        toast.success("Studio information updated successfully!");
        setInitialData(formData);
        setTimeout(() => {
          router.back();
        }, 500);
      } else {
        toast.error(result.error || "Failed to update studio information");
      }
    } catch (error: any) {
      console.error("Error updating studio:", error);
      toast.error(error.message || "Failed to update studio information");
    } finally {
      setIsLoading(false);
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: mvs(120) }}
          >
            {/* Header */}
            <View
              className="flex-row items-center justify-center relative"
              style={{
                paddingHorizontal: s(16),
                paddingVertical: mvs(16),
                marginBottom: mvs(24),
              }}
            >
              <TouchableOpacity
                onPress={handleBack}
                disabled={isFetching}
                className="absolute rounded-full bg-foreground/20 items-center justify-center"
                style={{
                  width: s(34),
                  height: s(34),
                  left: s(16),
                  padding: s(8),
                }}
              >
                <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
              </TouchableOpacity>
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-white font-bold"
              >
                Studio name and address
              </ScaledText>
            </View>

            {/* Divider */}
            <View
              className="bg-gray"
              style={{ height: s(1), marginBottom: mvs(32) }}
            />

            {/* Content */}
            <View style={{ paddingHorizontal: s(24), gap: mvs(24) }}>
              {/* Studio Name */}
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="body2"
                  className="text-foreground mb-2"
                >
                  Name of the Studio
                  <ScaledText variant="body2" className="text-error">
                    *
                  </ScaledText>
                </ScaledText>
                <ScaledTextInput
                  containerClassName="rounded-xl border border-gray"
                  className="text-foreground"
                  placeholder="Enter studio name"
                  placeholderTextColor="#A49A99"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange("name", value)}
                  editable={!isFetching}
                />
              </View>

              {/* Province & Municipality */}
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="body2"
                  className="text-foreground mb-2"
                >
                  Provincia & Comune
                  <ScaledText variant="body2" className="text-error">
                    *
                  </ScaledText>
                </ScaledText>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={handleOpenProvinceModal}
                  disabled={isFetching}
                  className="rounded-xl border border-gray px-4 py-3"
                  style={{ 
                    paddingVertical: mvs(12), 
                    paddingHorizontal: s(16),
                    opacity: isFetching ? 0.5 : 1,
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="body1"
                    className={displayValue ? "text-foreground" : "text-gray"}
                  >
                    {displayValue || "Select Province and Municipality"}
                  </ScaledText>
                </TouchableOpacity>
              </View>

              {/* Studio Address */}
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="body2"
                  className="text-foreground mb-2"
                >
                  Inserisci l'indirizzo dello Studio dove lavori
                  <ScaledText variant="body2" className="text-error">
                    *
                  </ScaledText>
                </ScaledText>
                <ScaledTextInput
                  containerClassName="rounded-xl border border-gray"
                  className="text-foreground"
                  placeholder="Enter studio address"
                  placeholderTextColor="#A49A99"
                  value={formData.address}
                  onChangeText={(value) => handleInputChange("address", value)}
                  multiline
                  numberOfLines={3}
                  style={{ minHeight: mvs(80), textAlignVertical: "top" }}
                  editable={!isFetching}
                />
              </View>
            </View>
          </KeyboardAwareScrollView>

          {/* Save Button */}
          <View
            style={{
              paddingHorizontal: s(16),
              paddingBottom: mvs(32),
            }}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading || isFetching || !hasUnsavedChanges || !canSave}
              className="rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  isLoading || isFetching || !hasUnsavedChanges || !canSave
                    ? "#6B2C2C"
                    : "#AD2E2E",
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-medium"
              >
                {isLoading ? "Saving..." : "Save"}
              </ScaledText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Selection Modal */}
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
                paddingBottom: mvs(20),
                paddingTop: mvs(70),
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
            <View style={{ paddingHorizontal: s(20), paddingTop: mvs(16) }}>
              <View className="border border-gray rounded-full flex-row items-center">
                <View style={{ paddingLeft: s(16) }}>
                  <SVGIcons.Search className="w-5 h-5 mr-2" />
                </View>
                <ScaledTextInput
                  containerClassName="bg-background"
                  className="text-foreground"
                  style={{
                    backgroundColor: "transparent",
                  }}
                  placeholder={
                    modalStep === "province" ? "Cerca provincia" : "Cerca comune"
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
              style={{
                paddingBottom: mvs(100) + Math.max(insets.bottom, mvs(20)),
                paddingTop: mvs(16),
              }}
              showsVerticalScrollIndicator={false}
            >
              {/* Popular six for province step - only show when not searching */}
              {modalStep === "province" && topSix.length > 0 && !isSearching && (
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
                    {topSix.map((p) => {
                      const active =
                        selectedProvince?.id === p.id ||
                        formData.province === p.name;
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
                  {isSearching
                    ? "Search results"
                    : modalStep === "province"
                      ? "Other provinces"
                      : `Comunes under ${selectedProvince?.name || formData.province || "Selected province"}`}
                </ScaledText>
                {listFiltered.length === 0 ? (
                  <View
                    style={{
                      paddingHorizontal: s(20),
                      paddingVertical: mvs(40),
                    }}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="body2"
                      className="text-gray text-center"
                    >
                      No results found
                    </ScaledText>
                  </View>
                ) : (
                  listFiltered.map((item) => (
                    <Pressable
                      key={item.id}
                      className={`py-4 border-b border-gray/20 ${
                        formData.municipality === item.name &&
                        formData.province === selectedProvince?.name
                          ? "bg-primary"
                          : "bg-[#100C0C]"
                      }`}
                      onPress={() => {
                        if (modalStep === "province") {
                          setSelectedProvince(item);
                          setSearch("");
                        } else {
                          handleMunicipalitySelect(item);
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
                  className={`rounded-full items-center flex-row gap-3 ${
                    selectedProvince ? "bg-primary" : "bg-gray/40"
                  }`}
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
              You have unsaved changes in studio information
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
