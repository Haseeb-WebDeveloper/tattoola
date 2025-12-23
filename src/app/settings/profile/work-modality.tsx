import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { WorkArrangement } from "@/types/auth";
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
import { toast } from "sonner-native";

const OPTIONS: { key: WorkArrangement; label: string }[] = [
  {
    key: "FREELANCE" as WorkArrangement,
    label: "Sono un Tattoo Artist che lavora freelance",
  },
  {
    key: "STUDIO_EMPLOYEE" as WorkArrangement,
    label: "Sono un Tattoo Artist che lavora in uno studio",
  },
  {
    key: "STUDIO_OWNER" as WorkArrangement,
    label: "Sono il titolare del mio studio",
  },
];

export default function WorkModalitySettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<WorkArrangement | null>(
    null
  );
  const [initialOption, setInitialOption] = useState<WorkArrangement | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [artistId, setArtistId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        if (!user?.id) return;

        // Fetch artist profile to get workArrangement
        const { data: profileData, error: profileError } = await supabase
          .from("artist_profiles")
          .select("id, workArrangement")
          .eq("userId", user.id)
          .single();

        if (profileError || !profileData) {
          throw new Error("Profilo artista non trovato");
        }

        if (mounted) {
          setArtistId(profileData.id);
          setSelectedOption(profileData.workArrangement as WorkArrangement);
          setInitialOption(profileData.workArrangement as WorkArrangement);
        }
      } catch (error: any) {
        console.error("Error loading work modality:", error);
        toast.error(
          error.message || "Caricamento della modalità di lavoro non riuscito"
        );
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
  const hasUnsavedChanges = selectedOption !== initialOption;

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
    if (!artistId || !selectedOption || !hasUnsavedChanges) {
      router.back();
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("artist_profiles")
        .update({ workArrangement: selectedOption })
        .eq("id", artistId);

      if (error) throw error;

      // Clear profile cache to force refresh
      await clearProfileCache(user!.id);

      toast.success("Modalità di lavoro aggiornata con successo");

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating work modality:", err);
      toast.error(
        err.message || "Impossibile aggiornare la modalità di lavoro"
      );
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
            Modalità di lavoro
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
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(100),
          }}
        >
          {loading ? (
            // Loading skeleton
            <View style={{ rowGap: mvs(8) }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <View
                  key={i}
                  className="rounded-xl border border-gray bg-[#100C0C]"
                  style={{
                    paddingHorizontal: s(12),
                    paddingVertical: mvs(16),
                    opacity: 0.5,
                  }}
                >
                  <View className="flex-row items-center" style={{ gap: s(8) }}>
                    <View
                      className="rounded-full bg-gray/30"
                      style={{ width: s(24), height: s(24) }}
                    />
                    <View
                      className="bg-gray/30 rounded flex-1"
                      style={{ height: s(16) }}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ rowGap: mvs(8) }}>
              {OPTIONS.map((opt) => {
                const active = selectedOption === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setSelectedOption(opt.key)}
                    className={`rounded-xl border ${active ? "border-foreground" : "border-gray"} bg-[#100C0C]`}
                    style={{
                      paddingHorizontal: s(12),
                      paddingVertical: mvs(16),
                    }}
                  >
                    <View
                      className="flex-row items-center"
                      style={{ gap: s(8) }}
                    >
                      {active ? (
                        <SVGIcons.CircleCheckedCheckbox
                          width={s(24)}
                          height={s(24)}
                        />
                      ) : (
                        <SVGIcons.CircleUncheckedCheckbox
                          width={s(24)}
                          height={s(24)}
                        />
                      )}
                      <ScaledText
                        allowScaling={false}
                        variant="sm"
                        className="text-foreground font-montserratMedium flex-1"
                        style={{ flexShrink: 1, flexWrap: "wrap" }}
                      >
                        {opt.label}
                      </ScaledText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View
          className="bg-background/[80%] backdrop-blur-xl"
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
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", paddingHorizontal: s(16) }}
        >
          <View
            className="bg-[#fff] rounded-xl"
            style={{
              width: "100%",
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
              Hai modifiche non salvate nella modalità di lavoro
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
            <View style={{ gap: mvs(12) }} className="flex-col justify-center">
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

