import { SVGIcons } from "@/constants/svg";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

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

  return (
    <View className="px-4 mt-8">
      <Text className="text-foreground font-bold font-montserratSemibold mb-3 text-[16px] leading-[23px]">
        Collections
      </Text>
      <View className="flex-row gap-3">
        {collections.map((collection) => (
          <TouchableOpacity
            key={collection.id}
            onPress={() => handleCollectionPress(collection.id)}
            className="flex-1 min-w-[140px] max-w-[180px] h-full"
          >
            <View className="rounded-xl bg-background/50 blur-sm backdrop-blur-sm border border-foreground p-2 flex-1 w-full h-full">
              {renderThumbnailGrid(collection.thumbnails)}
            </View>
            <Text
              className="text-foreground text-xs mt-2 font-montserratSemibold"
              numberOfLines={2}
            >
              {collection.name}
            </Text>
          </TouchableOpacity>
        ))}
        {/* Create new collection card */}
        <TouchableOpacity
          onPress={onCreateNewCollection}
          className="rounded-xl border-2 border-dashed border-primary bg-primary/20 p-3 flex-1 aspect-square items-center justify-center gap-2"
          style={{ maxWidth: 180, minWidth: 140 }}
        >
          <SVGIcons.AddRed className="w-8 h-8" />
          <Text className="text-foreground text-center text-sm">
            Create new collection
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
