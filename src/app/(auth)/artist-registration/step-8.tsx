import AbsoluteNextBackFooter from "@/components/ui/AbsoluteNextBackFooter";
import AuthStepHeader from "@/components/ui/auth-step-header";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import StyleInfoModal from "@/components/shared/StyleInfoModal";
import { AR_MAX_FAVORITE_STYLES, AR_MAX_STYLES } from "@/constants/limits";
import { SVGIcons } from "@/constants/svg";
import { fetchTattooStyles, TattooStyleItem } from "@/services/style.service";
import { SubscriptionService } from "@/services/subscription.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step8Schema } from "@/utils/artistRegistrationValidation";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
function StyleSkeleton() {
  return (
    <View className="flex-row items-center">
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: mvs(6),
          paddingRight: s(16),
        }}
      >
        <SVGIcons.UncheckedCheckbox width={s(20)} height={s(20)} />
      </View>
      <View className="flex-row items-center justify-center border-b border-gray/20">
        <View
          style={{
            width: s(120),
            height: mvs(72),
            backgroundColor: "#A49A9950",
          }}
        />
        <View className="flex-1 " style={{ paddingLeft: s(16) }}>
          <ScaledText
            allowScaling={false}
            style={{ fontSize: 12.445 }}
            className="text-foreground font-montserratSemibold"
          >
            ...
          </ScaledText>
        </View>
        <View style={{ paddingRight: s(16) }}>
          <SVGIcons.StartCircle className="w-5 h-5" />
        </View>
      </View>
    </View>
  );
}

