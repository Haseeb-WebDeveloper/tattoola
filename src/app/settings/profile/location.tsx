import { LocationCard } from "@/components/settings/LocationCard";
import { FullPageLocationSkeleton } from "@/components/settings/LocationCardSkeleton";
import LocationPicker from "@/components/shared/LocationPicker";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { clearProfileCache } from "@/utils/database";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null
  );

  const isArtist = user?.role === "ARTIST";

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
        toast.error(error.message || "Caricamento delle località non riuscito");
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
    // Tattoo lovers are limited to a single location; allow add only for artists
    // or in the rare case where a tattoo lover has no location yet.
    if (!isArtist && locations.length >= 1) {
      toast.error("Puoi impostare solo una località principale");
      return;
    }

    const newLocation: LocationItem = {
      id: `temp-${Date.now()}`, // Temporary ID until saved
      provinceId: "",
      provinceName: "",
      municipalityId: "",
      municipalityName: "",
      address: "",
      // First location is primary by default; for artists, others start as non‑primary
      isPrimary: locations.length === 0,
      isNew: true,
    };
    setLocations([...locations, newLocation]);
    setEditingLocationId(newLocation.id);
  };

  const handleRemoveLocation = (locationId: string) => {
    setLocationToDelete(locationId);
    setShowDeleteModal(true);
  };

  const confirmRemoveLocation = () => {
    if (!locationToDelete) return;

    const locationToRemove = locations.find(
      (loc) => loc.id === locationToDelete
    );
    const updatedLocations = locations.filter(
      (loc) => loc.id !== locationToDelete
    );

    // For non‑artists we never want to end up with zero locations
    if (!isArtist && updatedLocations.length === 0) {
      toast.error("Devi avere almeno una località");
      setShowDeleteModal(false);
      setLocationToDelete(null);
      return;
    }

    // If we removed the primary location and there are others, make the first one primary
    if (locationToRemove?.isPrimary && updatedLocations.length > 0) {
      updatedLocations[0].isPrimary = true;
    }

    setLocations(updatedLocations);
    setShowDeleteModal(false);
    setLocationToDelete(null);

    // Show toast if it was a saved location (not a new one)
    if (
      locationToRemove &&
      !locationToRemove.isNew &&
      !locationToRemove.id.startsWith("temp-")
    ) {
      toast.success("Posizione rimossa con successo");
    }
  };

  const handleSetPrimary = (locationId: string) => {
    // For tattoo lovers we always treat the single location as primary;
    // there is no need to switch primary between multiple entries.
    if (!isArtist) {
      return;
    }

    const previousPrimary = locations.find((loc) => loc.isPrimary);
    const newPrimary = locations.find((loc) => loc.id === locationId);

    // Only show toast if actually changing primary (not setting the same one)
    if (previousPrimary && previousPrimary.id !== locationId) {
      setLocations(
        locations.map((loc) => ({
          ...loc,
          isPrimary: loc.id === locationId,
        }))
      );
      toast.success("Primary location changed");
    } else if (!previousPrimary && newPrimary) {
      // Setting first primary location
      setLocations(
        locations.map((loc) => ({
          ...loc,
          isPrimary: loc.id === locationId,
        }))
      );
    } else {
      // Already primary, just update state
      setLocations(
        locations.map((loc) => ({
          ...loc,
          isPrimary: loc.id === locationId,
        }))
      );
    }
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
      toast.error("Aggiungi almeno una località");
      return;
    }

    // Validate: All locations must have province and municipality
    const invalidLocations = locations.filter(
      (loc) => !loc.provinceId || !loc.municipalityId
    );
    if (invalidLocations.length > 0) {
      toast.error("Completa tutti i dettagli delle località");
      return;
    }

    // Ensure at least one location is primary
    const hasPrimary = locations.some((loc) => loc.isPrimary);
    if (!hasPrimary && locations.length > 0) {
      locations[0].isPrimary = true;
    }

    // Enforce single‑location rule for tattoo lovers on save.
    let locationsToPersist = locations;
    if (!isArtist && locations.length > 1) {
      locationsToPersist = [
        {
          ...locations[0],
          isPrimary: true,
        },
      ];
    }

    setIsLoading(true);

    try {
      // Delete removed locations
      const removedLocationIds = initialLocations
        .filter(
          (initial) => !locationsToPersist.find((loc) => loc.id === initial.id)
        )
        .map((loc) => loc.id);

      if (removedLocationIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("user_locations")
          .delete()
          .in("id", removedLocationIds);

        if (deleteError) throw deleteError;
      }

      // Track if any new locations were added
      let hasNewLocation = false;

      // Process all locations
      for (const location of locationsToPersist) {
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
          hasNewLocation = true;
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

      // Show appropriate toast message
      if (hasNewLocation) {
        toast.success("Nuova località aggiunta con successo");
      } else {
        toast.success("Località aggiornate con successo");
      }

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating locations:", err);
      toast.error(err.message || "Impossibile aggiornare le località");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          className="relative flex-row items-center justify-center"
          style={{
            paddingHorizontal: s(16),
            paddingVertical: mvs(16),
            marginBottom: mvs(24),
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            className="absolute items-center justify-center rounded-full bg-foreground/20"
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
            Dove ti trovi
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
          style={{ flex: 1, paddingHorizontal: s(16) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: mvs(150) }}
        >
          {loading ? (
            <FullPageLocationSkeleton />
          ) : (
            <>
              {/* Description + layout depend on role */}
              <View style={{ marginBottom: mvs(24) }}>
                {isArtist ? (
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-foreground font-montserratMedium"
                  >
                    In questa sezione puoi aggiungere altre città oltre a{" "}
                    {locations.length > 0 &&
                    locations.find((loc) => loc.isPrimary) ? (
                      <ScaledText
                        allowScaling={false}
                        variant="sm"
                        className="text-foreground font-montserratBold"
                      >
                        {
                          locations.find((loc) => loc.isPrimary)
                            ?.municipalityName
                        }{" "}
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
                        la tua località principale
                      </ScaledText>
                    )}{" "}
                    che hai scelto durante la registrazione
                  </ScaledText>
                ) : (
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-foreground font-montserratMedium"
                  >
                    Seleziona o modifica la tua città principale. Verrà mostrata
                    come "Comune, Provincia" nel tuo profilo.
                  </ScaledText>
                )}
              </View>

              {/* Primary / single location */}
              {locations.filter((loc) => loc.isPrimary).length > 0 && (
                <>
                  <View style={{ marginBottom: mvs(10) }}>
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-gray font-neueLight"
                      style={{ marginBottom: mvs(6) }}
                    >
                      Provincia & Comune
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
                          // Tattoo lovers: single, always-primary location – no delete / primary toggle UI
                          canRemove={isArtist}
                          canSetPrimary={isArtist}
                        />
                      ))}
                  </View>

                  {/* Displayed as info - outside the card */}
                  <View style={{ marginBottom: mvs(24) }}>
                    <ScaledText
                      allowScaling={false}
                      variant="11"
                      className="text-gray font-neueLightItalic"
                    >
                      Visualizzata come "Comune, Provincia"
                    </ScaledText>
                    <ScaledText
                      allowScaling={false}
                      variant="11"
                      className="text-gray font-neueLightItalic"
                      style={{ marginTop: mvs(4) }}
                    >
                      es.: "Battipaglia, Salerno"
                    </ScaledText>
                  </View>
                </>
              )}

              {/* Other Locations + add button only for artists */}
              {isArtist &&
                locations.filter((loc) => loc.isPrimary).length > 0 && (
                  <>
                    <View>
                      <ScaledText
                        allowScaling={false}
                        variant="md"
                        className="text-gray font-neueLight"
                        style={{ marginBottom: mvs(6) }}
                      >
                        Altre località
                      </ScaledText>
                      {locations
                        .filter((loc) => !loc.isPrimary)
                        .map((location, index) => (
                          <LocationCard
                            key={location.id}
                            location={location}
                            isLast={
                              index ===
                              locations.filter((loc) => !loc.isPrimary).length -
                                1
                            }
                            onEdit={() => setEditingLocationId(location.id)}
                            onRemove={() => handleRemoveLocation(location.id)}
                            onSetPrimary={() => handleSetPrimary(location.id)}
                            canRemove={true}
                            canSetPrimary={true}
                          />
                        ))}
                    </View>

                    {/* Add Location Button */}
                    <TouchableOpacity
                      onPress={handleAddLocation}
                      className="flex-row items-center border border-dashed border-gray/50 rounded-xl"
                      style={{
                        paddingVertical: mvs(13),
                        paddingHorizontal: s(13),
                        gap: s(16),
                      }}
                    >
                      <View
                        className="items-center justify-center rounded-full bg-primary"
                        style={{ width: s(24), height: s(24) }}
                      >
                        <SVGIcons.Plus width={s(12)} height={s(12)} />
                      </View>
                      <ScaledText
                        allowScaling={false}
                        variant="sm"
                        className="text-gray font-montserratSemibold"
                      >
                        Aggiungi località
                      </ScaledText>
                    </TouchableOpacity>
                  </>
                )}
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
            className="flex-row items-center justify-center rounded-full"
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
              className="text-foreground font-neueMedium"
            >
              {isLoading ? "Salvataggio..." : "Salva"}
            </ScaledText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setLocationToDelete(null);
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setShowDeleteModal(false);
            setLocationToDelete(null);
          }}
          className="items-center justify-center flex-1"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
        >
          <View
            className="bg-[#fff] rounded-xl max-w-[90vw]"
            style={{
              // Use percentage width so we always have side margins on small screens
              width: "88%",
              paddingHorizontal: s(24),
              paddingVertical: mvs(28),
            }}
          >
            <View className="items-center" style={{ marginBottom: mvs(16) }}>
              <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
            </View>
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-center text-background font-neueBold"
              style={{ marginBottom: mvs(6) }}
            >
              Rimuovere la località?
            </ScaledText>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-center text-background font-montserratSemibold"
              style={{ marginBottom: mvs(20) }}
            >
              Questa località verrà rimossa dal tuo profilo.
            </ScaledText>
            <View className="justify-center" style={{ rowGap: mvs(8) }}>
              <TouchableOpacity
                onPress={confirmRemoveLocation}
                className="flex-row items-center justify-center rounded-full border-primary"
                style={{
                  width: "100%",
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                  borderWidth: s(1),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-primary font-montserratSemibold"
                >
                  Rimuovi
                </ScaledText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteModal(false);
                  setLocationToDelete(null);
                }}
                className="flex-row items-center justify-center rounded-full"
                style={{
                  width: "100%",
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-gray font-montserratSemibold"
                >
                  Annulla
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Unsaved Changes Modal */}
      <Modal
        visible={showUnsavedModal}
        transparent
        animationType="fade"
        onRequestClose={handleContinueEditing}
      >
        <View
          className="items-center justify-center flex-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <View
            className="bg-[#fff] rounded-xl"
            style={{
              // Use percentage width so we always have side margins on small screens
              width: "88%",
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
              className="text-center text-background font-neueBold"
              style={{ marginBottom: mvs(4) }}
            >
              Hai modifiche non salvate nelle località
            </ScaledText>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-center text-background font-montserratMedium"
              style={{ marginBottom: mvs(32) }}
            >
              Vuoi scartarle?
            </ScaledText>

            {/* Action Buttons */}
            <View style={{ rowGap: mvs(8) }}>
              {/* Continue Editing Button */}
              <TouchableOpacity
                onPress={handleContinueEditing}
                className="flex-row items-center justify-center border-2 rounded-full"
                style={{
                  width: "100%",
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
                  Continua a modificare
                </ScaledText>
              </TouchableOpacity>

              {/* Discard Changes Button */}
              <TouchableOpacity
                onPress={handleDiscardChanges}
                className="items-center justify-center rounded-full"
                style={{
                  width: "100%",
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
                  Scarta le modifiche
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
          onClose={(shouldRemove) => {
            const location = locations.find(
              (loc) => loc.id === editingLocationId
            );
            // If it's a new location (temp ID) and should be removed (no data saved), remove it
            if (
              shouldRemove &&
              location &&
              (location.id.startsWith("temp-") || location.isNew)
            ) {
              setLocations(
                locations.filter((loc) => loc.id !== editingLocationId)
              );
            }
            setEditingLocationId(null);
          }}
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
  onClose: (shouldRemove?: boolean) => void;
  onSave: (updates: Partial<LocationItem>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Store initial values to detect changes
  const initialProvince = location.provinceId
    ? {
        id: location.provinceId,
        name: location.provinceName,
        imageUrl: null,
      }
    : null;
  const initialMunicipality = location.municipalityId
    ? {
        id: location.municipalityId,
        name: location.municipalityName,
      }
    : null;
  const initialAddress = location.address || "";

  const [selectedProvince, setSelectedProvince] = useState<{
    id: string;
    name: string;
    imageUrl?: string | null;
  } | null>(initialProvince);
  const [selectedMunicipality, setSelectedMunicipality] = useState<{
    id: string;
    name: string;
  } | null>(initialMunicipality);
  const [address, setAddress] = useState(initialAddress);

  // Check if there are unsaved changes
  const hasChanges =
    selectedProvince?.id !== initialProvince?.id ||
    selectedMunicipality?.id !== initialMunicipality?.id ||
    address.trim() !== initialAddress.trim();

  const displayValue =
    selectedProvince && selectedMunicipality
      ? `${selectedMunicipality.name}, ${selectedProvince.name}`
      : "Select location";

  const handleClose = () => {
    if (hasChanges) {
      setShowDiscardModal(true);
    } else {
      // If it's a new location with no data, remove it
      const isNewLocation = location.id.startsWith("temp-") || location.isNew;
      const hasNoData = !selectedProvince || !selectedMunicipality;
      onClose(isNewLocation && hasNoData);
    }
  };

  const handleDiscard = () => {
    setShowDiscardModal(false);
    // If it's a new location, always remove it when discarding
    const isNewLocation = location.id.startsWith("temp-") || location.isNew;
    onClose(isNewLocation);
  };

  const handleContinueEditing = () => {
    setShowDiscardModal(false);
  };

  const handleSave = () => {
    if (!selectedProvince || !selectedMunicipality) {
      toast.error("Seleziona sia la provincia che il comune");
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
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50">
        <View
          className="flex-1 bg-black rounded-t-3xl"
          style={{ marginTop: "auto" }}
        >
          {/* Header */}
          <View
            className="relative flex-row items-center justify-between border-b border-gray bg-primary/30"
            style={{
              paddingBottom: mvs(20),
              paddingTop: mvs(70),
              paddingHorizontal: s(20),
            }}
          >
            <TouchableOpacity
              onPress={handleClose}
              className="items-center justify-center rounded-full bg-foreground/20"
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
              Edit Location
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
            {/* Main edit view */}
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
                  onPress={() => setPickerVisible(true)}
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
                  Indirizzo (facoltativo)
                </ScaledText>
                <ScaledTextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Via A.G. Alaimo 139"
                  className="text-foreground"
                  containerClassName="rounded-xl border border-gray bg-[#100C0C]"
                />
              </View>
            </View>
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
            <TouchableOpacity
              onPress={handleSave}
              disabled={!selectedProvince || !selectedMunicipality}
              className="items-center justify-center rounded-full"
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
                className="text-foreground font-neueMedium"
              >
                Salva
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Discard Changes Confirmation Modal */}
      <Modal
        visible={showDiscardModal}
        transparent
        animationType="fade"
        onRequestClose={handleContinueEditing}
      >
        <View
          className="items-center justify-center flex-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <View
            className="bg-[#fff] rounded-xl"
            style={{
              width: "88%",
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
              className="text-center text-background font-neueBold"
              style={{ marginBottom: mvs(4) }}
            >
              Scartare le modifiche?
            </ScaledText>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-center text-background font-montserratMedium"
              style={{ marginBottom: mvs(32) }}
            >
              Hai selezionato una località ma non l'hai salvata. Vuoi scartare
              le modifiche?
            </ScaledText>

            {/* Action Buttons */}
            <View style={{ rowGap: mvs(8) }}>
              {/* Continue Editing Button */}
              <TouchableOpacity
                onPress={handleContinueEditing}
                className="flex-row items-center justify-center border-2 rounded-full"
                style={{
                  width: "100%",
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
                  Continua a modificare
                </ScaledText>
              </TouchableOpacity>

              {/* Discard Changes Button */}
              <TouchableOpacity
                onPress={handleDiscard}
                className="items-center justify-center rounded-full"
                style={{
                  width: "100%",
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
                  Scarta le modifiche
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Shared LocationPicker */}
      <LocationPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        initialProvinceId={selectedProvince?.id || null}
        initialMunicipalityId={selectedMunicipality?.id || null}
        onSelect={({ province, provinceId, municipality, municipalityId }) => {
          setSelectedProvince({
            id: provinceId,
            name: province,
            imageUrl: null,
          });
          setSelectedMunicipality({ id: municipalityId, name: municipality });
          setPickerVisible(false);
        }}
      />
    </Modal>
  );
}
