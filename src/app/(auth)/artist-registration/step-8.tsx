import AuthStepHeader from "@/components/ui/auth-step-header";
import AbsoluteNextBackFooter from "@/components/ui/AbsoluteNextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { AR_MAX_FAVORITE_STYLES } from "@/constants/limits";
import { SVGIcons } from "@/constants/svg";
import { fetchTattooStyles, TattooStyleItem } from "@/services/style.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step8Schema } from "@/utils/artistRegistrationValidation";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function StyleSkeleton() {
  return (
    <View className="flex-row items-center justify-between border-b border-gray/20 px-4">
      <View className="w-6 h-6 rounded-md bg-gray/30 mr-3" />
      <View className="w-32 h-24 bg-gray/30" />
      <View className="flex-1 px-4">
        <View className="w-24 h-4 bg-gray/30 rounded" />
      </View>
      <View className="w-6 h-6 rounded-full bg-gray/30" />
    </View>
  );
}

export default function ArtistStep8V2() {
  const insets = useSafeAreaInsets();
  const {
    step8,
    updateStep8,
    toggleFavoriteStyle,
    setPrimaryStyle,
    setCurrentStepDisplay,
    totalStepsDisplay,
  } = useArtistRegistrationV2Store();
  const [styles, setStyles] = useState<TattooStyleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoVisible, setInfoVisible] = useState(false);

  useEffect(() => {
    setCurrentStepDisplay(8);
    let mounted = true;
    (async () => {
      try {
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

  const selected = step8.favoriteStyles || [];
  const canSelectMore = selected.length < AR_MAX_FAVORITE_STYLES;

  const canProceed = isValid(step8Schema, {
    favoriteStyles: selected,
    mainStyleId: step8.mainStyleId || "",
  });

  const onNext = () => {
    if (!canProceed) return;
    router.push("/(auth)/artist-registration/step-9");
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
  
    const isSelected = selected.includes(item.id);
    const isPrimary = step8.mainStyleId === item.id;
    const img = resolveImageUrl(item.imageUrl);
    return (
      <View
        className="flex-row items-center border-b border-gray/20"
        style={{ paddingHorizontal: s(16) }}
      >
        {/* Left select box */}
        <Pressable
          className="items-center"
          style={{ width: s(40) }}
          onPress={() => toggleFavoriteStyle(item.id, AR_MAX_FAVORITE_STYLES)}
        >
          {isSelected ? (
            <SVGIcons.CheckedCheckbox className="w-5 h-5" />
          ) : (
            <SVGIcons.UncheckedCheckbox className="w-5 h-5" />
          )}
        </Pressable>

        {/* Image */}
        {img ? (
          <Image
            source={{ uri: img }}
            className=""
            style={{ width: s(120), height: s(96) }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="bg-gray/30"
            style={{ width: s(120), height: s(96) }}
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

        {/* Primary star */}
        <TouchableOpacity
          onPress={() => isSelected && setPrimaryStyle(item.id)}
          style={{ paddingRight: s(16) }}
          disabled={!isSelected}
        >
          {isPrimary ? (
            <SVGIcons.StartCircleFilled className="w-5 h-5" />
          ) : (
            <SVGIcons.StartCircle className="w-5 h-5" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 bg-background">
        {/* Header */}
        <AuthStepHeader />

        {/* Progress */}
        <RegistrationProgress
          currentStep={8}
          totalSteps={totalStepsDisplay}
          name="Your preferred styles"
          description="Choose at least 2 styles. Then mark one as your primary style (★)"
          icon={<SVGIcons.Style width={19} height={19} />}
          isIconPressable={true}
          onIconPress={() => setInfoVisible(true)}
        />

        {/* List */}
        <View className="flex-1">
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
          backLabel="Back"
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
              className="border-b border-gray flex-row items-center justify-between relative bg-background"
              style={{
                paddingBottom: mvs(20),
                paddingTop: mvs(70),
                paddingHorizontal: s(24),
              }}
            >
              <TouchableOpacity
                onPress={() => setInfoVisible(false)}
                className="rounded-full bg-foreground/20 items-center justify-center"
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
                Why we need this data?
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
    </View>
  );
}
