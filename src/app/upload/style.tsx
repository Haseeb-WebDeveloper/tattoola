import { SVGIcons } from "@/constants/svg";
import { fetchTattooStyles, TattooStyleItem } from "@/services/style.service";
import { usePostUploadStore } from "@/stores/postUploadStore";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function UploadStyleStep() {
  const styleId = usePostUploadStore((s) => s.styleId);
  const setStyleId = usePostUploadStore((s) => s.setStyleId);
  const media = usePostUploadStore((s) => s.media);
  const caption = usePostUploadStore((s) => s.caption);
  const [styles, setStyles] = useState<TattooStyleItem[]>([]);
  const [loading, setLoading] = useState(true);

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
  const thumb1 = useMemo(() => media[1]?.cloud || media[1]?.uri, [media]);
  const thumb2 = useMemo(() => media[2]?.cloud || media[2]?.uri, [media]);

  const renderItem = ({ item }: { item: TattooStyleItem }) => {
    const isSelected = styleId === item.id;
    return (
      <View className="flex-row items-center px-4 border-b border-gray/20">
        <Pressable
          className="w-10 items-center"
          onPress={() => setStyleId(item.id)}
        >
          <View
            className={`w-5 h-5 rounded-[4px] border ${isSelected ? "bg-error border-error" : "bg-transparent border-foreground/50"}`}
          />
        </Pressable>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            className="w-36 h-28"
            resizeMode="cover"
          />
        ) : (
          <View className="w-36 h-28 bg-gray/30" />
        )}
        <View className="flex-1 px-4">
          <Text className="text-foreground tat-body-1 font-neueBold">
            {item.name}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      {/* Summary card with media + caption */}
      <View className="px-6 mb-6 pt-6">
        <View className="rounded-2xl bg-black/40 border border-gray px-3 py-3 relative">
          <View className="flex-row gap-3">
            {/* Left media column: big + two small */}
            <View className="flex-row items-start" style={{ minWidth: 100 }}>
              {/* Main Image */}
              <View
                className="rounded-md overflow-hidden bg-black/40"
                style={{
                  width: 58,
                  height: 70,
                  marginRight: 4,
                }}
              >
                {main ? (
                  <Image
                    source={{ uri: main }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
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
                  className="rounded-md overflow-hidden bg-black/40"
                  style={{
                    width: 38,
                    height: 33,
                    marginBottom: 4,
                  }}
                >
                  {thumb1 ? (
                    <Image
                      source={{ uri: thumb1 }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
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
                  className="rounded-md overflow-hidden bg-black/40"
                  style={{
                    width: 38,
                    height: 33,
                  }}
                >
                  {thumb2 ? (
                    <Image
                      source={{ uri: thumb2 }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
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
                <Text
                  numberOfLines={3}
                  className="tat-body-3 text-gray text-left"
                  style={{ textAlignVertical: "top", width: "100%" }}
                >
                  {caption ||
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus blandit augue et rhoncus consectetur....."}
                </Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/upload/description")}
            className="absolute right-3 bottom-3 w-6 h-6 items-center justify-center"
          >
            <SVGIcons.Pen1 className="w-5 h-5" />
          </Pressable>
        </View>
      </View>
      <View className="px-6 mb-4">
        <Text className="text-foreground tat-body-1 font-neueBold mb-0.5">
          Select styles
        </Text>
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
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        )}
      </View>

      <View className="flex-row justify-between px-6 py-4 bg-background">
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-full border border-foreground px-6 py-4"
        >
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!styleId}
          onPress={() => router.push("/upload/collection")}
          className={`rounded-full px-8 py-4 ${styleId ? "bg-primary" : "bg-gray/40"}`}
        >
          <Text className="text-foreground">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
