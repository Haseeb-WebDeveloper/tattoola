import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/providers/AuthProvider";
import { cloudinaryService } from "@/services/cloudinary.service";
import {
    fetchStudioDetails,
    updateStudioBanner,
} from "@/services/studio.service";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { toast } from "sonner-native";

export default function StudioBannerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { pickFiles, uploadToCloudinary } = useFileUpload();

  const [selectedType, setSelectedType] = useState<
    "ONE_IMAGE" | "FOUR_IMAGES" | null
  >(null);
  const [bannerImages, setBannerImages] = useState<string[]>([]);
  const [initialType, setInitialType] = useState<
    "ONE_IMAGE" | "FOUR_IMAGES" | null
  >(null);
  const [initialImages, setInitialImages] = useState<string[]>([]);
  const [uploadingIndices, setUploadingIndices] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Fetch current studio data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        setIsFetching(true);
        const studio = await fetchStudioDetails(user.id);
        setInitialType(studio.bannerType || null);
        setInitialImages(studio.bannerImages || []);
        setSelectedType(studio.bannerType || null);
        setBannerImages(studio.bannerImages || []);
      } catch (error: any) {
        console.error("Error fetching studio:", error);
        toast.error(error.message || "Impossibile caricare i dati dello studio");
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    selectedType !== initialType ||
    JSON.stringify(bannerImages) !== JSON.stringify(initialImages);

  const handleTypeSelect = (type: "ONE_IMAGE" | "FOUR_IMAGES") => {
    setSelectedType(type);
    // Reset images when switching type
    if (type !== initialType) {
      setBannerImages([]);
    } else {
      setBannerImages(initialImages);
    }
  };

  const handlePickImage = async (index: number) => {
    try {
      setUploadingIndices((prev) => [...prev, index]);

      const files = await pickFiles({
        mediaType: "image",
        allowsMultipleSelection: false,
        maxFiles: 1,
        cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions("image"),
      });

      if (!files || files.length === 0) {
        setUploadingIndices((prev) => prev.filter((i) => i !== index));
        return;
      }

      const file = files[0];

      // Show local image immediately
      const updatedImages = [...bannerImages];
      updatedImages[index] = file.uri;
      setBannerImages(updatedImages);

      // Upload to Cloudinary
      const uploaded = await uploadToCloudinary(
        [file],
        cloudinaryService.getPortfolioUploadOptions("image")
      );

      if (uploaded && uploaded.length > 0 && uploaded[0].cloudinaryResult) {
        const cloudinaryUrl = uploaded[0].cloudinaryResult.secureUrl;
        const finalImages = [...bannerImages];
        finalImages[index] = cloudinaryUrl;
        setBannerImages(finalImages);
      }
    } catch (error: any) {
      console.error("Error picking image:", error);
        toast.error(error.message || "Impossibile caricare l'immagine");
    } finally {
      setUploadingIndices((prev) => prev.filter((i) => i !== index));
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...bannerImages];
    updatedImages.splice(index, 1);
    setBannerImages(updatedImages);
  };

  const canSave =
    selectedType === "ONE_IMAGE"
      ? bannerImages.length === 1
      : selectedType === "FOUR_IMAGES"
        ? bannerImages.length === 4
        : false;

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      router.back();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedModal(false);
    router.back();
  };

  const handleContinueEditing = () => {
    setShowUnsavedModal(false);
  };

  const handleSave = async () => {
    if (!canSave || !user?.id || !selectedType) return;

    try {
      setIsLoading(true);

      const result = await updateStudioBanner(
        user.id,
        selectedType,
        bannerImages
      );

      if (result.success) {
        toast.success("Banner dello studio aggiornato con successo!");
        setInitialType(selectedType);
        setInitialImages(bannerImages);
        setTimeout(() => {
          router.back();
        }, 500);
      } else {
        toast.error(result.error || "Impossibile aggiornare il banner");
      }
    } catch (error: any) {
      console.error("Error updating banner:", error);
      toast.error(error.message || "Impossibile aggiornare il banner");
    } finally {
      setIsLoading(false);
    }
  };

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
            contentContainerStyle={{ paddingBottom: mvs(120) }}
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
                disabled={isFetching}
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
                className="text-white font-neueSemibold"
              >
                Cover
              </ScaledText>
            </View>

            {/* Divider */}
            <View
              className="bg-gray"
              style={{ height: s(1), marginBottom: mvs(32) }}
            />

            {/* Content */}
            <View style={{ paddingHorizontal: s(16) }}>
              {/* Image Preview/Upload Area - Above Radio Options */}
              {selectedType === "ONE_IMAGE" && (
                <View style={{ marginBottom: mvs(24) }}>
                  {bannerImages.length > 0 ? (
                    <View style={{ position: "relative" }}>
                      <Image
                        source={{ uri: bannerImages[0] }}
                        style={{
                          width: "100%",
                          height: mvs(180),
                          borderRadius: s(12),
                        }}
                        resizeMode="cover"
                      />
                      {uploadingIndices.includes(0) && (
                        <View
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.6)",
                            borderRadius: s(12),
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ActivityIndicator size="large" color="#E80D0D" />
                        </View>
                      )}
                      {/* Remove button */}
                      <TouchableOpacity
                        onPress={() => handlePickImage(0)}
                        className="absolute top-2 right-2 bg-foreground rounded-full"
                        style={{
                          width: s(28),
                          height: s(28),
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <SVGIcons.EditRed width={s(12)} height={s(12)} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handlePickImage(0)}
                      disabled={uploadingIndices.includes(0)}
                      className="border border-error/60  border-dashed items-center justify-center"
                      style={{
                        height: mvs(180),
                        borderRadius: s(12),
                        backgroundColor: "#E80D0D0D",
                      }}
                    >
                      {uploadingIndices.includes(0) ? (
                        <ActivityIndicator size="large" color="#E80D0D" />
                      ) : (
                        <SVGIcons.Upload width={s(48)} height={s(48)} />
                      )}
                      <View
                        className="bg-primary rounded-full"
                        style={{
                          paddingVertical: mvs(8),
                          paddingHorizontal: s(16),
                          marginTop: mvs(8),
                        }}
                      >
                        <ScaledText
                          allowScaling={false}
                          variant="md"
                          className="text-foreground font-neueBold"
                        >
                          Carica immagine
                        </ScaledText>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* 2x2 Grid for 4 Images - Above Radio Options */}
              {selectedType === "FOUR_IMAGES" && (
                <View style={{ marginBottom: mvs(24) }}>
                  <View
                    className="flex-row"
                    style={{ gap: s(12), marginBottom: mvs(12) }}
                  >
                    {[0, 1].map((index) => (
                      <View key={index} className="flex-1">
                        {bannerImages[index] ? (
                          <View style={{ position: "relative" }}>
                            <Image
                              source={{ uri: bannerImages[index] }}
                              style={{
                                width: "100%",
                                height: mvs(120),
                                borderRadius: s(12),
                              }}
                              resizeMode="cover"
                            />
                            {uploadingIndices.includes(index) && (
                              <View
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: "rgba(0,0,0,0.6)",
                                  borderRadius: s(12),
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <ActivityIndicator
                                  size="small"
                                  color="#E80D0D"
                                />
                              </View>
                            )}
                            {/* Edit button */}
                            <TouchableOpacity
                              onPress={() => handlePickImage(index)}
                              className="absolute top-2 right-2 bg-foreground rounded-full"
                              style={{
                                width: s(24),
                                height: s(24),
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <SVGIcons.EditRed width={s(12)} height={s(12)} />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handlePickImage(index)}
                            disabled={uploadingIndices.includes(index)}
                            className=" border-dashed items-center justify-center border-primary bg-tat-darkMaroon"
                            style={{
                              height: mvs(120),
                              borderRadius: s(12),
                              borderWidth: s(1),
                            }}
                          >
                            {uploadingIndices.includes(index) ? (
                              <ActivityIndicator size="small" color="#E80D0D" />
                            ) : (
                              <SVGIcons.AddRed width={s(24)} height={s(24)} />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>

                  <View className="flex-row" style={{ gap: s(12) }}>
                    {[2, 3].map((index) => (
                      <View key={index} className="flex-1">
                        {bannerImages[index] ? (
                          <View style={{ position: "relative" }}>
                            <Image
                              source={{ uri: bannerImages[index] }}
                              style={{
                                width: "100%",
                                height: mvs(120),
                                borderRadius: s(12),
                              }}
                              resizeMode="cover"
                            />
                            {uploadingIndices.includes(index) && (
                              <View
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: "rgba(0,0,0,0.6)",
                                  borderRadius: s(12),
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <ActivityIndicator
                                  size="small"
                                  color="#E80D0D"
                                />
                              </View>
                            )}
                            {/* Edit button */}
                            <TouchableOpacity
                              onPress={() => handlePickImage(index)}
                              className="absolute top-2 right-2 bg-foreground rounded-full"
                              style={{
                                width: s(24),
                                height: s(24),
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <SVGIcons.EditRed width={s(12)} height={s(12)} />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handlePickImage(index)}
                            disabled={uploadingIndices.includes(index)}
                            className=" border-dashed items-center justify-center border-primary bg-tat-darkMaroon"
                            style={{
                              height: mvs(120),
                              borderRadius: s(12),
                              borderWidth: s(1),
                            }}
                          >
                            {uploadingIndices.includes(index) ? (
                              <ActivityIndicator size="small" color="#E80D0D" />
                            ) : (
                              <SVGIcons.AddRed width={s(24)} height={s(24)} />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Radio Button Options - Below Image Area */}
              <View style={{ marginBottom: mvs(16) }}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => handleTypeSelect("ONE_IMAGE")}
                  disabled={isFetching}
                  className={`flex-row  justify-between bg-tat-foreground border-gray`}
                  style={{
                    paddingVertical: mvs(16),
                    paddingHorizontal: s(16),
                    borderWidth: s(0.5),
                    borderRadius: s(12),
                    gap: s(6),
                    marginBottom: mvs(12),
                    opacity: isFetching ? 0.5 : 1,
                  }}
                >
                  {selectedType === "ONE_IMAGE" && !isFetching ? (
                    <SVGIcons.CircleCheckedCheckbox
                      width={s(17)}
                      height={s(17)}
                    />
                  ) : (
                    <SVGIcons.CircleUncheckedCheckbox
                      width={s(17)}
                      height={s(17)}
                    />
                  )}
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-white flex-1 font-montserratSemibold"
                  >
                    Voglio caricare una sola foto di sfondo
                  </ScaledText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => handleTypeSelect("FOUR_IMAGES")}
                  disabled={isFetching}
                  className={`flex-row  justify-between bg-tat-foreground border-gray`}
                  style={{
                    paddingVertical: mvs(16),
                    paddingHorizontal: s(16),
                    borderWidth: s(0.5),
                    borderRadius: s(12),
                    gap: s(6),
                    marginBottom: mvs(12),
                    opacity: isFetching ? 0.5 : 1,
                  }}
                >
                  {selectedType === "FOUR_IMAGES" && !isFetching ? (
                    <SVGIcons.CircleCheckedCheckbox
                      width={s(17)}
                      height={s(17)}
                    />
                  ) : (
                    <SVGIcons.CircleUncheckedCheckbox
                      width={s(17)}
                      height={s(17)}
                    />
                  )}
                  <ScaledText
                    allowScaling={false}
                    variant="sm"
                    className="text-white flex-1 font-montserratSemibold"
                  >
                    Voglio caricare 4 foto verticali per comporre la cover
                  </ScaledText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer - Save Button */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#000",
              paddingHorizontal: s(16),
              paddingBottom: mvs(32),
            }}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading || isFetching || !hasUnsavedChanges || !canSave}
              className="rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  isLoading || isFetching || !hasUnsavedChanges || !canSave
                    ? "#6B2C2C"
                    : "#AD2E2E",
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
                {isLoading ? "Salvataggio..." : "Salva"}
              </ScaledText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Unsaved Changes Modal */}
      <Modal
        visible={showUnsavedModal}
        transparent
        animationType="fade"
        onRequestClose={handleContinueEditing}
      >
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <View
            className="bg-[#fff] rounded-xl"
            style={{
              width: s(342),
              paddingHorizontal: s(24),
              paddingVertical: mvs(32),
            }}
          >
            {/* Warning Icon */}
            <View className="items-center" style={{ marginBottom: mvs(20) }}>
              <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
            </View>

            {/* Title */}
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-background font-neueBold text-center"
              style={{ marginBottom: mvs(4) }}
            >
              Hai modifiche non salvate nella cover
            </ScaledText>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-background font-montserratMedium text-center"
              style={{ marginBottom: mvs(32) }}
            >
              Vuoi ignorarle?
            </ScaledText>

            {/* Action Buttons */}
            <View style={{ gap: mvs(4) }} className="flex-row justify-center">
              {/* Continue Editing Button */}
              <TouchableOpacity
                onPress={handleContinueEditing}
                className="rounded-full border-2 items-center justify-center flex-row"
                style={{
                  borderColor: "#AD2E2E",
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                  gap: s(8),
                }}
              >
                <SVGIcons.PenRed
                  style={{ width: s(14), height: s(14) }}
                  fill="#AD2E2E"
                />
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="font-montserratMedium"
                  style={{ color: "#AD2E2E" }}
                >
                  Continua a modificare
                </ScaledText>
              </TouchableOpacity>

              {/* Discard Changes Button */}
              <TouchableOpacity
                onPress={handleDiscardChanges}
                className="rounded-full items-center justify-center"
                style={{
                  paddingVertical: mvs(10.5),
                  paddingLeft: s(18),
                  paddingRight: s(20),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-gray font-montserratMedium"
                >
                  Ignora modifiche
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
