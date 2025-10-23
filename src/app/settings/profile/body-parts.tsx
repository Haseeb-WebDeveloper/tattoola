import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
    BodyPartItem,
    fetchArtistBodyParts,
    fetchBodyParts,
    updateArtistBodyParts,
} from "@/services/bodyparts.service";
import { clearProfileCache } from "@/utils/database";
import { mvs, s } from "@/utils/scale";
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

function PartSkeleton() {
  return (
    <View
      className="flex-row items-center border-b border-gray/20"
      style={{ paddingHorizontal: s(16), paddingVertical: mvs(16) }}
    >
      <View
        className="rounded bg-gray/30"
        style={{ width: s(20), height: s(20), marginRight: s(16) }}
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

export default function BodyPartsSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bodyParts, setBodyParts] = useState<BodyPartItem[]>([]);
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [initialBodyParts, setInitialBodyParts] = useState<string[]>([]);
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
        const { data: profileData, error: profileError } = await (
          await import("@/utils/supabase")
        ).supabase
          .from("artist_profiles")
          .select("id")
          .eq("userId", user.id)
          .single();

        if (profileError || !profileData) {
          throw new Error("Artist profile not found");
        }

        const artistProfileId = profileData.id;
        setArtistId(artistProfileId);

        // Fetch all body parts and artist's selected body parts in parallel
        const [allParts, artistParts] = await Promise.all([
          fetchBodyParts(),
          fetchArtistBodyParts(artistProfileId),
        ]);

        if (mounted) {
          setBodyParts(allParts);
          setSelectedBodyParts(artistParts);
          setInitialBodyParts(artistParts);
        }
      } catch (error: any) {
        console.error("Error loading body parts:", error);
        toast.error(error.message || "Failed to load body parts");
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
    JSON.stringify([...selectedBodyParts].sort()) !==
    JSON.stringify([...initialBodyParts].sort());

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

  const toggleBodyPart = (bodyPartId: string) => {
    setSelectedBodyParts((prev) => {
      if (prev.includes(bodyPartId)) {
        return prev.filter((id) => id !== bodyPartId);
      } else {
        return [...prev, bodyPartId];
      }
    });
  };

  const handleSave = async () => {
    if (!artistId || !hasUnsavedChanges) {
      router.back();
      return;
    }

    setIsLoading(true);

    try {
      await updateArtistBodyParts(artistId, selectedBodyParts);

      // Clear profile cache to force refresh
      await clearProfileCache(user!.id);

      toast.success("Body parts updated successfully");

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating body parts:", err);
      toast.error(err.message || "Failed to update body parts");
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: BodyPartItem }) => {
    const isSelected = selectedBodyParts.includes(item.id);
    return (
      <View
        className="flex-row items-center border-b border-gray/20"
        style={{ paddingHorizontal: s(16), paddingVertical: mvs(16) }}
      >
        <Pressable
          className="items-center"
          style={{ width: s(40) }}
          onPress={() => toggleBodyPart(item.id)}
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
            Parti del corpo su cui lavori
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
            className="text-white font-semibold"
          >
            Seleziona le parti del corpo su cui lavori
          </ScaledText>
        </View>

        {/* Body Parts List */}
        <View className="flex-1">
          {loading ? (
            <ScrollView
              contentContainerStyle={{
                paddingBottom: mvs(100),
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <PartSkeleton key={i} />
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={bodyParts}
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
              You have unsaved changes in body parts
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

