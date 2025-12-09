import NextBackFooter from "@/components/ui/NextBackFooter";
import { ScaledText } from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { StylePills } from "@/components/ui/stylePills";
import { SVGIcons } from "@/constants/svg";
import { cloudinaryService } from "@/services/cloudinary.service";
import { createCollection } from "@/services/collection.service";
import { usePostUploadStore } from "@/stores/postUploadStore";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
type SimpleCollection = {
  id: string;
  name: string;
  isPortfolioCollection?: boolean;
};
type RichCollection = SimpleCollection & { thumbnails: string[] };

export default function UploadCollectionStep() {
  const collectionId = usePostUploadStore((s) => s.collectionId);
  const setCollectionId = usePostUploadStore((s) => s.setCollectionId);
  const [collections, setCollections] = useState<RichCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const media = usePostUploadStore((s) => s.media);
  const caption = usePostUploadStore((s) => s.caption);
  const styleIds = usePostUploadStore((s) => s.styleIds);
  const [styleNames, setStyleNames] = useState<{ id: string; name: string }[]>(
    []
  );
  const canProceed = !!collectionId;
  const redirectToCollectionId = usePostUploadStore(
    (s) => s.redirectToCollectionId
  );
  const setRedirectToCollectionId = usePostUploadStore(
    (s) => s.setRedirectToCollectionId
  );

  // This is our added state for create button disable logic
  const isCreateDisabled = newName.trim().length === 0;

  // Get media types for video icon display
  const mainType = useMemo(() => media[0]?.type, [media]);
  const thumb1Type = useMemo(() => media[1]?.type, [media]);
  const thumb2Type = useMemo(() => media[2]?.type, [media]);

  // Generate thumbnail URLs for videos in summary card
  const mainThumbnail = useMemo(() => {
    if (mainType === "video" && media[0]?.cloud) {
      return cloudinaryService.getVideoThumbnailFromUrl(
        media[0].cloud,
        1,
        200,
        240
      );
    }
    return null;
  }, [mainType, media]);

  const thumb1Thumbnail = useMemo(() => {
    if (thumb1Type === "video" && media[1]?.cloud) {
      return cloudinaryService.getVideoThumbnailFromUrl(
        media[1].cloud,
        1,
        150,
        125
      );
    }
    return null;
  }, [thumb1Type, media]);

  const thumb2Thumbnail = useMemo(() => {
    if (thumb2Type === "video" && media[2]?.cloud) {
      return cloudinaryService.getVideoThumbnailFromUrl(
        media[2].cloud,
        1,
        150,
        125
      );
    }
    return null;
  }, [thumb2Type, media]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getUser();
        const userId = session.user?.id;
        if (!userId) return;
        // Fetch collections with thumbnails (compose up to 4 from recent posts' media)
        const { data, error } = await supabase
          .from("collections")
          .select(
            `
            id,name,isPortfolioCollection,
            collection_posts(postId,posts!inner(id,post_media(mediaUrl,order)))
          `
          )
          .eq("ownerId", userId)
          .order("createdAt", { ascending: false });
        if (error) throw new Error(error.message);
        const mapped: RichCollection[] = (data || []).map((c: any) => {
          const medias: string[] = [];
          (c.collection_posts || []).forEach((cp: any) => {
            (cp.posts?.post_media || [])
              .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
              .forEach((pm: any) => medias.push(pm.mediaUrl));
          });
          return {
            id: c.id,
            name: c.name,
            isPortfolioCollection: c.isPortfolioCollection,
            thumbnails: medias.slice(0, 4),
          };
        });
        if (mounted) {
          setCollections(mapped);
          // If collectionId is already set in store (from route params), keep it
          // Otherwise, if we have a collectionId from store, verify it exists in fetched collections
          if (collectionId && !mapped.find((c) => c.id === collectionId)) {
            // Collection doesn't exist, clear it
            setCollectionId(undefined);
            setRedirectToCollectionId(undefined);
          } else if (collectionId && !redirectToCollectionId) {
            // Store the collection ID for redirect after post creation
            setRedirectToCollectionId(collectionId);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch style names for selected styleIds to render chips
  useEffect(() => {
    let active = true;
    (async () => {
      if (!styleIds || styleIds.length === 0) {
        setStyleNames([]);
        return;
      }
      const { data, error } = await supabase
        .from("tattoo_styles")
        .select("id, name")
        .in("id", styleIds);
      if (!error && active && data) {
        setStyleNames(data.map((s) => ({ id: s.id, name: s.name })));
      }
    })();
    return () => {
      active = false;
    };
  }, [styleIds]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    
    try {
      const { data: session } = await supabase.auth.getUser();
      const userId = session.user?.id;
      if (!userId) {
        Alert.alert("Errore", "Utente non autenticato");
        return;
      }
      
      const created = await createCollection(userId, trimmed);
      
      setCollections((prev) => [
        {
          id: created.id,
          name: trimmed,
          thumbnails: [],
          isPortfolioCollection: false,
        },
        ...prev,
      ]);
      setCollectionId(created.id);
      // If no redirect collection ID is set, use the newly created one
      if (!redirectToCollectionId) {
        setRedirectToCollectionId(created.id);
      }
      setNewName("");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating collection:", error);
      Alert.alert(
        "Errore",
        error instanceof Error ? error.message : "Impossibile creare la collection. Riprova."
      );
    }
  };

  // Grid card like profile collections
  const screenWidth = Dimensions.get("window").width;
  const horizontalPadding = 32;
  const gap = 16;
  const itemWidth = Math.floor((screenWidth - horizontalPadding - gap) / 2);

  function GridThumbs({ thumbnails }: { thumbnails: string[] }) {
    const images = thumbnails.slice(0, 4);
    while (images.length < 4) images.push("");

    // Helper: detect video from extension or Cloudinary video URL
    const isVideo = (url: string) =>
      url &&
      (url.endsWith(".mp4") ||
        url.endsWith(".mov") ||
        url.endsWith(".webm") ||
        url.includes("/video/upload"));

    return (
      <View className="flex flex-row flex-wrap w-full aspect-square gap-2">
        {[0, 1].map((row) => (
          <View className="w-full flex-1 gap-2" key={row}>
            {[0, 1].map((col) => {
              const idx = row * 2 + col;
              const url = images[idx];
              const video = isVideo(url);
              // Generate thumbnail URL for videos
              const thumbnailUrl =
                video && url
                  ? cloudinaryService.getVideoThumbnailFromUrl(url, 1, 200, 200)
                  : null;

              return (
                <View
                  key={idx}
                  className="flex-1 bg-[#100c0c77] overflow-hidden aspect-square"
                  style={{
                    minWidth: 0,
                    borderRadius: s(8),
                    position: "relative",
                  }}
                >
                  {url ? (
                    <>
                      {video && thumbnailUrl ? (
                        <Image
                          source={{ uri: thumbnailUrl }}
                          style={{
                            width: "100%",
                            height: "100%",
                            aspectRatio: 1,
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Image
                          source={{ uri: url }}
                          style={{
                            width: "100%",
                            height: "100%",
                            aspectRatio: 1,
                          }}
                          resizeMode="cover"
                        />
                      )}
                      {video && (
                        <View
                          className="absolute inset-0 items-center justify-center"
                          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                        >
                          <SVGIcons.Video width={s(20)} height={s(20)} />
                        </View>
                      )}
                    </>
                  ) : (
                    <View
                      className="border-gray/50 w-full h-full bg-background"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.008)",
                        borderRadius: s(8),
                      }}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  }

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
      <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Summary card */}
        <View className="rounded-2xl bg-black/40 border border-gray px-3 py-3 relative mb-6">
          <View className="flex-row gap-3">
            {/* media (large + two small) */}
            <View className="flex-row items-start" style={{ minWidth: 100 }}>
              <View
                className="rounded-md overflow-hidden bg-black/40 relative"
                style={{ width: 58, height: 70, marginRight: 4 }}
              >
                {media[0] ? (
                  mainType === "video" ? (
                    <>
                      {mainThumbnail ? (
                        <Image
                          source={{ uri: mainThumbnail }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          className="w-full h-full items-center justify-center bg-black/60"
                          style={{
                            borderWidth: s(1),
                            borderColor: "#A49A99",
                            borderRadius: s(6),
                          }}
                        />
                      )}
                      {/* Video icon overlay */}
                      <View
                        className="absolute inset-0 items-center justify-center"
                        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                      >
                        <SVGIcons.Video width={s(20)} height={s(20)} />
                      </View>
                    </>
                  ) : (
                    <Image
                      source={{ uri: media[0].cloud || media[0].uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  )
                ) : (
                  <View />
                )}
              </View>
              <View className="justify-between" style={{ height: 70 }}>
                <View
                  className="rounded-md overflow-hidden bg-black/40 relative"
                  style={{ width: 38, height: 33, marginBottom: 4 }}
                >
                  {media[1] ? (
                    thumb1Type === "video" ? (
                      <>
                        {thumb1Thumbnail ? (
                          <Image
                            source={{ uri: thumb1Thumbnail }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            className="w-full h-full items-center justify-center bg-black/60"
                            style={{
                              borderWidth: s(1),
                              borderColor: "#A49A99",
                              borderRadius: s(6),
                            }}
                          />
                        )}
                        {/* Video icon overlay */}
                        <View
                          className="absolute inset-0 items-center justify-center"
                          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                        >
                          <SVGIcons.Video width={s(15)} height={s(15)} />
                        </View>
                      </>
                    ) : (
                      <Image
                        source={{ uri: media[1].cloud || media[1].uri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    )
                  ) : (
                    <View />
                  )}
                </View>
                <View
                  className="rounded-md overflow-hidden bg-black/40 relative"
                  style={{ width: 38, height: 33 }}
                >
                  {media[2] ? (
                    thumb2Type === "video" ? (
                      <>
                        {thumb2Thumbnail ? (
                          <Image
                            source={{ uri: thumb2Thumbnail }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            className="w-full h-full items-center justify-center bg-black/60"
                            style={{
                              borderWidth: s(1),
                              borderColor: "#A49A99",
                              borderRadius: s(6),
                            }}
                          />
                        )}
                        {/* Video icon overlay */}
                        <View
                          className="absolute inset-0 items-center justify-center"
                          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                        >
                          <SVGIcons.Video width={s(15)} height={s(15)} />
                        </View>
                      </>
                    ) : (
                      <Image
                        source={{ uri: media[2].cloud || media[2].uri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    )
                  ) : (
                    <View />
                  )}
                </View>
              </View>
            </View>
            {/* caption */}
            <View className="flex-1">
              <ScaledText
                numberOfLines={3}
                className="text-gray text-left font-neueMedium"
                allowScaling={false}
                variant="sm"
                style={{ textAlignVertical: "top", width: "100%" }}
              >
                {caption ||
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus blandit augue et rhoncus consectetur....."}
              </ScaledText>
              <Pressable
                onPress={() => router.push("/upload/description")}
                className="absolute right-3 bottom-3 w-6 h-6 items-center justify-center"
              >
                <SVGIcons.Pen1 className="w-5 h-5" />
              </Pressable>
            </View>
          </View>
          {/* styles chip at bottom right under caption */}
          {styleNames.length > 0 && (
            <View className="flex flex-row justify-start mt-2">
              <StylePills styles={styleNames} />
            </View>
          )}
        </View>

        <ScaledText
          allowScaling={false}
          variant="lg"
          className="text-foreground font-neueBold"
          style={{
            marginBottom: mvs(8),
          }}
        >
          Aggiungi a una collection
        </ScaledText>
        {/* Grid of collections */}
        <View className="mb-4">
          {loading ? (
            <View />
          ) : (
            <View>
              {/* Render rows of 2 */}
              {collections
                .reduce((rows: RichCollection[][], item, idx) => {
                  const rowIdx = Math.floor(idx / 2);
                  if (!rows[rowIdx]) rows[rowIdx] = [];
                  rows[rowIdx].push(item);
                  return rows;
                }, [])
                .map((row, rowIdx) => (
                  <View
                    key={rowIdx}
                    style={{
                      flexDirection: "row",
                      marginBottom:
                        rowIdx !== Math.ceil(collections.length / 2) - 1
                          ? gap
                          : 0,
                    }}
                  >
                    {row.map((c, colIdx) => (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setCollectionId(c.id)}
                        activeOpacity={0.9}
                        style={{
                          width: itemWidth,
                          marginRight: colIdx === 0 ? gap : 0,
                        }}
                      >
                        <View
                          style={{
                            borderRadius: 16,
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderWidth: 1,
                            borderColor: "#fff",
                            padding: 8,
                            overflow: "hidden",
                          }}
                        >
                          <GridThumbs thumbnails={c.thumbnails} />
                          {/* selection dot */}
                          <View
                            style={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              width: 24,
                              height: 24,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {collectionId === c.id ? (
                              <SVGIcons.UploadCollectionSelected />
                            ) : (
                              <SVGIcons.UploadCollectionSelection />
                            )}
                          </View>
                        </View>
                        <ScaledText
                          allowScaling={false}
                          variant="sm"
                          className="text-foreground font-neueMedium"
                          style={{
                            marginTop: mvs(8),
                          }}
                          numberOfLines={1}
                        >
                          {c.name}
                        </ScaledText>
                      </TouchableOpacity>
                    ))}
                    {row.length < 2 ? (
                      <View style={{ width: itemWidth }} />
                    ) : null}
                  </View>
                ))}
              {/* Create new */}
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.8}
                className="aspect-square items-center justify-center gap-2 border-dashed border-primary bg-tat-darkMaroon rounded-xl mt-4 mb-20"
                style={{
                  width: itemWidth,
                  borderWidth: s(1),
                }}
              >
                <SVGIcons.AddRed width={s(24)} height={s(24)} />

                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground text-center font-neueMedium"
                >
                  Crea nuova collection
                </ScaledText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <NextBackFooter
        onBack={() => router.back()}
        onNext={() => router.push("/upload/preview")}
        nextDisabled={!canProceed}
        nextLabel="Avanti"
        backLabel="Indietro"
      />

      {/* Create collection modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
        >
          <View className="w-11/12 rounded-2xl bg-tat-foreground p-5 border border-gray flex-col justify-between">
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-foreground font-neueBold"
              style={{ marginBottom: mvs(8) }}
            >
              Crea nuova collection
            </ScaledText>
            <ScaledTextInput
              containerClassName="rounded-xl border border-gray"
              className="text-foreground rounded-xl font-montserratSemibold"
              style={{ fontSize: s(12) }}
              placeholder="Nome collection"
              value={newName}
              onChangeText={setNewName}
            />
            <View
              className="flex-row gap-3"
              style={{
                marginTop: mvs(16),
              }}
            >
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                activeOpacity={0.7}
                className="rounded-full border items-center flex-1 flex-row justify-center text-center border-foreground"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                  gap: s(15),
                  backgroundColor: "transparent",
                  opacity: 1,
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-foreground font-neueSemibold text-center"
                >
                  Annulla
                </ScaledText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={isCreateDisabled ? undefined : handleCreate}
                activeOpacity={0.7}
                disabled={isCreateDisabled}
                className="rounded-full items-center flex-1 flex-row justify-center text-center bg-primary"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(25),
                  paddingRight: s(20),
                  gap: s(15),
                  opacity: isCreateDisabled ? 0.5 : 1,
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="sm"
                  className="text-foreground font-neueSemibold text-center"
                >
                  Crea
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
