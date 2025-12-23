import DeleteImageConfirmModal from "@/components/ui/DeleteImageConfirmModal";
import DiscardPostConfirmModal from "@/components/ui/DiscardPostConfirmModal";
import NextBackFooter from "@/components/ui/NextBackFooter";
import ScaledText from "@/components/ui/ScaledText";
import { CustomToast } from "@/components/ui/CustomToast";
import { COLLECTION_NAME, UPLOAD_MAX_IMAGE_SIZE, UPLOAD_MAX_VIDEO_SIZE } from "@/constants/limits";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/providers/AuthProvider";
import { cloudinaryService } from "@/services/cloudinary.service";
import {
  canProceedFromMedia,
  usePostUploadStore,
} from "@/stores/postUploadStore";
import { getFileNameFromUri } from "@/utils/get-file-name";
import { s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { TrimText } from "@/utils/text-trim";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";

export default function UploadMediaStep() {
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();
  const params = useLocalSearchParams<{ collectionId?: string }>();
  const { user } = useAuth();
  const media = usePostUploadStore((s) => s.media);
  const setMedia = usePostUploadStore((s) => s.setMedia);
  const addMedia = usePostUploadStore((s) => s.addMedia);
  const removeMediaAt = usePostUploadStore((s) => s.removeMediaAt);
  const setCollectionId = usePostUploadStore((s) => s.setCollectionId);
  const resetPostUpload = usePostUploadStore((s) => s.reset);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [imageToDeleteIndex, setImageToDeleteIndex] = useState<number | null>(
    null
  );

  // Set collection ID from route params if provided
  useEffect(() => {
    if (params.collectionId) {
      setCollectionId(params.collectionId);
    }
  }, [params.collectionId, setCollectionId]);

  // For artists, default to their ALL_POSTS collection if none is set.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user?.id || user.role !== "ARTIST") return;
        // If collection is already chosen (via route or store), don't override.
        if (usePostUploadStore.getState().collectionId) return;

        const { data, error } = await supabase
          .from("collections")
          .select("id,name")
          .eq("ownerId", user.id)
          .eq("name", COLLECTION_NAME.ALL_POSTS)
          .maybeSingle();

        if (!mounted || error || !data?.id) return;

        setCollectionId(data.id);
      } catch {
        // Fail silently; user can still pick a collection manually if needed.
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id, user?.role, setCollectionId]);

  const canProceed = useMemo(
    () => canProceedFromMedia(usePostUploadStore.getState()),
    [media]
  );

  const openDiscardModal = useCallback(() => {
    // Only show discard modal if there are changes (media uploaded)
    if (media.length > 0) {
      setShowDiscardModal(true);
    } else {
      // No changes, navigate back directly
      resetPostUpload();
      router.replace("/(tabs)");
    }
  }, [media.length, resetPostUpload]);

  const handleConfirmDiscard = useCallback(() => {
    resetPostUpload();
    setShowDiscardModal(false);
    // Match the header close behaviour: go back to the main home tab.
    router.replace("/(tabs)");
  }, [resetPostUpload]);

  const handleCancelDiscard = useCallback(() => {
    setShowDiscardModal(false);
  }, []);

  // Intercept Android hardware back on this screen to show the same
  // confirmation as the header/Indietro button.
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        openDiscardModal();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [openDiscardModal])
  );

  const handlePickMedia = async () => {
    const currentMediaCount = media.length;
    const remainingSlots = 5 - currentMediaCount;
    if (remainingSlots <= 0) return;

    const files = await pickFiles({
      mediaType: "all",
      allowsMultipleSelection: true,
      maxFiles: remainingSlots,
      cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions("image"),
    });
    if (!files || files.length === 0) return;

    // Validate file sizes: Images (JPG/PNG) max 5MB, Videos (MP4/MOV/AVI) max 10MB
    const invalidFiles: string[] = [];
    const validFiles: typeof files = [];
    
    for (const file of files) {
      const maxSize = file.type === "video" ? UPLOAD_MAX_VIDEO_SIZE : UPLOAD_MAX_IMAGE_SIZE;
      const fileTypeLabel = file.type === "video" ? "video" : "immagine";
      const maxSizeLabel = file.type === "video" ? "10MB" : "5MB";
      
      if (file.fileSize && file.fileSize > maxSize) {
        invalidFiles.push(`${file.fileName || fileTypeLabel} (${(file.fileSize / (1024 * 1024)).toFixed(2)}MB > ${maxSizeLabel})`);
      } else {
        validFiles.push(file);
      }
    }

    // Show error for invalid files
    if (invalidFiles.length > 0) {
      const errorMessage =
        invalidFiles.length === 1
          ? `Il file "${invalidFiles[0]}" supera il limite di dimensione.`
          : `${invalidFiles.length} file superano il limite di dimensione.`;
      
      const toastId = toast.custom(
        <CustomToast
          message={`${errorMessage} JPG/PNG: max 5MB. MP4/MOV/AVI: max 10MB.`}
          iconType="error"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 4000 }
      );
      // Remove invalid files from the list
      if (validFiles.length === 0) return;
    }

    if (validFiles.length === 0) return;

    const locals = validFiles.slice(0, remainingSlots).map((f) => ({
      uri: f.uri,
      type: f.type === "video" ? "video" : ("image" as const),
    }));
    addMedia(locals as any);

    const uploaded = await uploadToCloudinary(
      validFiles,
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

  const handleDeleteImage = (index: number) => {
    setImageToDeleteIndex(index);
    setShowDeleteImageModal(true);
  };

  const confirmDeleteImage = () => {
    if (imageToDeleteIndex !== null) {
      removeMediaAt(imageToDeleteIndex);
      setShowDeleteImageModal(false);
      setImageToDeleteIndex(null);
    }
  };

  const cancelDeleteImage = () => {
    setShowDeleteImageModal(false);
    setImageToDeleteIndex(null);
  };

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

    // Generate thumbnail URL for videos
    const thumbnailUrl =
      item.type === "video" && item.cloud
        ? cloudinaryService.getVideoThumbnailFromUrl(item.cloud, 1, 200, 200)
        : null;

    // precise to screenshot: show box with border, dark background, round corners, trash at top right, drag handle at left.
    return (
      <View
        className="mb-4"
        style={{
          position: "relative",
        }}
      >
        <View
          className="flex-row items-center py-1 border bg-gray-foreground border-gray rounded-xl"
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
            className="overflow-hidden rounded-lg h-fit aspect-square relative"
            style={{ width: 65, marginRight: 16 }}
          >
            {item.type === "image" ? (
              <Image
                source={{ uri: item.cloud || item.uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <>
                {thumbnailUrl ? (
                  <Image
                    source={{ uri: thumbnailUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="items-center justify-center border rounded-lg bg-tat-darkMaroon border-gray"
                    style={{ width: "100%", height: "100%" }}
                  />
                )}
                {/* Video icon overlay */}
                <View
                  className="absolute inset-0 items-center justify-center"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                >
                  <SVGIcons.Video width={30} height={30} />
                </View>
              </>
            )}
          </View>
          {/* Filename */}
          <View style={{ flex: 1 }}>
            <ScaledText
              allowScaling={false}
              variant="11"
              className="text-foreground font-neueLight"
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
            </ScaledText>
          </View>
          {/* Trash/Delete */}
          <TouchableOpacity
            onPress={() => handleDeleteImage(index)}
            style={{
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              top: -12, // give a bit of overlap without being clipped
              right: 0,
              elevation: 4,
              zIndex: 100,
            }}
            className="items-center justify-center w-8 h-8 p-2 border rounded-full bg-foreground border-foreground elevation-2"
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
      <DiscardPostConfirmModal
        visible={showDiscardModal}
        onCancel={handleCancelDiscard}
        onConfirm={handleConfirmDiscard}
      />
      <DeleteImageConfirmModal
        visible={showDeleteImageModal}
        onCancel={cancelDeleteImage}
        onConfirm={confirmDeleteImage}
      />
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
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-foreground font-neueBold mb-0.5"
              >
                Carica foto e video
              </ScaledText>
              <ScaledText
                allowScaling={false}
                variant="11"
                className="mb-6 text-gray font-neueMedium"
              >
                Devi selezionare almeno{" "}
                <ScaledText
                  allowScaling={false}
                  variant="11"
                  className="text-[#FF7F56] font-neueMedium"
                >
                  una foto
                </ScaledText>{" "}
                e massimo 5 foto/video
              </ScaledText>
            </View>

            {media.length < 5 && (
              <View
                className="items-center border-dashed border-error/70 rounded-2xl bg-primary/20"
                style={{
                  paddingVertical: s(24),
                  paddingHorizontal: s(16),
                  borderWidth: s(1),
                }}
              >
                <SVGIcons.Upload className="w-16 h-16" />
                {uploading ? (
                  <View
                    className="rounded-full border-warning border-r-gray animate-spin-slow"
                    style={{
                      width: s(24),
                      height: s(24),
                      borderWidth: s(2),
                      marginTop: s(12),
                    }}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={handlePickMedia}
                      disabled={uploading}
                      className="rounded-full bg-primary"
                      style={{
                        marginTop: s(12),
                        paddingVertical: s(8),
                        paddingHorizontal: s(20),
                      }}
                    >
                      <ScaledText
                        allowScaling={false}
                        variant="md"
                        className="text-foreground font-neueBold"
                      >
                        Carica file
                      </ScaledText>
                    </TouchableOpacity>
                  </>
                )}
                <ScaledText
                  allowScaling={false}
                  variant="11"
                  className="text-center text-foreground/80 font-neueBold"
                  style={{
                    marginTop: s(12),
                    paddingHorizontal: s(16),
                  }}
                >
                  JPG/PNG fino a 5MB. MP4/MOV/AVI fino a 10MB.
                </ScaledText>
              </View>
            )}

            {media.length > 0 && (
              <View className="">
                <ScaledText
                  allowScaling={false}
                  variant="11"
                  className="text-foreground font-montserratMedium"
                  style={{
                    marginTop: s(16),
                  }}
                >
                  File caricati
                </ScaledText>
                <View>
                  <DraggableFlatList
                    data={media}
                    onDragEnd={onDragEnd}
                    keyExtractor={(item, index) => `${item.uri}-${index}`}
                    renderItem={renderMediaItem}
                    scrollEnabled={true}
                    removeClippedSubviews={false}
                    style={{ maxHeight: media.length * 100 }}
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

        <NextBackFooter
          containerClassName="bg-red-500"
          onBack={openDiscardModal}
          onNext={() => router.push("/upload/description")}
          nextDisabled={!canProceed}
          nextLabel="Avanti"
          backLabel="Indietro"
        />
      </View>
    </View>
  );
}
