import { LocationCard } from "@/components/settings/LocationCard";
import { FullPageLocationSkeleton } from "@/components/settings/LocationCardSkeleton";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { getMunicipalities, getProvinces } from "@/services/location.service";
import { clearProfileCache } from "@/utils/database";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { v4 as uuidv4 } from "uuid";

type LocationItem = {
  id: string;
  provinceId: string;
  provinceName: string;
  municipalityId: string;
  municipalityName: string;
  address?: string;
  isPrimary: boolean;
  isNew?: boolean; // Track if this is a newly added location
};

export default function LocationSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [initialLocations, setInitialLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null
  );

  // Load user locations
  useEffect(() => {
    let mounted = true;

    const loadLocations = async () => {
      try {
        if (!user?.id) return;

        const { data, error } = await supabase
          .from("user_locations")
          .select(
            `
            id,
            provinceId,
            municipalityId,
            address,
            isPrimary,
            provinces(id, name),
            municipalities(id, name)
          `
          )
          .eq("userId", user.id)
          .order("isPrimary", { ascending: false });

        if (error) throw error;

        if (mounted && data) {
          const mappedLocations: LocationItem[] = data.map((loc: any) => ({
            id: loc.id,
            provinceId: loc.provinceId,
            provinceName: loc.provinces?.name || "",
            municipalityId: loc.municipalityId,
            municipalityName: loc.municipalities?.name || "",
            address: loc.address,
            isPrimary: loc.isPrimary,
          }));

          setLocations(mappedLocations);
          setInitialLocations(JSON.parse(JSON.stringify(mappedLocations)));
        }
      } catch (error: any) {
        console.error("Error loading locations:", error);
        toast.error(error.message || "Failed to load locations");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadLocations();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    JSON.stringify(locations) !== JSON.stringify(initialLocations);

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

  const handleAddLocation = () => {
    const newLocation: LocationItem = {
      id: `temp-${Date.now()}`, // Temporary ID until saved
      provinceId: "",
      provinceName: "",
      municipalityId: "",
      municipalityName: "",
      address: "",
      isPrimary: locations.length === 0, // First location is primary by default
      isNew: true,
    };
    setLocations([...locations, newLocation]);
    setEditingLocationId(newLocation.id);
  };

  const handleRemoveLocation = (locationId: string) => {
    const updatedLocations = locations.filter((loc) => loc.id !== locationId);

    // If we removed the primary location and there are others, make the first one primary
    if (
      locations.find((loc) => loc.id === locationId)?.isPrimary &&
      updatedLocations.length > 0
    ) {
      updatedLocations[0].isPrimary = true;
    }

    setLocations(updatedLocations);
  };

  const handleSetPrimary = (locationId: string) => {
    setLocations(
      locations.map((loc) => ({
        ...loc,
        isPrimary: loc.id === locationId,
      }))
    );
  };

  const handleUpdateLocation = (
    locationId: string,
    updates: Partial<LocationItem>
  ) => {
    setLocations(
      locations.map((loc) =>
        loc.id === locationId ? { ...loc, ...updates } : loc
      )
    );
  };

  const handleSave = async () => {
    if (!user?.id || !hasUnsavedChanges) {
      router.back();
      return;
    }

    // Validate: At least one location must exist
    if (locations.length === 0) {
      toast.error("Please add at least one location");
      return;
    }

    // Validate: All locations must have province and municipality
    const invalidLocations = locations.filter(
      (loc) => !loc.provinceId || !loc.municipalityId
    );
    if (invalidLocations.length > 0) {
      toast.error("Please complete all location details");
      return;
    }

    // Ensure at least one location is primary
    const hasPrimary = locations.some((loc) => loc.isPrimary);
    if (!hasPrimary && locations.length > 0) {
      locations[0].isPrimary = true;
    }

    setIsLoading(true);

    try {
      // Delete removed locations
      const removedLocationIds = initialLocations
        .filter((initial) => !locations.find((loc) => loc.id === initial.id))
        .map((loc) => loc.id);

      if (removedLocationIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("user_locations")
          .delete()
          .in("id", removedLocationIds);

        if (deleteError) throw deleteError;
      }

      // Process all locations
      for (const location of locations) {
        const locationData = {
          userId: user.id,
          provinceId: location.provinceId,
          municipalityId: location.municipalityId,
          address: location.address || null,
          isPrimary: location.isPrimary,
          updatedAt: new Date().toISOString(),
        };

        if (location.isNew || location.id.startsWith("temp-")) {
          // Insert new location
          const { error: insertError } = await supabase
            .from("user_locations")
            .insert({
              id: uuidv4(),
              ...locationData,
              createdAt: new Date().toISOString(),
            });

          if (insertError) throw insertError;
        } else {
          // Update existing location
          const { error: updateError } = await supabase
            .from("user_locations")
            .update(locationData)
            .eq("id", location.id);

          if (updateError) throw updateError;
        }
      }

      // Clear profile cache to force refresh
      await clearProfileCache(user.id);

      toast.success("Locations updated successfully");

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating locations:", err);
      toast.error(err.message || "Failed to update locations");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
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
            Multilocations
          </ScaledText>
        </View>

        {/* Divider */}
        <View
          className="bg-gray"
          style={{
            height: s(1),
            marginBottom: mvs(32),
            marginHorizontal: s(16),
          }}
        />

        {/* Content */}
        <ScrollView
          className="flex-1"
          style={{ paddingHorizontal: s(16) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: mvs(150) }}
        >
          {loading ? (
            <FullPageLocationSkeleton />
          ) : (
            <>
              {/* Description */}
              <View style={{ marginBottom: mvs(24) }}>
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-foreground font-montserratMedium"
                >
                  In this section you can add other cities in addition to{" "}
                  {locations.length > 0 &&
                  locations.find((loc) => loc.isPrimary) ? (
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-foreground font-montserratBold"
                    >
                      {locations.find((loc) => loc.isPrimary)?.municipalityName}{" "}
                      (
                      {locations
                        .find((loc) => loc.isPrimary)
                        ?.provinceName?.substring(0, 2)
                        ?.toUpperCase()}
                      )
                    </ScaledText>
                  ) : (
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-foreground font-montserratBold"
                    >
                      your primary location
                    </ScaledText>
                  )}{" "}
                  that you chose during registration
                </ScaledText>
              </View>

              {/* Primary Location */}
              {locations.filter((loc) => loc.isPrimary).length > 0 && (
                <>
                  <View style={{ marginBottom: mvs(10) }}>
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-gray font-light"
                      style={{ marginBottom: mvs(6) }}
                    >
                      Primary location
                    </ScaledText>
                    {locations
                      .filter((loc) => loc.isPrimary)
                      .map((location) => (
                        <LocationCard
                          key={location.id}
                          location={location}
                          onEdit={() => setEditingLocationId(location.id)}
                          onRemove={() => handleRemoveLocation(location.id)}
                          onSetPrimary={() => handleSetPrimary(location.id)}
                        />
                      ))}
                  </View>

                  {/* Displayed as info - outside the card */}
                  <View style={{ marginBottom: mvs(24) }}>
                    <ScaledText
                      allowScaling={false}
                      variant="11"
                      className="text-gray font-normal italic"
                    >
                      Displayed as "Comune, Province"
                    </ScaledText>
                    <ScaledText
                      allowScaling={false}
                      variant="11"
                      className="text-gray font-normal italic"
                      style={{ marginTop: mvs(4) }}
                    >
                      eg : "Battipaglia, Salerno"
                    </ScaledText>
                  </View>
                </>
              )}

              {/* Other Locations - Always show header if we have a primary location */}
              {locations.filter((loc) => loc.isPrimary).length > 0 && (
                <View style={{ marginBottom: mvs(24) }}>
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-light"
                    style={{ marginBottom: mvs(6) }}
                  >
                    Other locations
                  </ScaledText>
                  {locations
                    .filter((loc) => !loc.isPrimary)
                    .map((location) => (
                      <LocationCard
                        key={location.id}
                        location={location}
                        onEdit={() => setEditingLocationId(location.id)}
                        onRemove={() => handleRemoveLocation(location.id)}
                        onSetPrimary={() => handleSetPrimary(location.id)}
                      />
                    ))}
                </View>
              )}

              {/* Add Location Button */}
              <TouchableOpacity
                onPress={handleAddLocation}
                className="border border-dashed border-gray/50 rounded-xl items-center  flex-row"
                style={{
                  paddingVertical: mvs(13),
                  paddingHorizontal: s(13),
                  gap: s(16),
                }}
              >
                <View
                  className="bg-primary rounded-full items-center justify-center"
                  style={{ width: s(24), height: s(24) }}
                >
                  <SVGIcons.Plus width={s(12)} height={s(12)} />
                </View>
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-montserratSemibold"
                >
                  Add locations
                </ScaledText>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/* Save Button */}
        <View
          className="bg-background/90 backdrop-blur-xl"
          style={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
            paddingTop: mvs(16),
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !hasUnsavedChanges}
            className="rounded-full items-center justify-center flex-row"
            style={{
              backgroundColor:
                isLoading || !hasUnsavedChanges ? "#6B2C2C" : "#AD2E2E",
              paddingVertical: mvs(10.5),
              paddingLeft: s(18),
              paddingRight: s(20),
              gap: s(8),
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : null}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-medium"
            >
              {isLoading ? "Saving..." : "Save"}
            </ScaledText>
          </TouchableOpacity>
        </View>
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
              You have unsaved changes in locations
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

      {/* Location Edit Modal */}
      {editingLocationId && (
        <LocationEditModal
          location={locations.find((loc) => loc.id === editingLocationId)!}
          onClose={() => setEditingLocationId(null)}
          onSave={(updates) => {
            handleUpdateLocation(editingLocationId, updates);
            setEditingLocationId(null);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

// Location Edit Modal Component
function LocationEditModal({
  location,
  onClose,
  onSave,
}: {
  location: LocationItem;
  onClose: () => void;
  onSave: (updates: Partial<LocationItem>) => void;
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
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<{
    id: string;
    name: string;
    imageUrl?: string | null;
  } | null>(
    location.provinceId
      ? {
          id: location.provinceId,
          name: location.provinceName,
          imageUrl: null,
        }
      : null
  );
  const [selectedMunicipality, setSelectedMunicipality] = useState<{
    id: string;
    name: string;
  } | null>(
    location.municipalityId
      ? {
          id: location.municipalityId,
          name: location.municipalityName,
        }
      : null
  );
  const [address, setAddress] = useState(location.address || "");

  useEffect(() => {
    if (modalStep === "province" && provinces.length === 0) {
      getProvinces()
        .then(setProvinces)
        .catch(() => setProvinces([]));
    }
  }, [modalStep]);

  useEffect(() => {
    if (modalStep === "municipality" && selectedProvince) {
      setLoadingMunicipalities(true);
      setMunicipalities([]); // Clear previous municipalities
      getMunicipalities(selectedProvince.id)
        .then((data) => {
          setMunicipalities(data);
        })
        .catch((err) => {
          console.error("Error loading municipalities:", err);
          setMunicipalities([]);
          toast.error("Failed to load municipalities");
        })
        .finally(() => {
          setLoadingMunicipalities(false);
        });
    }
  }, [modalStep, selectedProvince]);

  const topSix = provinces.slice(0, 6);
  const topSixIds = new Set(topSix.map((p) => p.id));
  const isSearching = search.trim().length > 0;

  const sourceList = modalStep === "province" ? provinces : municipalities;

  const listFiltered = sourceList
    .filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((r) =>
      modalStep === "province" && !isSearching ? !topSixIds.has(r.id) : true
    );

  const displayValue =
    selectedProvince && selectedMunicipality
      ? `${selectedMunicipality.name}, ${selectedProvince.name}`
      : "Select location";

  const handleSave = () => {
    if (!selectedProvince || !selectedMunicipality) {
      toast.error("Please select both province and municipality");
      return;
    }

    onSave({
      provinceId: selectedProvince.id,
      provinceName: selectedProvince.name,
      municipalityId: selectedMunicipality.id,
      municipalityName: selectedMunicipality.name,
      address: address.trim() || undefined,
    });
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      onRequestClose={onClose}
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
              onPress={onClose}
              className="rounded-full bg-foreground/20 items-center justify-center"
              style={{
                width: s(30),
                height: s(30),
              }}
            >
              <SVGIcons.Close width={s(10)} height={s(10)} />
            </TouchableOpacity>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground font-neueBold"
            >
              {modalStep
                ? modalStep === "province"
                  ? "Seleziona la provincia"
                  : "Seleziona il comune"
                : "Edit Location"}
            </ScaledText>
            <View style={{ width: s(30) }} />
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingBottom: mvs(100) + Math.max(insets.bottom, mvs(20)),
            }}
          >
            {!modalStep ? (
              // Main edit view
              <View style={{ padding: s(20), gap: mvs(20) }}>
                {/* Location Selector */}
                <View>
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-gray font-montserratSemibold"
                    style={{ marginBottom: mvs(8) }}
                  >
                    Province and Municipality
                  </ScaledText>
                  <TouchableOpacity
                    onPress={() => setModalStep("province")}
                    className="rounded-xl border border-gray bg-[#100C0C] px-4 py-3"
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className={
                        selectedProvince ? "text-foreground" : "text-[#A49A99]"
                      }
                    >
                      {displayValue}
                    </ScaledText>
                  </TouchableOpacity>
                </View>

                {/* Address (Optional) */}
                <View>
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-gray font-montserratSemibold"
                    style={{ marginBottom: mvs(8) }}
                  >
                    Address (Optional)
                  </ScaledText>
                  <ScaledTextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Via A.G. Alaimo 139"
                    placeholderTextColor="#A49A99"
                    className="text-foreground"
                    containerClassName="rounded-xl border border-gray bg-[#100C0C]"
                  />
                </View>
              </View>
            ) : (
              // Province/Municipality selection view
              <View>
                {/* Selected province pill */}
                {modalStep === "municipality" && selectedProvince && (
                  <View
                    className="flex-row items-center justify-between bg-[#100C0C]"
                    style={{
                      paddingTop: mvs(6),
                      paddingHorizontal: s(16),
                    }}
                  >
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
                        <ScaledText
                          allowScaling={false}
                          variant="body1"
                          className="text-foreground"
                        >
                          Province:{" "}
                          <ScaledText
                            allowScaling={false}
                            variant="body1"
                            className="font-neueBold"
                          >
                            {selectedProvince.name}
                          </ScaledText>
                        </ScaledText>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setModalStep("province");
                        setSearch("");
                      }}
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
                    marginTop: mvs(12),
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

                {/* Popular six for province */}
                {modalStep === "province" &&
                  topSix.length > 0 &&
                  !isSearching && (
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
                          const active = selectedProvince?.id === p.id;
                          return (
                            <TouchableOpacity
                              key={p.id}
                              onPress={() => {
                                setSelectedProvince(p);
                                setSearch("");
                              }}
                              style={{ width: "32%", overflow: "hidden" }}
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
                    variant="body1"
                    className="px-6 mb-2 text-gray font-semibold"
                  >
                    {isSearching
                      ? `Search results${listFiltered.length > 0 ? ` (${listFiltered.length})` : ""}`
                      : modalStep === "province"
                        ? "Other provinces"
                        : `Comunes under ${selectedProvince?.name || ""}`}
                  </ScaledText>

                  {/* Loading state for municipalities - show 6 skeleton items */}
                  {modalStep === "municipality" && loadingMunicipalities ? (
                    <View>
                      {[...Array(6)].map((_, idx) => (
                        <View
                          key={idx}
                          className="py-4 border-b border-gray/20 bg-[#100C0C]"
                        >
                          <View className="flex-row items-center gap-3 px-6">
                            <View
                              style={{
                                width: 112,
                                height: 14,
                                borderRadius: 7,
                                backgroundColor: "#262626",
                              }}
                              className="animate-pulse"
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : listFiltered.length === 0 && isSearching ? (
                    <View className="py-8 px-6">
                      <ScaledText
                        allowScaling={false}
                        variant="body1"
                        className="text-gray text-center"
                      >
                        No results found for "{search}"
                      </ScaledText>
                    </View>
                  ) : listFiltered.length === 0 ? (
                    <View className="py-8 px-6">
                      <ScaledText
                        allowScaling={false}
                        variant="body1"
                        className="text-gray text-center"
                      >
                        No{" "}
                        {modalStep === "province"
                          ? "provinces"
                          : "municipalities"}{" "}
                        available
                      </ScaledText>
                    </View>
                  ) : (
                    listFiltered.map((item) => (
                      <Pressable
                        key={item.id}
                        className={`py-4 border-b border-gray/20 ${selectedMunicipality?.id === item.id && selectedProvince?.id === selectedProvince?.id ? "bg-primary" : "bg-[#100C0C]"}`}
                        onPress={() => {
                          if (modalStep === "province") {
                            setSelectedProvince(item);
                            setSearch("");
                          } else {
                            setSelectedMunicipality(item);
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
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View
            className="bg-background/50"
            style={{
              paddingHorizontal: s(24),
              marginTop: mvs(12),
              paddingBottom: mvs(16) + Math.max(insets.bottom, mvs(20)),
            }}
          >
            {!modalStep ? (
              <TouchableOpacity
                onPress={handleSave}
                disabled={!selectedProvince || !selectedMunicipality}
                className="rounded-full items-center justify-center"
                style={{
                  backgroundColor:
                    !selectedProvince || !selectedMunicipality
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
                  Save
                </ScaledText>
              </TouchableOpacity>
            ) : (
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => {
                    if (modalStep === "municipality") {
                      setModalStep("province");
                    } else {
                      setModalStep(null);
                    }
                    setSearch("");
                  }}
                  className="flex-1 rounded-full border border-gray items-center justify-center"
                  style={{
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
                    Back
                  </ScaledText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
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
                  disabled={modalStep === "province" && !selectedProvince}
                  className="flex-1 rounded-full items-center justify-center"
                  style={{
                    backgroundColor:
                      modalStep === "province" && !selectedProvince
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
                    Next
                  </ScaledText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
