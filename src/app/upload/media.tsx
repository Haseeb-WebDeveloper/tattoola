import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import {
  canProceedFromMedia,
  usePostUploadStore,
} from "@/stores/postUploadStore";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";

export default function UploadMediaStep() {
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();
  const media = usePostUploadStore((s) => s.media);
  const setMedia = usePostUploadStore((s) => s.setMedia);
  const addMedia = usePostUploadStore((s) => s.addMedia);
  const removeMediaAt = usePostUploadStore((s) => s.removeMediaAt);

  const canProceed = useMemo(
    () => canProceedFromMedia(usePostUploadStore.getState()),
    [media]
  );

  const handlePickMedia = async () => {
    const files = await pickFiles({
      mediaType: "all",
      allowsMultipleSelection: true,
      maxFiles: 5,
      cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions("image"),
    });
    if (!files || files.length === 0) return;

    const locals = files.slice(0, 5).map((f) => ({
      uri: f.uri,
      type: f.type === "video" ? "video" : ("image" as const),
    }));
    addMedia(locals as any);

    const uploaded = await uploadToCloudinary(
      files,
      cloudinaryService.getPortfolioUploadOptions("image")
    );

    setMedia(
      usePostUploadStore.getState().media.map((m) => {
        const match = uploaded.find((u) => u.uri === m.uri);
        return match?.cloudinaryResult?.secureUrl
          ? { ...m, cloud: match.cloudinaryResult.secureUrl }
          : m;
      })
    );
  };

  const onDragEnd = ({ data }: { data: typeof media }) => setMedia(data);

  const renderMediaItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<{
    uri: string;
    type: "image" | "video";
    cloud?: string;
  }>) => {
    const index = media.findIndex((m) => m.uri === item.uri);
    return (
      <Pressable
        onLongPress={drag}
        disabled={isActive}
        className={`flex-row items-center mb-3 p-3 rounded-xl ${isActive ? "bg-primary/20" : "bg-black/40"}`}
      >
        <View className="w-20 h-16 bg-gray/30 mr-3 overflow-hidden rounded-lg">
          <Image
            source={{ uri: item.cloud || item.uri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        <View className="flex-1">
          <Text className="text-foreground/80 text-sm">
            {item.type.toUpperCase()}
          </Text>
          <Text className="text-foreground/60 text-xs">Hold to reorder</Text>
        </View>
        <TouchableOpacity
          onPress={() => removeMediaAt(index)}
          className="w-6 h-6 items-center justify-center"
        >
          <SVGIcons.Close className="w-4 h-4 text-error" />
        </TouchableOpacity>
      </Pressable>
    );
  };

  // Ensure the media section is scrollable if the list is too long.
  // Give the media list area maxHeight and enable scrolling.

  return (
    <View className="flex-1 bg-black">
      <View className="flex-1" style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <View className="px-6 pt-6">
            <View className="">
              <Text className="text-foreground tat-body-1 font-neueBold mb-0.5">
                Carica foto e video
              </Text>
              <Text className="tat-body-4 text-gray mb-6">
                You need to select atleast <Text className="text-[#FF7F56]">one photo</Text> and 3 photos/videos
              </Text>
            </View>

            <View className="border-2 border-dashed border-error/70 rounded-2xl bg-primary/20 items-center py-10 mb-6">
              <SVGIcons.Upload className="w-16 h-16" />
              <TouchableOpacity
                onPress={handlePickMedia}
                disabled={uploading}
                className="bg-primary rounded-full py-3 px-6 mt-4"
              >
                <Text className="text-foreground tat-body-1 font-neueBold">
                  {uploading ? "Uploading..." : "Upload files"}
                </Text>
              </TouchableOpacity>
              <Text className="text-foreground/80 mt-6 text-center px-4">
                JPG/PNG up to 5MB. MP4/MOV/AVI up to 10MB. Drag to reorder.
              </Text>
            </View>

            {media.length > 0 && (
              <View className="mb-6">
                <Text className="text-foreground mb-3 tat-body-2-med">
                  Uploaded files
                </Text>
                <View style={{ maxHeight: 350 }}>
                  <DraggableFlatList
                    data={media}
                    onDragEnd={onDragEnd}
                    keyExtractor={(item, index) => `${item.uri}-${index}`}
                    renderItem={renderMediaItem}
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 10 }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        <View className="flex-row justify-between px-6 py-4 bg-background ">
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-full border border-foreground px-6 py-4"
          >
            <Text className="text-foreground">Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!canProceed}
            onPress={() => router.push("/upload/description")}
            className={`rounded-full px-8 py-4 ${canProceed ? "bg-primary" : "bg-gray/40"}`}
          >
            <Text className="text-foreground">Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
