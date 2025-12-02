import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
    fetchArtistServices,
    fetchServices,
    ServiceItem,
    updateArtistServices,
} from "@/services/services.service";
import { clearProfileCache } from "@/utils/database";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { toast } from "sonner-native";

function ServiceSkeleton() {
  return (
    <View
      className="flex-row items-center border-b border-gray/20"
      style={{ paddingHorizontal: s(20), paddingVertical: mvs(16) }}
    >
      <View
        className="rounded bg-gray/30"
        style={{ width: s(18), height: s(18), marginRight: s(16) }}
      />
      <View className="flex-1">
        <View
          className="bg-gray/30 rounded"
          style={{ width: s(120), height: s(16) }}
        />
      </View>
    </View>
  );
}

export default function ServicesSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [initialSelectedServices, setInitialSelectedServices] = useState<
    string[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [artistId, setArtistId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        if (!user?.id) return;

        // Fetch artist profile to get artistId
        const { data: profileData, error: profileError } = await supabase
          .from("artist_profiles")
          .select("id")
          .eq("userId", user.id)
          .single();

        if (profileError || !profileData) {
          throw new Error("Profilo artista non trovato");
        }

        const artistProfileId = profileData.id;
        setArtistId(artistProfileId);

        // Fetch all services and artist's selected services in parallel
        const [allServices, artistServiceIds] = await Promise.all([
          fetchServices(),
          fetchArtistServices(artistProfileId),
        ]);

        if (mounted) {
          setServices(allServices);
          setSelectedServices(artistServiceIds);
          setInitialSelectedServices(artistServiceIds);
        }
      } catch (error: any) {
        console.error("Error loading services:", error);
        toast.error(error.message || "Caricamento dei servizi non riuscito");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    JSON.stringify([...selectedServices].sort()) !==
    JSON.stringify([...initialSelectedServices].sort());

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

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const canProceed = selectedServices.length >= 1;

  const handleSave = async () => {
    if (!artistId || !hasUnsavedChanges) {
      router.back();
      return;
    }

    setIsLoading(true);

    try {
      await updateArtistServices(artistId, selectedServices);

      // Clear profile cache to force refresh
      await clearProfileCache(user!.id);

      toast.success("Servizi aggiornati con successo");

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating services:", err);
      toast.error(err.message || "Impossibile aggiornare i servizi");
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ServiceItem }) => {
    const isSelected = selectedServices.includes(item.id);

    return (
      <View
        className="flex-row items-center border-b border-gray/20"
        style={{ paddingHorizontal: s(16), paddingVertical: mvs(16), gap: s(8) }}
      >
        <Pressable
          className="items-center"
          style={{ width: s(40) }}
          onPress={() => toggleService(item.id)}
        >
          {isSelected ? (
            <SVGIcons.CheckedCheckbox style={{ width: s(20), height: s(20) }} />
          ) : (
            <SVGIcons.UncheckedCheckbox
              style={{ width: s(20), height: s(20) }}
            />
          )}
        </Pressable>
        <View className="flex-1">
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-foreground font-montserratMedium"
          >
            {item.name}
          </ScaledText>
        </View>
      </View>
    );
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
            className="text-white font-neueSemibold"
          >
            Servizi offerti
          </ScaledText>
        </View>

        {/* Divider */}
        <View
          className="bg-gray"
          style={{
            height: s(1),
            marginBottom: mvs(24),
            marginHorizontal: s(16),
          }}
        />

        {/* Subtitle */}
        <View style={{ paddingHorizontal: s(16), marginBottom: mvs(16) }}>
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-white font-neueSemibold"
          >
            Seleziona i servizi
          </ScaledText>
        </View>

        {/* Services List */}
        <View className="flex-1">
          {loading ? (
            <ScrollView
              contentContainerStyle={{
                paddingBottom: mvs(100),
              }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <ServiceSkeleton key={i} />
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={services}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: mvs(100),
              }}
            />
          )}
        </View>

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
            disabled={isLoading || loading || !hasUnsavedChanges}
            className="rounded-full items-center justify-center flex-row"
            style={{
              backgroundColor:
                isLoading || loading || !hasUnsavedChanges
                  ? "#6B2C2C"
                  : "#AD2E2E",
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
              Hai modifiche non salvate nei servizi
            </ScaledText>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-background font-montserratMedium text-center"
              style={{ marginBottom: mvs(32) }}
            >
              Vuoi scartarle?
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
                  Continua a modificare
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
                  Scarta le modifiche
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

