import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/providers/AuthProvider";
import {
  addStudioPhoto,
  deleteStudioPhoto,
  fetchStudioPhotos,
} from "@/services/studio.service";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Calculate photo width: screen width - horizontal padding (32) - gap between columns (9) / 2 columns
const PHOTO_WIDTH = (SCREEN_WIDTH - s(32) - s(12)) / 2;

interface StudioPhoto {
  id: string;
  imageUrl: string;
  order: number;
  caption?: string | null;
}

export default function StudioPhotosScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    pickFiles,
    uploadToCloudinary,
    uploading: fileUploading,
  } = useFileUpload();

  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<StudioPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<StudioPhoto | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadPhotos();
    }
  }, [user?.id]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const result = await fetchStudioPhotos(user!.id);
      setPhotos(result.photos);
    } catch (error: any) {
      console.error("Error loading photos:", error);
      toast.error(error.message || "Failed to load photos");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhotos = async () => {
    try {
      const selectedFiles = await pickFiles({
        mediaType: "image",
        allowsMultipleSelection: true,
        maxFiles: 10,
      });

      if (selectedFiles.length === 0) return;

      setUploading(true);

      // Upload to Cloudinary
      const uploadedFiles = await uploadToCloudinary(selectedFiles, {
        folder: "studio_photos",
      });

      // Add each photo to the database
      for (const file of uploadedFiles) {
        if (file.cloudinaryResult?.secureUrl) {
          await addStudioPhoto(user!.id, file.cloudinaryResult.secureUrl);
        }
      }

      toast.success("Photos uploaded successfully");
      await loadPhotos();
    } catch (error: any) {
      console.error("Error uploading photos:", error);
      toast.error("Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePress = (photo: StudioPhoto) => {
    setPhotoToDelete(photo);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;

    try {
      setDeleting(photoToDelete.id);
      setDeleteModalVisible(false);

      const result = await deleteStudioPhoto(photoToDelete.id);
      if (result.success) {
        toast.success("Photo deleted");
        setPhotos((prev) => prev.filter((p) => p.id !== photoToDelete.id));
      } else {
        toast.error(result.error || "Failed to delete photo");
      }
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to delete photo");
    } finally {
      setDeleting(null);
      setPhotoToDelete(null);
    }
  };

  const handlePhotoPress = (index: number) => {
    setSelectedPhotoIndex(index);
    setPreviewModalVisible(true);
  };

  const handleBack = () => {
    router.back();
  };

  const renderPhotoItem = ({
    item,
    index,
  }: {
    item: StudioPhoto;
    index: number;
  }) => {
    const isDeleting = deleting === item.id;

    return (
      <TouchableOpacity
        onPress={() => handlePhotoPress(index)}
        style={{
          width: "100%",
          height: mvs(98),
          borderRadius: s(8),
          overflow: "hidden",
          position: "relative",
        }}
        disabled={isDeleting}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: "100%", height: "100%", borderRadius: s(8) }}
          resizeMode="cover"
        />

        {isDeleting && (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", borderRadius: s(8) }}
          >
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}

        {/* Drag handle (left side) */}
        {/* <View
          style={{
            position: "absolute",
            left: s(7),
            top: mvs(9),
            width: s(7),
            height: mvs(11),
          }}
        >
          <SVGIcons.Drag style={{ width: s(7), height: mvs(11) }} />
        </View> */}

        {/* Delete button */}
        {!isDeleting && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDeletePress(item);
            }}
            className="absolute bg-white rounded-full items-center justify-center"
            style={{
              width: s(16),
              height: s(16),
              right: s(8),
              top: mvs(8),
            }}
          >
            <SVGIcons.Delete style={{ width: s(6), height: mvs(6) }} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View
      className="items-center justify-center"
      style={{ marginTop: mvs(100) }}
    >
      <ScaledText
        allowScaling={false}
        variant="md"
        className="text-gray font-neueLight text-center"
      >
        No photos yet
      </ScaledText>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: mvs(32) }}
          >
            {/* Header */}
            <View
              className="flex-row items-center justify-center relative"
              style={{
                paddingHorizontal: s(16),
                paddingVertical: mvs(16),
                marginBottom: mvs(24),
              }}
            >
              <TouchableOpacity
                onPress={handleBack}
                className="absolute rounded-full bg-foreground/20 items-center justify-center"
                style={{
                  width: s(34),
                  height: s(34),
                  left: s(16),
                  padding: s(8),
                }}
              >
                <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
              </TouchableOpacity>

              <View className="flex-row items-center" style={{ gap: s(8) }}>
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-white font-neueBold"
                >
                  Foto dello studio
                </ScaledText>
                <SVGIcons.DimondRed width={s(20)} height={s(20)} />
              </View>
            </View>

            {/* Divider */}
            <View
              className="bg-gray"
              style={{ height: s(1), marginBottom: mvs(24), marginHorizontal: s(16) }}
            />

            {/* Description */}
            <View style={{ paddingHorizontal: s(16), marginBottom: mvs(16) }}>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-white font-neueLight"
              >
                In questa sezione puoi aggiungere le foto del tuo studio
              </ScaledText>
            </View>

            {/* Upload Area */}
            <TouchableOpacity
              onPress={handleUploadPhotos}
              disabled={uploading || fileUploading || loading}
              className="border border-dashed items-center justify-center"
              style={{
                marginHorizontal: s(16),
                paddingVertical: mvs(32),
                paddingHorizontal: s(24),
                borderRadius: s(8),
                backgroundColor: "#140404",
                borderColor: "#AE0E0E",
                gap: mvs(10),
                marginBottom: mvs(32),
              }}
            >
              <SVGIcons.Upload width={s(48)} height={s(48)} />
              <View
                className="bg-primary"
                style={{
                  paddingVertical: mvs(8),
                  paddingHorizontal: s(20),
                  borderRadius: s(100),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueBold"
                >
                  {uploading || fileUploading ? "Uploading..." : "Upload files"}
                </ScaledText>
              </View>

              <ScaledText
                allowScaling={false}
                variant="body4"
                className="text-gray font-neueBold text-center"
              >
                Supporta JPG, PNG, max size 5MB
              </ScaledText>
            </TouchableOpacity>

            {/* Photos Grid */}
            {loading ? (
              <View
                className="items-center justify-center"
                style={{ paddingVertical: mvs(48) }}
              >
                <ActivityIndicator size="large" color="#AE0E0E" />
              </View>
            ) : photos.length === 0 ? (
              renderEmptyState()
            ) : (
              <View style={{ paddingHorizontal: s(16) }}>
                <View className="flex-row flex-wrap">
                  {photos.map((item, index) => {
                    const isRightColumn = index % 2 === 1;
                    return (
                      <View
                        key={item.id}
                        style={{
                          width: PHOTO_WIDTH,
                          marginRight: isRightColumn ? 0 : s(9),
                          marginBottom: mvs(9),
                        }}
                      >
                        {renderPhotoItem({ item, index })}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <View
            className="bg-white items-center"
            style={{
              width: s(361),
              paddingTop: mvs(20),
              paddingBottom: mvs(24),
              paddingHorizontal: s(20),
              borderRadius: s(8),
            }}
          >
            {/* Warning Icon */}
            <View
              className="items-center justify-center"
              style={{
                width: s(36),
                height: s(36),
                borderRadius: s(56),
                backgroundColor: "rgba(255, 127, 86, 0.1)",
                marginBottom: mvs(16),
              }}
            >
              <SVGIcons.Warning width={s(27)} height={s(27)} />
            </View>

            {/* Title */}
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-black font-neueBold text-center"
              style={{ marginBottom: mvs(8), lineHeight: mvs(20) }}
            >
              Delete this photo?
            </ScaledText>

            {/* Description */}
            <ScaledText
              allowScaling={false}
              variant="body3Button"
              className="text-neutral-800 font-montserratSemibold text-center"
              style={{
                lineHeight: mvs(16),
                marginBottom: mvs(24),
                paddingHorizontal: s(12),
              }}
            >
              Once deleted, this image won't appear in your studio gallery
              anymore.
            </ScaledText>

            {/* Buttons */}
            <View className="flex-row" style={{ gap: s(16) }}>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                className="border border-red rounded-full flex-row items-center justify-center"
                style={{
                  paddingHorizontal: s(18),
                  paddingVertical: mvs(6),
                  gap: s(5),
                  borderColor: "#AE0E0E",
                  borderWidth: s(1.2),
                }}
              >
                <SVGIcons.Delete style={{ width: s(12), height: mvs(13) }} />
                <ScaledText
                  allowScaling={false}
                  variant="body3Button"
                  className="font-montserratSemibold"
                  style={{ color: "#AE0E0E" }}
                >
                  Delete
                </ScaledText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                className="rounded-full items-center justify-center"
                style={{
                  paddingHorizontal: s(18),
                  paddingVertical: mvs(6),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="body3Button"
                  className="text-gray font-montserratSemibold"
                >
                  Cancel
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Preview Modal */}
      <Modal
        visible={previewModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View className="flex-1 bg-black">
          {/* Header */}
          <View
            className="flex-row items-center justify-center relative"
            style={{
              paddingHorizontal: s(16),
              paddingTop: mvs(56),
              paddingBottom: mvs(16),
            }}
          >
            <TouchableOpacity
              onPress={() => setPreviewModalVisible(false)}
              className="absolute rounded-full bg-foreground/20 items-center justify-center"
              style={{
                width: s(34),
                height: s(34),
                left: s(21),
                top: mvs(56),
                padding: s(8),
              }}
            >
              <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
            </TouchableOpacity>

            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white font-neueBold"
            >
              ABC studio
            </ScaledText>
          </View>

          {/* Full-screen Photo */}
          <View className="flex-1 items-center justify-center">
            {photos[selectedPhotoIndex] && (
              <Image
                source={{ uri: photos[selectedPhotoIndex].imageUrl }}
                style={{ width: "100%", height: mvs(505) }}
                resizeMode="cover"
              />
            )}

            {/* Navigation Arrows */}
            {selectedPhotoIndex > 0 && (
              <TouchableOpacity
                onPress={() =>
                  setSelectedPhotoIndex((prev) => Math.max(0, prev - 1))
                }
                className="absolute"
                style={{ left: s(16) }}
              >
                <SVGIcons.ChevronLeft width={s(35)} height={s(35)} />
              </TouchableOpacity>
            )}

            {selectedPhotoIndex < photos.length - 1 && (
              <TouchableOpacity
                onPress={() =>
                  setSelectedPhotoIndex((prev) =>
                    Math.min(photos.length - 1, prev + 1)
                  )
                }
                className="absolute"
                style={{ right: s(16) }}
              >
                <SVGIcons.ChevronRight width={s(35)} height={s(35)} />
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Text */}
          <View style={{ paddingBottom: mvs(24), paddingHorizontal: s(16) }}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white text-center"
              style={{
                fontFamily: "Neue Haas Grotesk Display Pro",
                fontWeight: "300",
                fontStyle: "italic",
              }}
            >
              Your photo will be seen like this by the tattoolers
            </ScaledText>
          </View>
        </View>
      </Modal>
    </View>
  );
}
