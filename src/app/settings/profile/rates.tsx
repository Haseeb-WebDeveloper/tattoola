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
import { toast } from "sonner-native";

export default function RatesSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [minimumPrice, setMinimumPrice] = useState<number | undefined>(
    undefined
  );
  const [hourlyRate, setHourlyRate] = useState<number | undefined>(undefined);
  const [initialMinimumPrice, setInitialMinimumPrice] = useState<
    number | undefined
  >(undefined);
  const [initialHourlyRate, setInitialHourlyRate] = useState<
    number | undefined
  >(undefined);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [artistId, setArtistId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        if (!user?.id) return;

        // Fetch artist profile
        const { data: profileData, error: profileError } = await supabase
          .from("artist_profiles")
          .select("id, minimumPrice, hourlyRate")
          .eq("userId", user.id)
          .single();

        if (profileError || !profileData) {
          throw new Error("Artist profile not found");
        }

        if (mounted) {
          setArtistId(profileData.id);
          setMinimumPrice(profileData.minimumPrice ?? undefined);
          setHourlyRate(profileData.hourlyRate ?? undefined);
          setInitialMinimumPrice(profileData.minimumPrice ?? undefined);
          setInitialHourlyRate(profileData.hourlyRate ?? undefined);
        }
      } catch (error: any) {
        console.error("Error loading rates:", error);
        toast.error(error.message || "Failed to load rates");
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
    minimumPrice !== initialMinimumPrice || hourlyRate !== initialHourlyRate;

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
    if (!artistId || !hasUnsavedChanges) {
      router.back();
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("artist_profiles")
        .update({
          minimumPrice: minimumPrice ?? null,
          hourlyRate: hourlyRate ?? null,
        })
        .eq("id", artistId);

      if (error) throw error;

      // Clear profile cache to force refresh
      await clearProfileCache(user!.id);

      toast.success("Rates updated successfully");

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating rates:", err);
      toast.error(err.message || "Failed to update rates");
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrencyInput = (
    label: string,
    value: number | undefined,
    onChange: (n?: number) => void,
    field: string
  ) => (
    <View style={{ marginBottom: mvs(24) }}>
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-gray font-montserratMedium"
        style={{ marginBottom: mvs(8) }}
      >
        {label}
      </ScaledText>
      <View
        className={`flex-row items-center rounded-xl ${
          focused === field
            ? "border-2 border-foreground"
            : "border border-gray"
        }`}
        style={{
          backgroundColor: "#100C0C",
        }}
      >
        <View
          style={{
            paddingLeft: s(16),
            paddingRight: s(8),
            paddingVertical: mvs(12),
          }}
        >
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-foreground font-montserratBold"
          >
            €
          </ScaledText>
        </View>
        <ScaledTextInput
          containerClassName="flex-1"
          className="text-foreground font-medium"
          placeholder="0"
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={value !== undefined ? String(value) : ""}
          onChangeText={(v) => {
            const digits = v.replace(/[^0-9]/g, "");
            onChange(digits ? Number(digits) : undefined);
          }}
          onFocus={() => setFocused(field)}
          onBlur={() => setFocused(null)}
          maxLength={6}
          editable={!loading && !isLoading}
          containerStyle={{
            borderWidth: 0,
            backgroundColor: "transparent",
          }}
          style={{
            fontSize: 14,
            fontFamily: "Montserrat-Medium",
          }}
        />
        <View style={{ paddingRight: s(16), paddingVertical: mvs(12) }}>
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-gray font-montserratMedium"
          >
            EUR
          </ScaledText>
        </View>
      </View>
    </View>
  );

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
            Tariffe
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
          style={{
            flex: 1,
            paddingHorizontal: s(16),
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <>
              {/* Loading Skeleton */}
              {renderCurrencyInput(
                "Prezzo minimo (es. 100€, 200€)",
                0,
                setMinimumPrice,
                "minimum"
              )}
              {renderCurrencyInput(
                "Tua tariffa oraria (facoltativo)",
                0,
                setHourlyRate,
                "hourly"
              )}
            </>
          ) : (
            <>
              {renderCurrencyInput(
                "Prezzo minimo (es. 100€, 200€)",
                minimumPrice,
                setMinimumPrice,
                "minimum"
              )}
              {renderCurrencyInput(
                "Tua tariffa oraria (facoltativo)",
                hourlyRate,
                setHourlyRate,
                "hourly"
              )}
            </>
          )}
        </ScrollView>

        {/* Save Button */}
        <View
          style={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
            paddingTop: mvs(16),
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
              className="text-foreground font-medium"
            >
              {isLoading ? "Saving..." : loading ? "Loading..." : "Save"}
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
              You have unsaved changes
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
    </KeyboardAvoidingView>
  );
}
