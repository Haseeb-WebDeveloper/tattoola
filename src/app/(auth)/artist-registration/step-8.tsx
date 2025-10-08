import { AR_MAX_FAVORITE_STYLES } from "@/constants/limits";
import { fetchTattooStyles, TattooStyleItem } from "@/services/style.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function StyleSkeleton() {
  return (
    <View className="flex-row items-center justify-between py-4 border-b border-gray/20">
      <View className="w-32 h-24 bg-gray/30 rounded-md" />
      <View className="flex-1 px-4">
        <View className="w-40 h-4 bg-gray/30 rounded mb-2" />
        <View className="w-24 h-4 bg-gray/20 rounded" />
      </View>
      <View className="w-6 h-6 rounded-full bg-gray/30" />
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

  const onNext = () => {
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
    console.log("item", item);
    const isSelected = selected.includes(item.id);
    const isPrimary = step8.mainStyleId === item.id;
    const img = resolveImageUrl(item.imageUrl);
    return (
      <Pressable
        onPress={() => toggleFavoriteStyle(item.id, AR_MAX_FAVORITE_STYLES)}
        className="flex-row items-center py-2 border-b border-gray/20"
      >
        {/* Left select box */}
        <View className="w-10 items-center">
          <View
            className={`w-5 h-5 rounded-[4px] border ${isSelected ? "bg-error border-error" : "bg-transparent border-foreground/50"}`}
          />
        </View>

        {/* Image */}
        {img ? (
          <Image
            source={{ uri: img }}
            className="w-36 h-28"
            resizeMode="cover"
          />
        ) : (
          <View className="w-36 h-28 bg-gray/30" />
        )}

        {/* Name */}
        <View className="flex-1 px-4">
          <Text className="text-foreground tat-body-1 font-neueBold">
            {item.name}
          </Text>
        </View>

        {/* Primary star */}
        <TouchableOpacity
          onPress={() => isSelected && setPrimaryStyle(item.id)}
          className="pr-4"
          disabled={!isSelected}
        >
          <Image
            source={
              isPrimary
                ? require("@/assets/images/icons/yellow-heart-circle.png")
                : require("@/assets/images/icons/heart-circle.png")
            }
            className="w-5 h-5"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 10}
      className="flex-1 bg-black"
    >
      <ScrollView
        className="flex-1 relative"
        contentContainerClassName="flex-grow"
      >
        {/* Header */}
        <View className="px-4 my-8">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/welcome")}
              className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
            >
              <Image
                source={require("@/assets/images/icons/close.png")}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Image
              source={require("@/assets/logo/logo-light.png")}
              className="h-10"
              resizeMode="contain"
            />
            <View className="w-10" />
          </View>
          <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
        </View>

        {/* Progress */}
        <View className="items-center mb-6">
          <View className="flex-row items-center gap-1">
            {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
              <View
                key={idx}
                className={`${idx < 8 ? (idx === 7 ? "bg-foreground w-3 h-3" : "bg-success w-2 h-2") : "bg-gray w-2 h-2"} rounded-full`}
              />
            ))}
          </View>
        </View>

        {/* Title + helper text */}
        <View className="px-6 mb-2 flex-row gap-2 items-center">
          <Image
            source={require("@/assets/images/icons/style.png")}
            className="w-6 h-6"
            resizeMode="contain"
          />
          <Text className="text-foreground section-title font-neueBold">
            Your preferred styles
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setInfoVisible(true)}
          className="px-6 mb-4"
        >
          <Text className="text-foreground/80">
            Choose at least 2 styles. Then mark one as your primary style (★)
          </Text>
        </TouchableOpacity>

        {/* List */}
        <View className="px-6">
          {loading ? (
            <View>
              {Array.from({ length: 6 }).map((_, i) => (
                <StyleSkeleton key={i} />
              ))}
            </View>
          ) : (
            <FlatList
              data={styles}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Footer */}
        <View className="flex-row justify-between px-6 mt-10 mb-10 absolute top-[80vh] left-0 right-0">
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-full border border-foreground px-6 py-4"
          >
            <Text className="text-foreground">Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNext}
            className="rounded-full px-8 py-4 bg-primary"
          >
            <Text className="text-foreground">Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Info Modal */}
      <Modal
        visible={infoVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInfoVisible(false)}
      >
        <View className="flex-1 justify-end">
          <View className="w-full bg-black rounded-t-3xl h-[100vh]">
            <View className="px-6 pb-12 pt-20 border-b border-gray flex-row items-center justify-between relative bg-primary/30">
              <TouchableOpacity
                onPress={() => setInfoVisible(false)}
                className="absolute left-6 top-20 w-8 h-8 rounded-full bg-foreground/20 items-center justify-center"
              >
                <Image
                  source={require("@/assets/images/icons/back.png")}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            <ScrollView className="px-6 pt-6">
              <Text className="text-foreground section-title mb-4">
                Why we need this data?
              </Text>
              <Text className="text-foreground mt-6 text-[16px] font-medium mb-4">
                Come Restare Ispirato su Tattoola
              </Text>
              <Text className="text-foreground/90 text-[16px] font-light mb-4">
                I tatuaggi sono molto più di semplice inchiostro sulla pelle:
                sono espressioni di arte, personalità e creatività. Che tu stia
                cercando il tuo primo tatuaggio o aggiungendo un nuovo
                capolavoro alla tua collezione, Tattoola ti aiuta a rimanere
                ispirato grazie a design di tendenza, stili vari e contenuti
                esclusivi dal mondo del tatuaggio.
              </Text>
              <Text className="text-foreground mt-6 text-[16px] font-medium mb-4">
                Scopri Tatuaggi: Una Galleria di Ispirazione
              </Text>
              <Text className="text-foreground/90 text-[16px] font-light mb-4">
                La sezione “Scopri Tatuaggi” è il tuo spazio ideale per
                esplorare gli ultimi caricamenti, sia da parte di artisti che di
                utenti. Questa galleria dinamica offre una vasta gamma di
                design, dandoti accesso immediato a nuove idee e tendenze
                creative.
              </Text>
              <Text className="text-foreground/90 text-[16px] font-light mb-4">
                Vuoi restringere la ricerca? Usa il filtro per stile, che ti
                consente di selezionare tatuaggi in base a stili specifici come
                blackwork, old school, geometrico, tradizionale e molti
                altri. Così potrai trovare più facilmente design che
                rispecchiano davvero la tua visione e il tuo gusto estetico.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
