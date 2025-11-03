import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import {
  canProceedFromMedia,
  usePostUploadStore,
} from "@/stores/postUploadStore";
import { TrimText } from "@/utils/text-trim";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { getFileNameFromUri } from "@/utils/get-file-name";
import { LinearGradient } from "expo-linear-gradient";
import ScaledText from "@/components/ui/ScaledText";

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
    // precise to screenshot: show box with border, dark background, round corners, trash at top right, drag handle at left.
    return (
      <View
        className="mb-4"
        style={{
          position: "relative",
        }}
      >
        <View
          className="bg-gray-foreground border border-gray rounded-xl flex-row items-center py-1"
          style={{
            paddingLeft: 0,
            minHeight: 70,
            paddingRight: 0,
            overflow: "visible",
            position: "relative",
          }}
        >
          {/* Drag Handle */}
          <Pressable
            onLongPress={drag}
            disabled={isActive}
            style={{
              width: 40,
              height: 68,
              justifyContent: "center",
              alignItems: "center",
              marginLeft: 8,
              marginRight: 8,
            }}
            accessibilityLabel="Reorder"
          >
            {/* Drag icon */}
            <SVGIcons.Drag className="w-6 h-6" />
          </Pressable>
          {/* Thumb */}
          <View
            className="overflow-hidden rounded-lg h-fit aspect-square"
            style={{ width: 65, marginRight: 16 }}
          >
            {item.type === "image" ? (
              <Image
                source={{ uri: item.cloud || item.uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="items-center justify-center bg-tat-darkMaroon border border-gray rounded-lg"
                style={{ width: "100%", height: "100%" }}
              >
                <SVGIcons.Video width={30} height={30} />
              </View>
            )}
          </View>
          {/* Filename */}
          <View style={{ flex: 1 }}>
            <Text
              className="text-foreground"
              style={{ fontSize: 16, fontWeight: "400" }}
            >
              {(() => {
                const fullName = getFileNameFromUri(item.uri);
                const lastDot = fullName.lastIndexOf(".");
                let base = fullName;
                let ext = "";
                if (lastDot !== -1 && lastDot < fullName.length - 1) {
                  base = fullName.slice(0, lastDot);
                  ext = fullName.slice(lastDot);
                }
                return `${TrimText(base, 15)}${ext}`;
              })()}
            </Text>
          </View>
          {/* Trash/Delete */}
          <TouchableOpacity
            onPress={() => removeMediaAt(index)}
            style={{
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              top: -12, // give a bit of overlap without being clipped
              right: 0,
              elevation: 4,
              zIndex: 100,
            }}
            className="bg-foreground rounded-full border border-foreground p-2 items-center justify-center  elevation-2 w-8 h-8"
            accessibilityLabel="Remove"
          >
            <SVGIcons.Trash className="w-5 h-5" style={{ color: "#ff4c4c" }} />
          </TouchableOpacity>
        </View>
      </View>
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
      <View className="flex-1" style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <View className="px-6 pt-6">
            <View className="">
              <Text className="text-foreground tat-body-1 font-neueBold mb-0.5">
                Carica foto e video
              </Text>
              <Text className="tat-body-4 text-gray mb-6">
                You need to select atleast{" "}
                <Text className="text-[#FF7F56]">one photo</Text> and 3
                photos/videos
              </Text>
            </View>

            <View className="border-2 border-dashed border-error/70 rounded-2xl bg-primary/20 items-center py-10 mb-6">
              <SVGIcons.Upload className="w-16 h-16" />
              <TouchableOpacity
                onPress={handlePickMedia}
                disabled={uploading}
                className="bg-primary rounded-full py-3 px-6 mt-4"
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueBold"
                >
                  {uploading ? "Uploading..." : "Upload files"}
                </ScaledText>
              </TouchableOpacity>
              <Text className="text-foreground/80 mt-6 text-center px-4">
                JPG/PNG up to 5MB. MP4/MOV/AVI up to 10MB. Drag to reorder.
              </Text>
            </View>

            {media.length > 0 && (
              <View className="">
                <Text className="text-foreground tat-body-2-med pb-2">
                  Uploaded files
                </Text>
                <View style={{ maxHeight: 350 }}>
                  <DraggableFlatList
                    data={media}
                    onDragEnd={onDragEnd}
                    keyExtractor={(item, index) => `${item.uri}-${index}`}
                    renderItem={renderMediaItem}
                    scrollEnabled={true}
                    removeClippedSubviews={false}
                    style={{ maxHeight: 350 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingBottom: 90,
                      paddingTop: 14,
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        <View className="flex-row justify-between px-6 py-4 bg-background">
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