export default function ArtistStep8V2() {
  const {
    step8,
    updateStep8,
    toggleFavoriteStyle,
    setPrimaryStyle,
    setCurrentStepDisplay,
    totalStepsDisplay,
    reset,
    step13,
  } = useArtistRegistrationV2Store();
  const [styles, setStyles] = useState<TattooStyleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoVisible, setInfoVisible] = useState(false);
  // How many styles user can pick in total (checkboxes)
  const [maxStyles, setMaxStyles] = useState(AR_MAX_STYLES);
  // How many styles user can mark as favourite/primary (stars)
  const [maxFavoriteStyles, setMaxFavoriteStyles] = useState(
    AR_MAX_FAVORITE_STYLES
  );
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedStyleForInfo, setSelectedStyleForInfo] = useState<TattooStyleItem | null>(null);

  useEffect(() => {
    setCurrentStepDisplay(8);
    let mounted = true;
    (async () => {
      try {
        // Fetch plan limits (will fallback to AR_MAX_* constants if no subscription)
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
          // No subscription yet (normal during registration) - use default
          if (mounted) {
            setMaxStyles(AR_MAX_STYLES);
            setMaxFavoriteStyles(AR_MAX_FAVORITE_STYLES);
          }
        }

        const data = await fetchTattooStyles();
        if (mounted) setStyles(data);
      } catch (e) {
        setStyles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const selected = step8.styles || [];
  const favouriteIds = step8.favoriteStyles || [];
  const canSelectMore = selected.length < maxStyles;

  const canProceed = isValid(step8Schema, {
    styles: selected,
    favoriteStyles: favouriteIds,
  });

  const onNext = () => {
    if (!canProceed) return;
    router.push("/(auth)/artist-registration/step-9");
  };

  const resolveImageUrl = (url?: string | null) => {
    if (!url) return undefined;
    try {
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
    const isSelected = selected.includes(item.id);
    const isFavourite = favouriteIds.includes(item.id);
    const img = resolveImageUrl(item.imageUrl);

    // Handle row press: toggle selection (if not max reached)
    const handleRowPress = () => {
      // If trying to add a new style and limit is reached, show popup
      if (!isSelected) {
        // Check if we've reached the maximum allowed styles
        if (selected.length >= maxStyles) {
          setShowLimitModal(true);
          return;
        }
      }

      toggleFavoriteStyle(item.id, maxStyles);
    };

    // Handle star press: toggle favourite within selected list
    const handleStarPress = () => {
      // If the style is not yet selected, treat a star tap as:
      // 1) attempt to select the style (respecting maxStyles)
      // 2) then toggle it as favourite (respecting maxFavoriteStyles inside the store)
      if (!isSelected) {
        if (selected.length >= maxStyles) {
          // Same UX as tapping the row when at the selection limit
          setShowLimitModal(true);
          return;
        }
        // This will add the style to the selected list (and keep favourites in sync)
        toggleFavoriteStyle(item.id, maxStyles);
      }

      // Now toggle favourite status for this style
      // maxFavoriteStyles is enforced inside the store action
      setPrimaryStyle(item.id, maxFavoriteStyles as any);
    };

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleRowPress}
        className="flex-row items-center"
        style={{}}
      >
        {/* Left select box */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: mvs(6),
            paddingRight: s(16),
          }}
        >
          {isSelected ? (
            <SVGIcons.CheckedCheckbox width={s(20)} height={s(20)} />
          ) : (
            <SVGIcons.UncheckedCheckbox width={s(20)} height={s(20)} />
          )}
        </View>

        {/* Image */}
        <TouchableOpacity
          onPress={() => setSelectedStyleForInfo(item)}
          activeOpacity={0.7}
        >
          {img ? (
            <Image
              source={{ uri: img }}
              className="border-b border-gray/20"
              style={{ width: s(120), height: mvs(72) }}
              resizeMode="cover"
            />
          ) : (
            <View
              className="bg-gray/30"
              style={{ width: s(155), height: mvs(72) }}
            />
          )}
        </TouchableOpacity>

        {/* Name */}
        <TouchableOpacity
          className="flex-1"
          style={{ paddingLeft: s(16) }}
          onPress={() => setSelectedStyleForInfo(item)}
          activeOpacity={0.7}
        >
          <ScaledText
            allowScaling={false}
            style={{ fontSize: 12.445 }}
            className="text-foreground font-montserratSemibold"
          >
            {item.name}
          </ScaledText>
        </TouchableOpacity>

        {/* Primary star */}
        <TouchableOpacity
          onPress={handleStarPress}
          style={{ paddingRight: s(16) }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
        >
          {isFavourite ? (
            <SVGIcons.StartCircleFilled className="w-5 h-5" />
          ) : (
            <SVGIcons.StartCircle className="w-5 h-5" />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 bg-background">
        {/* Header */}
        <AuthStepHeader
          onClose={() => {
            if (step13?.selectedPlanId) {
              router.replace("/(auth)/artist-registration/tattoola-pro");
            } else {
              router.replace("/(auth)/welcome");
            }
          }}
        />

        {/* Progress */}
        <RegistrationProgress
          currentStep={8}
          totalSteps={totalStepsDisplay}
          name="I tuoi stili preferiti"
          description={`Scegli almeno 1 stile (max ${maxStyles}). Puoi segnare fino a ${maxFavoriteStyles} come stili preferiti (★)`}
          descriptionVariant="md"
          icon={<SVGIcons.Style width={19} height={19} />}
          isIconPressable={true}
          onIconPress={() => setInfoVisible(true)}
          isDescriptionClickable={true}
          onDescriptionPress={() => setInfoVisible(true)}
        />

        {/* List */}
        <View className="flex-1" style={{ paddingHorizontal: s(16) }}>
          {loading ? (
            <ScrollView
              contentContainerStyle={{
                paddingBottom: mvs(68),
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <StyleSkeleton key={i} />
              ))}
            </ScrollView>
          ) : (
            <FlatList
              data={styles}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{
                paddingBottom: mvs(68),
              }}
            />
          )}
        </View>

        {/* Fixed Footer */}
        <AbsoluteNextBackFooter
          onNext={onNext}
          nextDisabled={!canProceed}
          backLabel="Indietro"
          onBack={() => router.back()}
        />
      </View>

      {/* Info Modal */}
      <Modal
        visible={infoVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInfoVisible(false)}
      >
        <View className="flex-1 bg-background">
          <View
            className="flex-1 rounded-t-3xl"
            style={{ marginTop: "auto", marginBottom: mvs(20) }}
          >
            <View
              className="relative flex-row items-center justify-between border-b border-gray bg-background"
              style={{
                paddingBottom: mvs(20),
                paddingTop: mvs(70),
                paddingHorizontal: s(24),
              }}
            >
              <TouchableOpacity
                onPress={() => setInfoVisible(false)}
                className="items-center justify-center rounded-full bg-foreground/20"
                style={{
                  width: s(30),
                  height: s(30),
                }}
              >
                <SVGIcons.ChevronLeft width={s(10)} height={s(10)} />
              </TouchableOpacity>
              {/* empty view */}
              <View style={{ height: mvs(30), width: mvs(30) }} />
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: s(24),
                paddingTop: mvs(15),
                paddingBottom: mvs(40),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="sectionTitle"
                className="text-foreground font-neueSemibold"
                style={{ marginBottom: mvs(8) }}
              >
                Perché abbiamo bisogno di questi dati?
              </ScaledText>
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-foreground font-neueSemibold font-[600]"
                style={{ marginTop: mvs(12), marginBottom: mvs(8) }}
              >
                Come Restare Ispirato su Tattoola
              </ScaledText>
              <ScaledText
                allowScaling={false}
                variant="body2"
                className="text-foreground/90 font-neueLight"
                style={{ marginBottom: mvs(8) }}
              >
                I tatuaggi sono molto più di semplice inchiostro sulla pelle:
                sono espressioni di arte, personalità e creatività. Che tu stia
                cercando il tuo primo tatuaggio o aggiungendo un nuovo
                capolavoro alla tua collezione, Tattoola ti aiuta a rimanere
                ispirato grazie a design di tendenza, stili vari e contenuti
                esclusivi dal mondo del tatuaggio.
              </ScaledText>
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-foreground font-neueSemibold font-[600]"
                style={{ marginTop: mvs(12), marginBottom: mvs(8) }}
              >
                Scopri Tatuaggi: Una Galleria di Ispirazione
              </ScaledText>
              <ScaledText
                allowScaling={false}
                variant="body2"
                className="text-foreground/90 font-neueLight"
                style={{ marginBottom: mvs(8) }}
              >
                La sezione “Scopri Tatuaggi” è il tuo spazio ideale per
                esplorare gli ultimi caricamenti, sia da parte di artisti che di
                utenti. Questa galleria dinamica offre una vasta gamma di
                design, dandoti accesso immediato a nuove idee e tendenze
                creative.
              </ScaledText>
              <ScaledText
                allowScaling={false}
                variant="body2"
                className="text-foreground/90 font-neueLight"
                style={{ marginBottom: mvs(8) }}
              >
                Vuoi restringere la ricerca? Usa il filtro per stile, che ti
                consente di selezionare tatuaggi in base a stili specifici come
                blackwork, old school, geometrico, tradizionale e molti altri.
                Così potrai trovare più facilmente design che rispecchiano
                davvero la tua visione e il tuo gusto estetico.
              </ScaledText>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Limit Exceeded Modal */}
      <Modal
        visible={showLimitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLimitModal(false)}
      >
        <View
          className="items-center justify-center flex-1"
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
            <View className="items-center" style={{ marginBottom: mvs(16) }}>
              <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
            </View>

            {/* Title */}
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-center text-background font-neueBold"
              style={{ marginBottom: mvs(4) }}
            >
              Limite Stili Raggiunto
            </ScaledText>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-center text-background font-montserratMedium"
              style={{ marginBottom: mvs(16) }}
            >
              Puoi selezionare solo {maxStyles}{" "}
              {maxStyles === 1 ? "stile" : "stili"}.
            </ScaledText>

            {/* Action Button */}
            <View className="flex-row justify-center">
              <TouchableOpacity
                onPress={() => setShowLimitModal(false)}
                className="items-center justify-center rounded-full"
                style={{
                  backgroundColor: "#AD2E2E",
                  paddingVertical: mvs(8),
                  paddingLeft: s(32),
                  paddingRight: s(32),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-white font-neueSemibold"
                >
                  OK
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Style Info Modal */}
      <StyleInfoModal
        visible={selectedStyleForInfo !== null}
        style={selectedStyleForInfo}
        onClose={() => setSelectedStyleForInfo(null)}
      />
    </View>
  );
}
