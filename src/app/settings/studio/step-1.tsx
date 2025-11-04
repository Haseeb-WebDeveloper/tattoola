import NextBackFooter from "@/components/ui/NextBackFooter";
import ScaledText from "@/components/ui/ScaledText";
import StudioStepHeader from "@/components/ui/StudioStepHeader";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { useStudioSetupStore } from "@/stores/studioSetupStore";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

export default function StudioStep1() {
  const { step1, updateStep1, setCurrentStep, totalSteps } =
    useStudioSetupStore();
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();

  const [selectedType, setSelectedType] = useState<
    "ONE_IMAGE" | "FOUR_IMAGES" | null
  >(step1.bannerType);
  const [bannerImages, setBannerImages] = useState<string[]>(
    step1.bannerImages
  );
  const [uploadingIndices, setUploadingIndices] = useState<number[]>([]);

  useEffect(() => {
    setCurrentStep(1);
  }, []);

  const handleTypeSelect = (type: "ONE_IMAGE" | "FOUR_IMAGES") => {
    setSelectedType(type);
    // Reset images when switching type
    if (type !== step1.bannerType) {
      setBannerImages([]);
    } else {
      setBannerImages(step1.bannerImages);
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

      // Check file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.fileSize && file.fileSize > maxSize) {
        setUploadingIndices((prev) => prev.filter((i) => i !== index));
        // toast.error("Image size must be less than 10MB");
        return;
      }

      // Show local image immediately for better UX
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
    } finally {
      setUploadingIndices((prev) => prev.filter((i) => i !== index));
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...bannerImages];
    updatedImages.splice(index, 1);
    setBannerImages(updatedImages);
  };

  const canProceed =
    selectedType === "ONE_IMAGE"
      ? bannerImages.length === 1
      : selectedType === "FOUR_IMAGES"
        ? bannerImages.length === 4
        : false;

  const handleNext = () => {
    if (!canProceed || !selectedType) return;

    // Save to store
    updateStep1({
      bannerType: selectedType,
      bannerImages: bannerImages,
    });

    // Navigate to next step
    router.push("/settings/studio/step-2" as any);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: mvs(120) }}
      >
        {/* Header */}
        <StudioStepHeader
          currentStep={1}
          totalSteps={8}
          stepName="Add a Cover "
          stepDescription="Choose how you want to display your studio's cover"
          icon={<SVGIcons.Magic width={s(19)} height={s(19)} />}
        />

        {/* Content */}
        <View style={{ paddingHorizontal: s(24) }}>
          {/* Image Preview/Upload Area - Above Radio Options */}
          {selectedType === "ONE_IMAGE" && (
            <View style={{ marginBottom: mvs(24) }}>
              {bannerImages.length > 0 ? (
                <View style={{ position: "relative" }}>
                  <Image
                    source={{ uri: bannerImages[0] }}
                    style={{
                      width: "100%",
                      height: mvs(200),
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
                        backgroundColor: "rgba(0,0,0,0.5)",
                        borderRadius: s(12),
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <ActivityIndicator size="large" color="#CA2323" />
                    </View>
                  )}
                  {/* Edit button */}
                  <TouchableOpacity
                    onPress={() => handlePickImage(0)}
                    disabled={uploadingIndices.includes(0)}
                    className="absolute top-3 right-3 aspect-square bg-foreground rounded-full flex-row items-center gap-2"
                    style={{
                      paddingVertical: mvs(6),
                      paddingHorizontal: s(6),
                    }}
                  >
                    <SVGIcons.EditRed width={s(14)} height={s(14)} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handlePickImage(0)}
                  disabled={uploadingIndices.includes(0)}
                  className="border border-dashed border-error/60 rounded-2xl bg-primary/10 items-center justify-center"
                  style={{
                    height: mvs(200),
                  }}
                >
                  {uploadingIndices.includes(0) ? (
                    <ActivityIndicator size="large" color="#CA2323" />
                  ) : (
                    <>
                      <View className="items-center"
                      style={{
                        gap: s(8),
                      }}
                      >
                        <SVGIcons.Upload width={s(42)} height={s(42)} />
                        <View
                          className="items-center justify-center bg-primary"
                          style={{
                            paddingHorizontal: s(16),
                            paddingVertical: mvs(8),
                            borderRadius: s(100),
                          }}
                        >
                          <ScaledText
                            allowScaling={false}
                            variant="md"
                            className="text-foreground font-semibold"
                          >
                            Upload image
                          </ScaledText>
                        </View>
                      </View>
                    </>
                  )}
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
                            aspectRatio: 4 / 4,
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
                              backgroundColor: "rgba(0,0,0,0.5)",
                              borderRadius: s(12),
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <ActivityIndicator size="small" color="#CA2323" />
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={() => handlePickImage(index)}
                          disabled={uploadingIndices.includes(index)}
                          className="absolute top-3 right-3 aspect-square bg-foreground rounded-full flex-row items-center gap-2"
                          style={{
                            padding: s(6),
                          }}
                        >
                          <SVGIcons.EditRed width={s(12)} height={s(12)} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handlePickImage(index)}
                        disabled={uploadingIndices.includes(index)}
                        className="border border-dashed border-error/60 rounded-2xl bg-primary/10 items-center justify-center"
                        style={{
                          aspectRatio: 4 / 4,
                        }}
                      >
                        {uploadingIndices.includes(index) ? (
                          <ActivityIndicator size="small" color="#CA2323" />
                        ) : (
                          <>
                            <SVGIcons.AddRed width={s(20)} height={s(20)} />
                            <ScaledText
                              allowScaling={false}
                              variant="sm"
                              className="text-gray"
                              style={{ marginTop: mvs(4) }}
                            >
                              {index + 1}
                            </ScaledText>
                          </>
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
                            aspectRatio: 4 / 4,
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
                              backgroundColor: "rgba(0,0,0,0.5)",
                              borderRadius: s(12),
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <ActivityIndicator size="small" color="#CA2323" />
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={() => handlePickImage(index)}
                          disabled={uploadingIndices.includes(index)}
                          className="absolute top-3 right-3 aspect-square bg-foreground rounded-full flex-row items-center gap-2"
                          style={{
                            padding: s(8),
                          }}
                        >
                          <SVGIcons.PenRed
                            width={s(12)}
                            height={s(12)}
                            fill="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handlePickImage(index)}
                        disabled={uploadingIndices.includes(index)}
                        className="border border-dashed border-error/60 rounded-2xl bg-primary/10 items-center justify-center"
                        style={{
                          aspectRatio: 4 / 4,
                        }}
                      >
                        {uploadingIndices.includes(index) ? (
                          <ActivityIndicator size="small" color="#CA2323" />
                        ) : (
                          <>
                            <SVGIcons.AddRed width={s(20)} height={s(20)} />
                            <ScaledText
                              allowScaling={false}
                              variant="sm"
                              className="text-gray"
                              style={{ marginTop: mvs(4) }}
                            >
                              {index + 1}
                            </ScaledText>
                          </>
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
              onPress={() => handleTypeSelect("ONE_IMAGE")}
              className={`flex-row  justify-between bg-tat-foreground border-gray`}
              style={{
                paddingVertical: mvs(16),
                paddingHorizontal: s(16),
                borderWidth: s(0.5),
                borderRadius: s(12),
                gap: s(6),
                marginBottom: mvs(12),
              }}
            >
              {selectedType === "ONE_IMAGE" ? (
                <SVGIcons.CircleCheckedCheckbox width={s(17)} height={s(17)} />
              ) : (
                <SVGIcons.CircleUncheckedCheckbox
                  width={s(17)}
                  height={s(17)}
                />
              )}
              <ScaledText
                allowScaling={false}
                variant="sm"
                className={`text-foreground font-semibold flex-1 `}
              >
                Voglio caricare una sola foto di sfondo
              </ScaledText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTypeSelect("FOUR_IMAGES")}
              className={`flex-row  justify-between bg-tat-foreground border-gray`}
              style={{
                paddingVertical: mvs(16),
                paddingHorizontal: s(16),
                borderWidth: s(0.5),
                borderRadius: s(12),
                gap: s(6),
                marginBottom: mvs(12),
              }}
            >
              {selectedType === "FOUR_IMAGES" ? (
                <SVGIcons.CircleCheckedCheckbox width={s(17)} height={s(17)} />
              ) : (
                <SVGIcons.CircleUncheckedCheckbox
                  width={s(17)}
                  height={s(17)}
                />
              )}
              <ScaledText
                allowScaling={false}
                variant="sm"
                className={`text-foreground font-semibold flex-1`}
              >
                Voglio caricare 4 foto verticali per comporre la cover
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer - Fixed at bottom */}
      <NextBackFooter
        onNext={handleNext}
        nextDisabled={!canProceed || uploading}
        onBack={handleBack}
      />
    </View>
  );
}
