import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
    fetchStudioDetails,
    updateStudioStyles,
} from "@/services/studio.service";
import {
    fetchTattooStyles,
    TattooStyleItem,
} from "@/services/style.service";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    TouchableOpacity,
    View
} from "react-native";
import { toast } from "sonner-native";

function StyleSkeleton() {
  return (
    <View
      className="flex-row items-center border-b border-gray/20"
      style={{ paddingHorizontal: s(16) }}
    >
      <View
        className="rounded bg-gray/30"
        style={{ width: s(20), height: s(20), marginRight: s(16) }}
      />
      <View
        className="bg-gray/30"
        style={{ width: s(120), height: s(96) }}
      />
      <View className="flex-1" style={{ paddingHorizontal: s(16) }}>
        <View
          className="bg-gray/30 rounded"
          style={{ width: s(80), height: s(16) }}
        />
      </View>
      <View
        className="rounded-full bg-gray/30"
        style={{ width: s(24), height: s(24), marginRight: s(16) }}
      />
    </View>
  );
}

export default function StudioStylesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [styles, setStyles] = useState<TattooStyleItem[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [initialSelectedStyles, setInitialSelectedStyles] = useState<string[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        if (!user?.id) return;

        // Fetch all styles and studio's styles in parallel
        const [allStyles, studioData] = await Promise.all([
          fetchTattooStyles(),
          fetchStudioDetails(user.id),
        ]);

        if (!mounted) return;

        const studioStyleIds = studioData.styles.map(
          (s: any) => s.style?.id || s.styleId
        );

        setStyles(allStyles);
        setSelectedStyles(studioStyleIds);
        setInitialSelectedStyles(studioStyleIds);
      } catch (error: any) {
        console.error("Error loading data:", error);
        toast.error(error.message || "Failed to load styles");
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

  const toggleStyle = (styleId: string) => {
    setSelectedStyles((prev) =>
      prev.includes(styleId)
        ? prev.filter((id) => id !== styleId)
        : [...prev, styleId]
    );
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    JSON.stringify(selectedStyles.sort()) !==
    JSON.stringify(initialSelectedStyles.sort());

  const canSave = selectedStyles.length >= 1;

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

      const result = await updateStudioStyles(user.id, selectedStyles);

      if (result.success) {
        toast.success("Studio styles updated successfully!");
        setInitialSelectedStyles(selectedStyles);
        setTimeout(() => {
          router.back();
        }, 500);
      } else {
        toast.error(result.error || "Failed to update styles");
      }
    } catch (error: any) {
      console.error("Error updating styles:", error);
      toast.error(error.message || "Failed to update styles");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStyleItem = ({ item }: { item: TattooStyleItem }) => {
    const isSelected = selectedStyles.includes(item.id);

    return (
      <TouchableOpacity
        onPress={() => toggleStyle(item.id)}
        className="flex-row items-center border-b border-gray/20"
        style={{ paddingHorizontal: s(16) }}
      >
        {/* Checkbox */}
        <View style={{ marginRight: s(16) }}>
          {isSelected ? (
            <SVGIcons.CheckedCheckbox width={s(20)} height={s(20)} />
          ) : (
            <SVGIcons.UncheckedCheckbox width={s(20)} height={s(20)} />
          )}
        </View>

        {/* Style Image */}
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: s(120), height: s(96) }}
          resizeMode="cover"
        />

        {/* Style Name */}
        <View className="flex-1" style={{ paddingHorizontal: s(16) }}>
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-white font-neueSemibold"
          >
            {item.name}
          </ScaledText>
        </View>
      </TouchableOpacity>
    );
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
          {/* Header */}
          <View
            className="flex-row items-center justify-center relative"
            style={{
              paddingHorizontal: s(16),
              paddingVertical: mvs(16),
              marginBottom: mvs(16),
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
              Styles
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
              Select styles
            </ScaledText>
          </View>

          {/* Styles List */}
          {loading ? (
            <View>
              {[1, 2, 3, 4, 5].map((i) => (
                <StyleSkeleton key={i} />
              ))}
            </View>
          ) : (
            <FlatList
              data={styles}
              keyExtractor={(item) => item.id}
              renderItem={renderStyleItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: mvs(120) }}
            />
          )}

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
              disabled={isLoading || loading || !hasUnsavedChanges || !canSave}
              className="rounded-full items-center justify-center flex-row"
              style={{
                backgroundColor:
                  isLoading || loading || !hasUnsavedChanges || !canSave
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
                {isLoading ? "Saving..." : "Save"}
              </ScaledText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
              You have unsaved changes in styles
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
