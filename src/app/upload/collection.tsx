import { SVGIcons } from "@/constants/svg";
import { createCollection } from "@/services/collection.service";
import { usePostUploadStore } from "@/stores/postUploadStore";
import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const styleId = usePostUploadStore((s) => s.styleId);
  const [styleName, setStyleName] = useState<string | null>(null);

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
        if (mounted) setCollections(mapped);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch style name for selected styleId to render chip
  useEffect(() => {
    let active = true;
    (async () => {
      if (!styleId) {
        setStyleName(null);
        return;
      }
      const { data, error } = await supabase
        .from("tattoo_styles")
        .select("name")
        .eq("id", styleId)
        .single();
      if (!error && active) setStyleName(data?.name || null);
    })();
    return () => {
      active = false;
    };
  }, [styleId]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const { data: session } = await supabase.auth.getUser();
    const userId = session.user?.id;
    if (!userId) return;
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
    setNewName("");
    setShowCreateModal(false);
  };

  // Grid card like profile collections
  const screenWidth = Dimensions.get("window").width;
  const horizontalPadding = 32;
  const gap = 16;
  const itemWidth = Math.floor((screenWidth - horizontalPadding - gap) / 2);

  function GridThumbs({ thumbnails }: { thumbnails: string[] }) {
    const images = thumbnails.slice(0, 4);
    while (images.length < 4) images.push("");
    return (
      <View className="flex flex-row flex-wrap w-full aspect-square gap-2">
        {[0, 1].map((row) => (
          <View className="w-full flex-1 gap-2" key={row}>
            {[0, 1].map((col) => {
              const idx = row * 2 + col;
              const url = images[idx];
              return (
                <View
                  key={idx}
                  className="flex-1 bg-[#100c0c77] rounded overflow-hidden aspect-square"
                  style={{ minWidth: 0 }}
                >
                  {url ? (
                    <Image
                      source={{ uri: url }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="bg-[#100c0c77] w-full h-full" />
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
                className="rounded-md overflow-hidden bg-black/40"
                style={{ width: 58, height: 70, marginRight: 4 }}
              >
                {media[0] ? (
                  <Image
                    source={{ uri: media[0].cloud || media[0].uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View />
                )}
              </View>
              <View className="justify-between" style={{ height: 70 }}>
                <View
                  className="rounded-md overflow-hidden bg-black/40"
                  style={{ width: 38, height: 33, marginBottom: 4 }}
                >
                  {media[1] ? (
                    <Image
                      source={{ uri: media[1].cloud || media[1].uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View />
                  )}
                </View>
                <View
                  className="rounded-md overflow-hidden bg-black/40"
                  style={{ width: 38, height: 33 }}
                >
                  {media[2] ? (
                    <Image
                      source={{ uri: media[2].cloud || media[2].uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View />
                  )}
                </View>
              </View>
            </View>
            {/* caption */}
            <View className="flex-1">
              <Text
                numberOfLines={3}
                className="tat-body-3 text-gray text-left"
                style={{ textAlignVertical: "top", width: "100%" }}
              >
                {caption ||
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus blandit augue et rhoncus consectetur....."}
              </Text>
              <Pressable
                onPress={() => router.push("/upload/description")}
                className="absolute right-3 bottom-3 w-6 h-6 items-center justify-center"
              >
                <SVGIcons.Pen1 className="w-5 h-5" />
              </Pressable>
            </View>
          </View>
          {/* styles chip at bottom right under caption */}
          <View className="flex flex-row justify-start mt-2">
            {styleName && (
              <View className="px-3 py-1 rounded-full border border-foreground/40">
                <Text className="text-foreground tat-body-4">{styleName}</Text>
              </View>
            )}
          </View>
        </View>

        <Text className="text-foreground tat-body-1 font-neueBold mb-4">
          Add to collection
        </Text>
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
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 13,
                            marginTop: 8,
                            fontFamily: "Montserrat-SemiBold",
                          }}
                          numberOfLines={1}
                        >
                          {c.name}
                        </Text>
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
                className="aspect-square items-center justify-center gap-2 border-2 border-dashed border-primary bg-primary/20 rounded-xl mt-4 mb-20"
                style={{
                  width: itemWidth,
                }}
              >
                <SVGIcons.AddRed className="w-8 h-8" />

                <Text
                  style={{ color: "#fff", textAlign: "center", fontSize: 15 }}
                >
                  Create new collection
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="flex-row justify-between px-6 py-4 bg-background z-20">
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-full border border-foreground px-6 py-4"
        >
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/upload/preview")}
          className="rounded-full px-8 py-4 bg-primary"
        >
          <Text className="text-foreground">Next</Text>
        </TouchableOpacity>
      </View>

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
          <View className="w-11/12 rounded-2xl bg-background p-5 border border-gray">
            <Text className="text-foreground tat-body-1 font-neueBold mb-3">
              Create new collection
            </Text>
            <View className="rounded-2xl bg-black/40 border border-gray mb-4">
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Collection name"
                placeholderTextColor="#A49A99"
                className="px-4 py-3 text-base text-foreground"
              />
            </View>
            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                className="rounded-full border border-foreground px-5 py-2"
              >
                <Text className="text-foreground">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                className="rounded-full bg-primary px-5 py-2"
              >
                <Text className="text-foreground">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
