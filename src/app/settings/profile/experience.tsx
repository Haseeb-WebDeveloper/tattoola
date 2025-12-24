import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { clearProfileCache } from "@/utils/database";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    TouchableOpacity,
    View,
} from "react-native";
import { toast } from "sonner-native";

export default function ExperienceSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [initialYear, setInitialYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [artistId, setArtistId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => currentYear - i); // Last 60 years

  const snapPoints = useMemo(() => ["50%"], []);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        if (!user?.id) return;

        // Fetch artist profile
        const { data: profileData, error: profileError } = await supabase
          .from("artist_profiles")
          .select("id, yearsExperience")
          .eq("userId", user.id)
          .single();

        if (profileError || !profileData) {
          throw new Error("Profilo artista non trovato");
        }

        if (mounted) {
          setArtistId(profileData.id);
          const year = profileData.yearsExperience
            ? currentYear - profileData.yearsExperience
            : null;
          setSelectedYear(year);
          setInitialYear(year);
        }
      } catch (error: any) {
        console.error("Error loading experience:", error);
        toast.error(error.message || "Caricamento dell'esperienza non riuscito");
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
  }, [user?.id, currentYear]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = selectedYear !== initialYear;

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

  const handleOpenYearPicker = () => {
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    bottomSheetRef.current?.close();
  };

  const handleSave = async () => {
    if (!artistId || !hasUnsavedChanges) {
      router.back();
      return;
    }

    setIsLoading(true);

    try {
      const yearsOfExperience = selectedYear
        ? currentYear - selectedYear
        : null;

      const { error } = await supabase
        .from("artist_profiles")
        .update({
          yearsExperience: yearsOfExperience,
        })
        .eq("id", artistId);

      if (error) throw error;

      // Clear profile cache to force refresh
      await clearProfileCache(user!.id);

      toast.success("Esperienza aggiornata con successo");

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating experience:", err);
      toast.error(
        err.message || "Impossibile aggiornare l'esperienza"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
        pressBehavior="close"
        enableTouchThrough={false}
      />
    ),
    []
  );

  const yearsOfExperience = selectedYear ? currentYear - selectedYear : 0;

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
            Esperienza
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
        <View
          style={{
            paddingHorizontal: s(16),
            flex: 1,
          }}
        >
          {loading ? (
            <>
              {/* Loading Skeleton */}
              <View
                className="bg-gray/30 rounded"
                style={{
                  width: "60%",
                  height: s(18),
                  marginBottom: mvs(16),
                }}
              />
              <View
                className="rounded-xl border border-gray bg-[#100C0C]"
                style={{
                  paddingHorizontal: s(16),
                  paddingVertical: mvs(16),
                  opacity: 0.5,
                }}
              >
                <View
                  className="flex-row items-center"
                  style={{ gap: s(12) }}
                >
                  <View
                    className="rounded bg-gray/30"
                    style={{ width: s(20), height: s(20) }}
                  />
                  <View
                    className="bg-gray/30 rounded flex-1"
                    style={{ height: s(16) }}
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-white font-neueLight"
                style={{ marginBottom: mvs(16) }}
              >
                In questa sezione puoi inserire gli anni di esperienza che
                appariranno nella tua pagina
              </ScaledText>

              {/* Year Input */}
              <TouchableOpacity
                onPress={handleOpenYearPicker}
                className="rounded-xl border border-gray bg-[#100C0C]"
                style={{
                  paddingHorizontal: s(16),
                  paddingVertical: mvs(16),
                }}
              >
                <View
                  className="flex-row items-center"
                  style={{ gap: s(12) }}
                >
                  <SVGIcons.Certificate width={s(20)} height={s(20)} />
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className={`flex-1 ${selectedYear ? "text-foreground" : "text-gray"} font-montserratSemibold`}
                  >
                    {selectedYear
                      ? selectedYear.toString()
                      : "Seleziona l'anno in cui hai iniziato la professione"}
                  </ScaledText>
                </View>
              </TouchableOpacity>

              {/* Experience Summary */}
              {selectedYear && (
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-foreground font-montserratMedium"
                  style={{ marginTop: mvs(12) }}
                >
                  Nel tuo profilo verrà scritto che hai{" "}
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-foreground font-montserratBold"
                  >
                    {yearsOfExperience} ann{yearsOfExperience === 1 ? "o" : "i"}
                  </ScaledText>{" "}
                  di esperienza.
                </ScaledText>
              )}

              {/* Info Note */}
              <ScaledText
                allowScaling={false}
                variant="11"
                className="text-gray font-neueSemibold"
                style={{ marginTop: mvs(24) }}
              >
                NB: ti chiediamo di inserire un'informazione corrispondente al
                vero. Il nostro Staff effettua periodicamente dei controlli per
                verificare che le informazioni inserite nel sito siano corrette.
              </ScaledText>
            </>
          )}
        </View>

        {/* Save Button */}
        <View
          style={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
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
              {isLoading ? "Salvataggio..." : loading ? "Caricamento..." : "Salva"}
            </ScaledText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Year Picker Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}
        enableOverDrag={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: "#000000",
          borderTopLeftRadius: s(20),
          borderTopRightRadius: s(20),
          borderWidth: s(0.5),
          borderColor: "#FFFFFF",
        }}
        handleIndicatorStyle={{
          backgroundColor: "#D9D9D9",
          width: s(40),
          height: mvs(4),
        }}
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: s(24),
            paddingTop: mvs(20),
          }}
        >
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-[#fff] font-neueLight text-center"
              style={{ marginBottom: mvs(24) }}
            >
              Seleziona l'anno in cui hai iniziato la professione
            </ScaledText>

          {/* Fixed Height Scrollable Grid - Shows 4 rows (12 years) */}
          <BottomSheetScrollView
            style={{
              maxHeight: mvs(180), // Fixed height to show exactly 4 rows
            }}
            contentContainerStyle={{
              paddingBottom: mvs(12),
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* 3-Column Grid Layout */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              {years.map((year) => {
                const isSelected = selectedYear === year;
                return (
                  <TouchableOpacity
                    key={year}
                    onPress={() => handleYearSelect(year)}
                    className={`items-center justify-center ${
                      isSelected ? "bg-primary" : "bg-transparent"
                    }`}
                    style={{
                      width: "31%", // 3 columns with space-between
                      paddingVertical: mvs(9),
                      marginBottom: mvs(12),
                      borderRadius: s(10),
                    }}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="font-montserratMedium text-foreground"
                    >
                      {year}
                    </ScaledText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetScrollView>

          {/* Select Button */}
          <View style={{ marginTop: mvs(20) }}>
            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.close()}
              className="bg-primary rounded-full items-center justify-center"
              style={{
                paddingVertical: mvs(12),
              }}
            >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueBold"
                >
                  Seleziona anno
                </ScaledText>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

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
              Hai modifiche non salvate
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

