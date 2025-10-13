import { SVGIcons } from "@/constants/svg";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Image, Text, TouchableOpacity, View, ScrollView } from "react-native";

interface Collection {
  id: string;
  name: string;
  isPortfolioCollection: boolean;
  thumbnails: string[];
}

interface CollectionsSectionProps {
  collections: Collection[];
  onCreateNewCollection?: () => void;
}

const COLLECTION_GAP = 12;
const NUM_COLUMNS = 2;

export const CollectionsSection: React.FC<CollectionsSectionProps> = ({
  collections,
  onCreateNewCollection,
}) => {
  const router = useRouter();

  const handleCollectionPress = (collectionId: string) => {
    router.push(`/collection/${collectionId}` as any);
  };

  if (!collections || collections.length === 0) {
    return null;
  }

  // Helper to build 2x2 grid for collection images
  function renderThumbnailGrid(thumbnails: string[]) {
    // Always fill to 4 "slots"
    const images = thumbnails.slice(0, 4);
    while (images.length < 4) {
      images.push(""); // empty string means no image, placeholder
    }
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
                  className="flex-1 bg-gray-200 rounded overflow-hidden aspect-square gap-2"
                  style={{
                    minWidth: 0,
                  }}
                >
                  {url ? (
                    <Image
                      source={{ uri: url }}
                      style={{ width: "100%", height: "100%", aspectRatio: 1 }}
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

  // Calculate width for each item to fit 2 columns, similar to grid-cols-2 with gap
  const screenWidth = Dimensions.get("window").width;
  const horizontalPadding = 32; // px-4 left/right = 16*2
  const itemGap = COLLECTION_GAP;
  const itemWidth = Math.floor((screenWidth - horizontalPadding - itemGap) / NUM_COLUMNS);

  // Create the row-major order grid layout
  const renderGridItems = () => {
    // We want to alternate left/right, row by row, per instructions
    // So we chunk the collections into rows of 2
    const items = [...collections];
    // Insert the "create new" as the last one
    items.push({ id: "__new__", name: "", isPortfolioCollection: false, thumbnails: [] });

    const rows = [];
    for (let i = 0; i < items.length; i += NUM_COLUMNS) {
      const row = items.slice(i, i + NUM_COLUMNS);
      rows.push(row);
    }
    // Make sure last row has 2 columns for consistent layout (fill empty if needed)
    if (rows.length && rows[rows.length - 1].length < NUM_COLUMNS) {
      while (rows[rows.length - 1].length < NUM_COLUMNS) {
        rows[rows.length - 1].push(null as any);
      }
    }
    return (
      <View>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={{ flexDirection: "row", marginBottom: rowIdx !== rows.length - 1 ? itemGap : 0 }}>
            {row.map((collection, colIdx) => {
              if (!collection) {
                // Empty spot, render transparent view for grid consistency
                return <View key={colIdx} style={{ width: itemWidth, marginRight: colIdx === 0 ? itemGap : 0 }} />;
              }
              if (collection.id === "__new__") {
                return (
                  <TouchableOpacity
                    key="new"
                    onPress={onCreateNewCollection}
                    activeOpacity={0.8}
                    style={{
                      width: itemWidth,
                      minWidth: 140,
                      maxWidth: 180,
                      aspectRatio: 1,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: "#FF4646",
                      borderStyle: "dashed",
                      backgroundColor: "rgba(255, 70, 70, 0.12)", // bg-primary/20
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: colIdx === 0 ? itemGap : 0,
                      padding: 10,
                    }}
                  >
                    <SVGIcons.AddRed className="w-8 h-8" />
                    <Text style={{ color: "#fff", textAlign: "center", fontSize: 15, marginTop: 8 }}>
                      Create new collection
                    </Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={collection.id}
                  onPress={() => handleCollectionPress(collection.id)}
                  activeOpacity={0.9}
                  style={{
                    width: itemWidth,
                    minWidth: 140,
                    maxWidth: 180,
                    marginRight: colIdx === 0 ? itemGap : 0,
                  }}
                >
                  <View
                    style={{
                      borderRadius: 16,
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderWidth: 1,
                      borderColor: "#fff",
                      padding: 8,
                      flex: 1,
                      width: "100%",
                      height: "100%",
                      overflow: "hidden",
                    }}
                  >
                    {renderThumbnailGrid(collection.thumbnails)}
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
                    {collection.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
      <Text
        style={{
          color: "#fff",
          fontWeight: "bold",
          fontFamily: "Montserrat-SemiBold",
          marginBottom: 12,
          fontSize: 16,
          lineHeight: 23,
        }}
      >
        Collections
      </Text>
      <ScrollView
        horizontal={false}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{}}
      >
        {renderGridItems()}
      </ScrollView>
    </View>
  );
};
