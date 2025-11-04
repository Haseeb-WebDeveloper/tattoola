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

export default function StudioStep2() {
  const { step2, updateStep2, setCurrentStep, totalSteps } =
    useStudioSetupStore();
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();

  const [logoUrl, setLogoUrl] = useState<string | undefined>(step2.logoUrl);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setCurrentStep(2);
  }, []);

  const handlePickLogo = async () => {
    try {
      setIsUploading(true);

      const files = await pickFiles({
        mediaType: "image",
        allowsMultipleSelection: false,
        maxFiles: 1,
        cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions("image"),
      });

      if (!files || files.length === 0) {
        setIsUploading(false);
        return;
      }

      const file = files[0];

      // Check file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.fileSize && file.fileSize > maxSize) {
        setIsUploading(false);
        // toast.error("Image size must be less than 5MB");
        return;
      }

      // Show local image immediately
      setLogoUrl(file.uri);

      // Upload to Cloudinary
      const uploaded = await uploadToCloudinary(
        [file],
        cloudinaryService.getPortfolioUploadOptions("image")
      );

      if (uploaded && uploaded.length > 0 && uploaded[0].cloudinaryResult) {
        const cloudinaryUrl = uploaded[0].cloudinaryResult.secureUrl;
        setLogoUrl(cloudinaryUrl);
      }
    } catch (error: any) {
      console.error("Error picking logo:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const canProceed = !!logoUrl;

  const handleNext = () => {
    if (!canProceed) return;

    // Save to store
    updateStep2({
      logoUrl: logoUrl,
    });

    // Navigate to next step
    router.push("/settings/studio/step-3" as any);
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
          currentStep={2}
          totalSteps={8}
          stepName="Add logo "
          icon={<SVGIcons.Magic width={s(19)} height={s(19)} />}
        />

        {/* Content */}
        <View style={{ paddingHorizontal: s(24) }} className="items-center">
          {/* Title */}
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-white font-neueSemibold"
            style={{ marginBottom: mvs(8) }}
          >
            Upload your studio logo
            <ScaledText variant="lg" className="text-error">
              *
            </ScaledText>
          </ScaledText>

          {/* Subtitle */}
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-gray"
            style={{ marginBottom: mvs(24) }}
          >
            Supporta JPG, PNG, max size 5MB
          </ScaledText>

          {/* Logo Upload Area */}
          <View
            className="items-center justify-center"
            style={{ marginBottom: mvs(32) }}
          >
             {logoUrl ? (
               <View style={{ position: "relative", alignItems: "center" }}>
                 <Image
                   source={{ uri: logoUrl }}
                   style={{
                     width: s(200),
                     height: s(200),
                     borderRadius: s(100),
                   }}
                   resizeMode="cover"
                 />
                 {isUploading && (
                   <View
                     style={{
                       position: "absolute",
                       top: 0,
                       left: 0,
                       right: 0,
                       bottom: 0,
                       backgroundColor: "rgba(0,0,0,0.5)",
                       borderRadius: s(100),
                       justifyContent: "center",
                       alignItems: "center",
                     }}
                   >
                     <ActivityIndicator size="large" color="#CA2323" />
                   </View>
                 )}
                 {/* Edit button - Centered horizontally at bottom */}
                 <View
                   style={{
                     position: "absolute",
                     bottom: mvs(-12),
                     left: 0,
                     right: 0,
                     alignItems: "center",
                   }}
                 >
                   <TouchableOpacity
                     onPress={handlePickLogo}
                     disabled={isUploading}
                     className="bg-foreground rounded-full items-center justify-center"
                     style={{
                       padding: s(6),
                     }}
                   >
                     <SVGIcons.EditRed width={s(14)} height={s(14)} />
                   </TouchableOpacity>
                 </View>
               </View>
             ) : (
              <TouchableOpacity
                onPress={handlePickLogo}
                disabled={isUploading}
                className="border border-dashed border-error/60 rounded-full bg-primary/10 items-center justify-center"
                style={{
                  width: s(200),
                  height: s(200),
                }}
              >
                {isUploading ? (
                  <ActivityIndicator size="large" color="#CA2323" />
                ) : (
                  <View className="items-center justify-center">
                    <SVGIcons.Studio width={s(46)} height={s(46)} />
                    <View
                      className="items-center justify-center bg-primary"
                      style={{
                        paddingVertical: mvs(10),
                        paddingLeft: s(18),
                        paddingRight: s(20),
                        borderRadius: s(100),
                        marginTop: mvs(16),
                      }}
                    >
                      <ScaledText
                        allowScaling={false}
                        variant="md"
                        className="text-foreground font-neueSemibold"
                      >
                        Upload image
                      </ScaledText>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer - Fixed at bottom */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#000",
        }}
      >
        <NextBackFooter
          onNext={handleNext}
          nextDisabled={!canProceed || uploading}
          onBack={handleBack}
        />
      </View>
    </View>
  );
}
