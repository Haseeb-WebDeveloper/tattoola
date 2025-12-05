import NextBackFooter from "@/components/ui/NextBackFooter";
import { ScaledText } from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { fetchTattooStyles, TattooStyleItem } from "@/services/style.service";
import { usePostUploadStore } from "@/stores/postUploadStore";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function UploadStyleStep() {
  const { user } = useAuth();
  const styleIds = usePostUploadStore((s) => s.styleIds);
  const toggleStyleId = usePostUploadStore((s) => s.toggleStyleId);
  const media = usePostUploadStore((s) => s.media);
  const caption = usePostUploadStore((s) => s.caption);
  const [styles, setStyles] = useState<TattooStyleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const canProceed =
    (styleIds?.length || 0) >= 1 && (styleIds?.length || 0) <= 3;
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchTattooStyles();
        if (mounted) setStyles(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const main = useMemo(() => media[0]?.cloud || media[0]?.uri, [media]);
  const mainType = useMemo(() => media[0]?.type, [media]);
  const thumb1 = useMemo(() => media[1]?.cloud || media[1]?.uri, [media]);
  const thumb1Type = useMemo(() => media[1]?.type, [media]);
  const thumb2 = useMemo(() => media[2]?.cloud || media[2]?.uri, [media]);
  const thumb2Type = useMemo(() => media[2]?.type, [media]);

  const renderItem = ({ item }: { item: TattooStyleItem }) => {
    const isSelected = styleIds?.includes(item.id) || false;
    const isDisabled = !isSelected && (styleIds?.length || 0) >= 3;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => toggleStyleId(item.id)}
        disabled={isDisabled}
        className="flex-row items-center w-full"
        style={{ opacity: isDisabled ? 0.5 : 1 }}
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
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
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

        {/* Name */}
        <View className="flex-1" style={{ paddingLeft: s(16) }}>
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-foreground font-neueMedium"
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
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {/* Summary card with media + caption */}
      <View className="px-6 pt-6 mb-6">
        <View className="relative px-3 py-3 border rounded-2xl bg-black/40 border-gray">
          <View className="flex-row gap-3">
            {/* Left media column: big + two small */}
            <View className="flex-row items-start" style={{ minWidth: 100 }}>
              {/* Main Image */}
              <View
                className="overflow-hidden rounded-md bg-black/40"
                style={{
                  width: 58,
                  height: 70,
                  marginRight: 4,
                }}
              >
                {main ? (
                  mainType === "video" ? (
                    <View
                      className="w-full h-full items-center justify-center bg-black/60"
                      style={{
                        borderWidth: s(1),
                        borderColor: "#A49A99",
                        borderRadius: s(6),
                      }}
                    >
                      <SVGIcons.Video width={s(20)} height={s(20)} />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: main }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  )
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#00000033",
                    }}
                  />
                )}
              </View>
              {/* 2 Thumbnails Column */}
              <View className="justify-between" style={{ height: 70 }}>
                <View
                  className="overflow-hidden rounded-md bg-black/40"
                  style={{
                    width: 38,
                    height: 33,
                    marginBottom: 4,
                  }}
                >
                  {thumb1 ? (
                    thumb1Type === "video" ? (
                      <View
                        className="w-full h-full items-center justify-center bg-black/60"
                        style={{
                          borderWidth: s(1),
                          borderColor: "#A49A99",
                          borderRadius: s(6),
                        }}
                      >
                        <SVGIcons.Video width={s(15)} height={s(15)} />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: thumb1 }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    )
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#00000033",
                      }}
                    />
                  )}
                </View>
                <View
                  className="overflow-hidden rounded-md bg-black/40"
                  style={{
                    width: 38,
                    height: 33,
                  }}
                >
                  {thumb2 ? (
                    thumb2Type === "video" ? (
                      <View
                        className="w-full h-full items-center justify-center bg-black/60"
                        style={{
                          borderWidth: s(1),
                          borderColor: "#A49A99",
                          borderRadius: s(6),
                        }}
                      >
                        <SVGIcons.Video width={s(15)} height={s(15)} />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: thumb2 }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    )
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#00000033",
                      }}
                    />
                  )}
                </View>
              </View>
            </View>

            {/* Caption */}
            <View className="flex-1">
              <View
                style={{
                  flex: 1,
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                }}
              >
                <ScaledText
                  variant="sm"
                  numberOfLines={3}
                  className="text-left text-gray font-neueMedium"
                  style={{ textAlignVertical: "top", width: "100%" }}
                >
                  {caption ||
                    "Scrivi una descrizione per il tuo post. Ad esempio: stile, soggetto, dimensioni, zona del corpo..."}
                </ScaledText>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/upload/description")}
            className="absolute items-center justify-center w-6 h-6 right-3 bottom-3"
          >
            <SVGIcons.Pen1 className="w-5 h-5" />
          </Pressable>
        </View>
      </View>
      <View
        className=""
        style={{
          paddingHorizontal: s(16),
          paddingVertical: mvs(8),
        }}
      >
        <ScaledText
          allowScaling={false}
          variant="lg"
          className="text-foreground font-neueBold"
        >
          Seleziona gli stili
        </ScaledText>
        <ScaledText
          allowScaling={false}
          variant="11"
          className="text-gray font-neueMedium"
          style={{ marginTop: mvs(4) }}
        >
          Seleziona da 1 a 3 stili ({styleIds?.length || 0}/3)
        </ScaledText>
      </View>

      <View className="flex-1">
        {loading ? (
          <View />
        ) : (
          <FlatList
            data={styles}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={true}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{
              paddingHorizontal: s(20),
              paddingBottom: 8,
            }}
          />
        )}
      </View>
      <NextBackFooter
        onBack={() => router.back()}
        onNext={() =>
          router.push(
            user?.role === "ARTIST" ? "/upload/collection" : "/upload/preview"
          )
        }
        nextDisabled={!canProceed}
        nextLabel="Avanti"
        backLabel="Indietro"
      />
    </View>
  );
}
