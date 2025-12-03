import ScaledText from "@/components/ui/ScaledText";
import { AR_MAX_FAVORITE_STYLES, AR_MAX_STYLES, TL_MAX_FAVORITE_STYLES } from "@/constants/limits";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  fetchArtistFavoriteStyles,
  fetchTattooStyles,
  fetchUserFavoriteStyles,
  TattooStyleItem,
  updateArtistFavoriteStyles,
  updateUserFavoriteStyles,
} from "@/services/style.service";
import { SubscriptionService } from "@/services/subscription.service";
import { clearProfileCache } from "@/utils/database";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
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
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
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
        style={{ width: s(120), height: s(72) }}
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

export default function StylesSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [styles, setStyles] = useState<TattooStyleItem[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [favoriteStyleIds, setFavoriteStyleIds] = useState<string[]>([]);
  const [initialSelectedStyles, setInitialSelectedStyles] = useState<string[]>(
    []
  );
  const [initialFavoriteStyleIds, setInitialFavoriteStyleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [artistId, setArtistId] = useState<string | null>(null);
  // For artists: maxStyles = total styles, maxFavoriteStyles = favorite styles
  // For tattoo lovers: maxStyles = favorite styles (same concept)
  const [maxStyles, setMaxStyles] = useState<number>(TL_MAX_FAVORITE_STYLES);
  const [maxFavoriteStyles, setMaxFavoriteStyles] = useState<number>(AR_MAX_FAVORITE_STYLES);

  const isArtist = user?.role === "ARTIST";
  const minStyles = isArtist ? 2 : 1;

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        if (!user?.id) return;

        if (isArtist) {
          // Fetch subscription plan limits for artist
          try {
            const subscription =
              await SubscriptionService.getActiveSubscriptionWithPlan();
            const planMaxStyles = subscription?.subscription_plans?.maxStyles;
            const planMaxFavoriteStyles =
              subscription?.subscription_plans?.maxFavoritesStyles;

            if (mounted) {
              setMaxStyles(
                planMaxStyles !== null && planMaxStyles !== undefined
                  ? planMaxStyles
                  : AR_MAX_STYLES
              );
              setMaxFavoriteStyles(
                planMaxFavoriteStyles !== null &&
                  planMaxFavoriteStyles !== undefined
                  ? planMaxFavoriteStyles
                  : AR_MAX_FAVORITE_STYLES
              );
            }
          } catch (e) {
            // No subscription - use default artist limits
            console.log("No active subscription, using default artist limits");
            if (mounted) {
              setMaxStyles(AR_MAX_STYLES);
              setMaxFavoriteStyles(AR_MAX_FAVORITE_STYLES);
            }
          }

          // Fetch artist profile to get artistId
          const { data: profileData, error: profileError } = await supabase
            .from("artist_profiles")
            .select("id")
            .eq("userId", user.id)
            .single();

          if (profileError || !profileData) {
            throw new Error("Artist profile not found");
          }

          const artistProfileId = profileData.id;
          setArtistId(artistProfileId);

          // Fetch all styles and artist's styles (all + favorites) in parallel
          const [allStyles, artistStylesData] = await Promise.all([
            fetchTattooStyles(),
            fetchArtistFavoriteStyles(artistProfileId),
          ]);

          if (mounted) {
            setStyles(allStyles);
            setSelectedStyles(artistStylesData.allStyles);
            setFavoriteStyleIds(artistStylesData.favoriteStyles);
            setInitialSelectedStyles(artistStylesData.allStyles);
            setInitialFavoriteStyleIds(artistStylesData.favoriteStyles);
          }
        } else {
          // Tattoo lover - use constant limit
          if (mounted) setMaxStyles(TL_MAX_FAVORITE_STYLES);

          // Tattoo lover - fetch user's favorite styles
          const [allStyles, favoriteStyleIds] = await Promise.all([
            fetchTattooStyles(),
            fetchUserFavoriteStyles(user.id),
          ]);

          if (mounted) {
            setStyles(allStyles);
            setSelectedStyles(favoriteStyleIds);
            setInitialSelectedStyles(favoriteStyleIds);
          }
        }
      } catch (error: any) {
        console.error("Error loading styles:", error);
        toast.error(error.message || "Caricamento degli stili non riuscito");
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
  }, [user?.id, isArtist]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = isArtist
    ? JSON.stringify([...selectedStyles].sort()) !==
        JSON.stringify([...initialSelectedStyles].sort()) ||
      JSON.stringify([...favoriteStyleIds].sort()) !==
        JSON.stringify([...initialFavoriteStyleIds].sort())
    : JSON.stringify([...selectedStyles].sort()) !==
        JSON.stringify([...initialSelectedStyles].sort());

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

  const toggleStyle = (styleId: string) => {
    setSelectedStyles((prev) => {
      if (prev.includes(styleId)) {
        // Deselecting - also remove from favorites if it was favorited
        setFavoriteStyleIds((favs) => favs.filter((id) => id !== styleId));
        return prev.filter((id) => id !== styleId);
      } else {
        // Selecting - check if we can select more
        if (prev.length >= maxStyles) {
          toast.error(`Puoi selezionare fino a ${maxStyles} stili`);
          return prev;
        }
        return [...prev, styleId];
      }
    });
  };

  const toggleFavorite = (styleId: string) => {
    if (!isArtist || !selectedStyles.includes(styleId)) return;
    
    setFavoriteStyleIds((prev) => {
      if (prev.includes(styleId)) {
        // Unmark as favorite
        return prev.filter((id) => id !== styleId);
      } else {
        // Mark as favorite - check limit
        if (prev.length >= maxFavoriteStyles) {
          toast.error(
            `Puoi contrassegnare fino a ${maxFavoriteStyles} stili come preferiti`
          );
          return prev;
        }
        return [...prev, styleId];
      }
    });
  };

  const canProceed = isArtist
    ? selectedStyles.length >= minStyles
    : selectedStyles.length >= minStyles;

  const handleSave = async () => {
    if (!canProceed) {
      if (isArtist) {
        toast.error("Seleziona almeno 1 stile");
      } else {
        toast.error("Seleziona almeno 1 stile");
      }
      return;
    }

    if (!hasUnsavedChanges) {
      router.back();
      return;
    }

    if (isArtist && !artistId) {
      toast.error("Artist profile not found");
      return;
    }

    setIsLoading(true);

    try {
      if (isArtist && artistId) {
        // For artists, pass all styles and favorite style IDs
        await updateArtistFavoriteStyles(
          artistId,
          selectedStyles,
          favoriteStyleIds
        );
      } else {
        await updateUserFavoriteStyles(user!.id, selectedStyles);
      }

      // Clear profile cache to force refresh
      await clearProfileCache(user!.id);

      toast.success("Stili aggiornati con successo");

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating styles:", err);
      toast.error(err.message || "Impossibile aggiornare gli stili");
    } finally {
      setIsLoading(false);
    }
  };

  const resolveImageUrl = (url?: string | null) => {
    if (!url) return undefined;
    try {
      // Handle google imgres links → extract real image via imgurl parameter
      if (url.includes("imgres") && url.includes("imgurl=")) {
        const u = new URL(url);
        const real = u.searchParams.get("imgurl");
        return real || url;
      }
      return url;
    } catch {
      return url;
    }
  };

  const renderItem = ({ item }: { item: TattooStyleItem }) => {
    const isSelected = selectedStyles.includes(item.id);
    const isFavorite = isArtist && favoriteStyleIds.includes(item.id);
    const img = resolveImageUrl(item.imageUrl);

    return (
      <Pressable
        className="flex-row items-center border-b border-gray/20"
        style={{ paddingHorizontal: s(16) }}
        onPress={() => toggleStyle(item.id)}
      >
        {/* Left select box */}
        <View className="items-center" style={{ width: s(40) }}>
          {isSelected ? (
            <SVGIcons.CheckedCheckbox style={{ width: s(20), height: s(20) }} />
          ) : (
            <SVGIcons.UncheckedCheckbox
              style={{ width: s(20), height: s(20) }}
            />
          )}
        </View>

        {/* Image */}
        {img ? (
          <Image
            source={{ uri: img }}
            style={{ width: s(120), height: s(72) }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="bg-gray/30"
            style={{ width: s(120), height: s(72) }}
          />
        )}

        {/* Name */}
        <View className="flex-1" style={{ paddingHorizontal: s(16) }}>
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-foreground font-montserratSemibold"
          >
            {item.name}
          </ScaledText>
        </View>

        {/* Favorite star - only for artists */}
        {isArtist && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.(); // Prevent Pressable triggering
              toggleFavorite(item.id);
            }}
            style={{ paddingRight: s(16) }}
            disabled={!isSelected}
          >
            {isFavorite ? (
              <SVGIcons.StartCircleFilled
                style={{ width: s(24), height: s(24) }}
              />
            ) : (
              <SVGIcons.StartCircle style={{ width: s(24), height: s(24) }} />
            )}
          </TouchableOpacity>
        )}
      </Pressable>
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
            Stili preferiti
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
            variant="md"
            className="text-white font-montserratMedium"
          >
            {isArtist
              ? `Scegli almeno 1 stile (max ${maxStyles}). Puoi contrassegnare fino a ${maxFavoriteStyles} come stili preferiti (★)`
              : "Scegli i tuoi stili di tatuaggio preferiti (almeno 1)"}
          </ScaledText>
        </View>

        {/* Styles List */}
        <View className="flex-1">
          {loading ? (
            <ScrollView
              contentContainerStyle={{
                paddingBottom: mvs(100),
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <StyleSkeleton key={i} />
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={styles}
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
            disabled={isLoading || loading || !canProceed || !hasUnsavedChanges}
            className="rounded-full items-center justify-center flex-row"
            style={{
              backgroundColor:
                isLoading || loading || !canProceed || !hasUnsavedChanges
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
              Hai modifiche non salvate negli stili
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

