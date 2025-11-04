import LocationPicker from "@/components/shared/LocationPicker";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  fetchStudioDetails,
  updateStudioNameAddress,
} from "@/services/studio.service";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  TouchableOpacity,
  View,
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

  const [pickerVisible, setPickerVisible] = useState(false);

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

        const data = {
          name: studio.name || "",
          province: studio.province || "",
          provinceId: studio.provinceId || "",
          municipality: studio.municipality || "",
          municipalityId: studio.municipalityId || "",
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

  // Using shared LocationPicker, no local province/municipality fetching here

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenProvinceModal = () => {
    setPickerVisible(true);
  };

  // Selection handled by LocationPicker
  // Removed local filtering; delegated to LocationPicker

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
        formData.municipalityId
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
                className="text-white font-neueSemibold"
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
                  variant="sm"
                  className="text-tat mb-2 font-montserratSemibold"
                >
                  Name of the Studio
                  <ScaledText variant="sm" className="text-error">
                    *
                  </ScaledText>
                </ScaledText>
                <ScaledTextInput
                  containerClassName="rounded-xl border border-gray"
                  className="text-foreground"
                  placeholder="Enter studio name"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange("name", value)}
                  editable={!isFetching}
                />
              </View>

              {/* Province & Municipality */}
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-tat mb-2 font-montserratSemibold"
                >
                  Provincia & Comune
                  <ScaledText variant="sm" className="text-error">
                    *
                  </ScaledText>
                </ScaledText>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={handleOpenProvinceModal}
                  disabled={isFetching}
                  className="rounded-xl border border-gray bg-tat-foreground"
                  style={{
                    paddingVertical: mvs(12),
                    paddingHorizontal: s(16),
                    opacity: isFetching ? 0.5 : 1,
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className={
                      displayValue
                        ? "text-foreground font-montserratSemibold"
                        : "text-tat-chat font-montserratSemibold"
                    }
                  >
                    {displayValue || "Select Province and Municipality"}
                  </ScaledText>
                </TouchableOpacity>
              </View>

              {/* Studio Address */}
              <View>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-tat mb-2 font-montserratSemibold"
                >
                  Inserisci l'indirizzo dello Studio dove lavori
                  <ScaledText variant="sm" className="text-error">
                    *
                  </ScaledText>
                </ScaledText>
                <ScaledTextInput
                  containerClassName="rounded-xl border border-gray"
                  className="text-foreground"
                  placeholder="Enter studio address"
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
              disabled={
                isLoading || isFetching || !hasUnsavedChanges || !canSave
              }
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
                className="text-foreground font-neueMedium"
              >
                {isLoading ? "Saving..." : "Save"}
              </ScaledText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

      <LocationPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        initialProvinceId={formData.provinceId || null}
        initialMunicipalityId={formData.municipalityId || null}
        onSelect={({ province, provinceId, municipality, municipalityId }) => {
          setFormData((prev) => ({
            ...prev,
            province,
            provinceId,
            municipality,
            municipalityId,
          }));
          setPickerVisible(false);
        }}
      />

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
