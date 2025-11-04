import {
    BannerSkeleton,
    BannerTypeSelector,
    FourImagesUpload,
    SingleMediaUpload,
    UnsavedChangesModal,
} from "@/components/settings/banner";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/providers/AuthProvider";
import { cloudinaryService } from "@/services/cloudinary.service";
import type { BannerMedia, BannerType } from "@/types/banner";
import { appTypeToDb, dbTypeToApp } from "@/utils/bannerTypeMapping";
import { clearProfileCache } from "@/utils/database";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    View
} from "react-native";
import { toast } from "sonner-native";

export default function BannerSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();

  const [artistId, setArtistId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<BannerType>(null);
  const [initialType, setInitialType] = useState<BannerType>(null);
  const [bannerMedia, setBannerMedia] = useState<BannerMedia[]>([]);
  const [initialBannerMedia, setInitialBannerMedia] = useState<BannerMedia[]>([]);
  const [allMediaFromDB, setAllMediaFromDB] = useState<BannerMedia[]>([]); // Store all media from DB
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadBannerData();
  }, [user?.id]);

  const loadBannerData = async () => {
    try {
      if (!user?.id) return;

      // Fetch artist profile with bannerType
      const { data: profileData, error: profileError } = await supabase
        .from("artist_profiles")
        .select("id, bannerType")
        .eq("userId", user.id)
        .single();

      if (profileError || !profileData) {
        throw new Error("Artist profile not found");
      }

      setArtistId(profileData.id);

      // Fetch existing banner media (all media from DB with bannerType)
      const { data: bannerData, error: bannerError } = await supabase
        .from("artist_banner_media")
        .select("id, mediaType, mediaUrl, bannerType, order")
        .eq("artistId", profileData.id)
        .order("order", { ascending: true });

      if (bannerError) {
        throw new Error(bannerError.message);
      }

      const media = (bannerData || []) as BannerMedia[];
      
      // Store all media from database
      setAllMediaFromDB(JSON.parse(JSON.stringify(media)));

      // Get banner type from artist_profiles
      const bannerType = dbTypeToApp(profileData.bannerType);
      
      // Set selected type from DB
      setSelectedType(bannerType);
      setInitialType(bannerType);

      // Filter media based on selected type and matching bannerType
      const dbBannerType = appTypeToDb(bannerType);
      if (bannerType === "4_IMAGES") {
        const images = media.filter(m => m.mediaType === "IMAGE" && m.bannerType === dbBannerType).slice(0, 4);
        setBannerMedia(images);
        setInitialBannerMedia(JSON.parse(JSON.stringify(images)));
      } else if (bannerType === "1_IMAGE") {
        const images = media.filter(m => m.mediaType === "IMAGE" && m.bannerType === dbBannerType).slice(0, 1);
        setBannerMedia(images);
        setInitialBannerMedia(JSON.parse(JSON.stringify(images)));
      } else if (bannerType === "1_VIDEO") {
        const videos = media.filter(m => m.mediaType === "VIDEO" && m.bannerType === dbBannerType).slice(0, 1);
        setBannerMedia(videos);
        setInitialBannerMedia(JSON.parse(JSON.stringify(videos)));
      } else {
        setBannerMedia([]);
        setInitialBannerMedia([]);
      }
    } catch (error: any) {
      console.error("Error loading banner data:", error);
      toast.error(error.message || "Failed to load banner data");
    } finally {
      setLoading(false);
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    selectedType !== initialType ||
    JSON.stringify(bannerMedia) !== JSON.stringify(initialBannerMedia);

  const handleBack = () => {
    if (isEditMode) {
      if (hasUnsavedChanges) {
        setShowUnsavedModal(true);
      } else {
        setIsEditMode(false);
      }
    } else {
      router.back();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedModal(false);
    if (isEditMode) {
      // Reset to initial values and exit edit mode
      setBannerMedia(JSON.parse(JSON.stringify(initialBannerMedia)));
      setSelectedType(initialType);
      setIsEditMode(false);
    } else {
      router.back();
    }
  };

  const handleContinueEditing = () => {
    setShowUnsavedModal(false);
  };

  const handleTypeSelect = (type: BannerType) => {
    setSelectedType(type);
    
    // Filter media from DB based on selected type AND matching bannerType
    const dbBannerType = appTypeToDb(type);
    if (type === "4_IMAGES") {
      // Show first 4 images from DB with matching bannerType
      const images = allMediaFromDB.filter(m => m.mediaType === "IMAGE" && m.bannerType === dbBannerType).slice(0, 4);
      setBannerMedia(images);
    } else if (type === "1_IMAGE") {
      // Show first image from DB with matching bannerType
      const images = allMediaFromDB.filter(m => m.mediaType === "IMAGE" && m.bannerType === dbBannerType).slice(0, 1);
      setBannerMedia(images);
    } else if (type === "1_VIDEO") {
      // Show first video from DB with matching bannerType
      const videos = allMediaFromDB.filter(m => m.mediaType === "VIDEO" && m.bannerType === dbBannerType).slice(0, 1);
      setBannerMedia(videos);
    } else {
      setBannerMedia([]);
    }
  };

  const handlePickMedia = async (index: number, mediaType: "image" | "video") => {
    try {
      const files = await pickFiles({
        mediaType,
        allowsMultipleSelection: false,
        maxFiles: 1,
        cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions(mediaType),
      });

      if (!files || files.length === 0) return;

      const file = files[0];

      // Check file size
      const maxSize = mediaType === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
      if (file.fileSize && file.fileSize > maxSize) {
        toast.error(
          `${mediaType === "video" ? "Video" : "Image"} size must be less than ${
            mediaType === "video" ? "50MB" : "10MB"
          }`
        );
        return;
      }

      // Upload to Cloudinary
      const uploaded = await uploadToCloudinary(
        [file],
        cloudinaryService.getPortfolioUploadOptions(mediaType)
      );

      if (uploaded && uploaded.length > 0 && uploaded[0].cloudinaryResult) {
        const newMedia: BannerMedia = {
          mediaType: mediaType === "video" ? "VIDEO" : "IMAGE",
          mediaUrl: uploaded[0].cloudinaryResult.secureUrl,
          order: index,
        };

        setBannerMedia((prev) => {
          const updated = [...prev];
          updated[index] = newMedia;
          return updated;
        });
      }
    } catch (error: any) {
      console.error("Error picking media:", error);
      toast.error(error.message || "Failed to upload media");
    }
  };

  const handleRemoveMedia = (index: number) => {
    setBannerMedia((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSave = async () => {
    if (!artistId) {
      toast.error("Artist profile not found");
      return;
    }

    // Validation
    if (selectedType === "4_IMAGES" && bannerMedia.length !== 4) {
      toast.error("Please upload all 4 images");
      return;
    }

    if ((selectedType === "1_IMAGE" || selectedType === "1_VIDEO") && bannerMedia.length !== 1) {
      toast.error("Please upload the media");
      return;
    }

    if (!hasUnsavedChanges) {
      router.back();
      return;
    }

    setIsLoading(true);

    try {
      // Delete only media for the CURRENT banner type
      const dbBannerType = appTypeToDb(selectedType);
      const { error: deleteError } = await supabase
        .from("artist_banner_media")
        .delete()
        .eq("artistId", artistId)
        .eq("bannerType", dbBannerType);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Insert new banner media with bannerType
      if (bannerMedia.length > 0) {
        const insertData = bannerMedia.map((media, index) => ({
          artistId,
          mediaType: media.mediaType,
          mediaUrl: media.mediaUrl,
          bannerType: dbBannerType,
          order: index,
        }));

        const { error: insertError } = await supabase
          .from("artist_banner_media")
          .insert(insertData);

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      // Update bannerType in artist_profiles
      const { error: updateError } = await supabase
        .from("artist_profiles")
        .update({ bannerType: dbBannerType })
        .eq("id", artistId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update allMediaFromDB: keep media from other types, update current type
      const otherTypeMedia = allMediaFromDB.filter(m => m.bannerType !== dbBannerType);
      const updatedAllMedia = [...otherTypeMedia, ...bannerMedia];
      setAllMediaFromDB(updatedAllMedia);

      // Clear profile cache to force refresh
      await clearProfileCache(user!.id);

      toast.success("Banner updated successfully");

      // Exit edit mode and update initial values
      setIsEditMode(false);
      setInitialType(selectedType);
      setInitialBannerMedia(JSON.parse(JSON.stringify(bannerMedia)));
    } catch (err: any) {
      console.error("Error updating banner:", err);
      toast.error(err.message || "Failed to update banner");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-background"
      >
        <LinearGradient
          colors={["#000000", "#0F0202"]}
          start={{ x: 0.4, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          className="flex-1"
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
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-white font-bold"
            >
              Cover
            </ScaledText>
          </View>

          {/* Divider */}
          <View
            className="bg-gray"
            style={{
              height: s(1),
              marginBottom: mvs(32),
              marginHorizontal: s(16),
            }}
          />

          {/* Content Skeleton */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: mvs(120) }}
          >
            <BannerSkeleton />
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
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
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-white font-bold"
          >
            Cover
          </ScaledText>
        </View>

        {/* Divider */}
        <View
          className="bg-gray"
          style={{
            height: s(1),
            marginBottom: mvs(32),
            marginHorizontal: s(16),
          }}
        />

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: mvs(120) }}
        >
          {!isEditMode ? (
            /* Initial state: Show type selector with previews */
            <BannerTypeSelector 
              onSelect={handleTypeSelect} 
              selectedType={selectedType}
              bannerMedia={bannerMedia}
              isEditMode={isEditMode}
            />
          ) : (
            /* Edit mode: Show upload UI only */
            <>
              {selectedType === "4_IMAGES" && (
                <FourImagesUpload
                  bannerMedia={bannerMedia}
                  onPickMedia={handlePickMedia}
                  onRemoveMedia={handleRemoveMedia}
                  uploading={uploading}
                />
              )}
              {selectedType === "1_IMAGE" && (
                <SingleMediaUpload
                  bannerMedia={bannerMedia}
                  onPickMedia={handlePickMedia}
                  onRemoveMedia={handleRemoveMedia}
                  uploading={uploading}
                  mediaType="image"
                  title="Voglio mostrare una foto a mia scelta"
                  uploadLabel="Upload image"
                />
              )}
              {selectedType === "1_VIDEO" && (
                <SingleMediaUpload
                  bannerMedia={bannerMedia}
                  onPickMedia={handlePickMedia}
                  onRemoveMedia={handleRemoveMedia}
                  uploading={uploading}
                  mediaType="video"
                  title="Voglio mostrare un video a mia scelta"
                  uploadLabel="Upload video"
                />
              )}
            </>
          )}
        </ScrollView>

        {/* Button */}
        <View
          style={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
          }}
        >
          {isEditMode ? (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading || uploading}
              className="rounded-full items-center justify-center"
              style={{
                backgroundColor: isLoading || uploading ? "#6B2C2C" : "#AD2E2E",
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueMedium"
              >
                {isLoading || uploading ? "Saving..." : "Save"}
              </ScaledText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setIsEditMode(true)}
              disabled={!selectedType}
              className="rounded-full items-center justify-center flex-row"
              style={{
                backgroundColor: !selectedType ? "#6B2C2C" : "#AD2E2E",
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
                gap: s(8),
              }}
            >
              <SVGIcons.PenRed width={s(16)} height={s(16)} fill="#FFFFFF" />
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueMedium"
              >
                Edit cover
              </ScaledText>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        visible={showUnsavedModal}
        onContinueEditing={handleContinueEditing}
        onDiscardChanges={handleDiscardChanges}
      />
    </KeyboardAvoidingView>
  );
}
