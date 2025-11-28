import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { cloudinaryService } from "@/services/cloudinary.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step6Schema } from "@/utils/artistRegistrationValidation";
import { mvs, s } from "@/utils/scale";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { toast } from "sonner-native";

export default function ArtistStep6V2() {
  const {
    step4,
    updateStep4,
    setCurrentStepDisplay,
    totalStepsDisplay,
    currentStepDisplay,
  } = useArtistRegistrationV2Store();
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    name: string;
    size: number;
    uri: string;
  } | null>(null);

  useEffect(() => {
    if (step4?.certificateUrl) {
      // If we have a certificate URL, we'll show it as uploaded
      setSelectedDocument({
        name: step4.certificateUrl.split("/").pop() || "Certificate",
        size: 0,
        uri: step4.certificateUrl,
      });
    }
    setCurrentStepDisplay(6);
  }, []);

  const handlePickCertificate = async () => {
    try {
      setUploading(true);
      
      // Pick document (PDF, DOC, DOCX, etc.)
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      const file = result.assets[0];
      
      // Check file size (10MB limit for documents)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size && file.size > maxSize) {
        toast.error("File size must be less than 10MB");
        setUploading(false);
        return;
      }

      // Set selected document for preview
      setSelectedDocument({
        name: file.name || "Document",
        size: file.size || 0,
        uri: file.uri,
      });

      // Upload to Cloudinary using the service method
      const uploadOptions = cloudinaryService.getCertificateUploadOptions();
      const uploadResult = await cloudinaryService.uploadFile(
        {
          uri: file.uri,
          type: file.mimeType || "application/pdf",
          fileName: file.name || "certificate.pdf",
        },
        uploadOptions
      );
      
      const certificateUrl = uploadResult.secureUrl;

      // Update store with certificate URL
      updateStep4({ certificateUrl });
      
      toast.success("Certificate uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading certificate:", error);
      toast.error(error.message || "Failed to upload certificate");
      setSelectedDocument(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = () => {
    setSelectedDocument(null);
    updateStep4({ certificateUrl: undefined });
  };

  const canProceed = isValid(step6Schema, {
    certificateUrl: step4?.certificateUrl || "",
  });

  const onNext = () => {
    if (!canProceed) return;
    router.push("/(auth)/artist-registration/step-7");
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <AuthStepHeader />
      <ScrollView className="flex-1">
        {/* Progress */}
        <RegistrationProgress
          currentStep={6}
          totalSteps={totalStepsDisplay}
          name="Allega le tue certificazioni"
          nameVariant="2xl"
          icon={<SVGIcons.Certificate width={22} height={22} />}
          description="Carica un certificato o attestato che dimostri la tua autorizzazione a esercitare come tatuatore in Italia, insieme a un documento d’identità. Questo ci aiuta a verificare la tua identità e a mantenere la community sicura."
          descriptionVariant="md"
        />

        {/* Upload area */}
        <View style={{ paddingHorizontal: s(24) }}>
          <View
            className="rounded-2xl items-center bg-primary/20 border-dashed border-error/70"
            style={{
              paddingVertical: mvs(24),
              paddingHorizontal: s(16),
              borderWidth: s(1),
            }}
          >
            <SVGIcons.Upload width={s(42)} height={s(42)} />
            <TouchableOpacity
              onPress={handlePickCertificate}
              disabled={uploading}
              className="bg-primary text-background rounded-full"
              style={{
                paddingVertical: mvs(8),
                paddingHorizontal: s(20),
                borderRadius: s(70),
                marginTop: mvs(12),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueSemibold"
              >
                {uploading ? "Uploading..." : "Upload Certificate"}
              </ScaledText>
            </TouchableOpacity>
            <ScaledText
              allowScaling={false}
              variant="11"
              className="text-gray text-center font-neueSemibold"
              style={{ marginTop: mvs(12) }}
            >
              Supporta PDF, DOC, DOCX. Max size 10MB
            </ScaledText>
          </View>
        </View>

        {/* Document preview */}
        {selectedDocument && (
          <View
            style={{
              paddingHorizontal: s(24),
              marginTop: mvs(12),
              paddingBottom: mvs(64),
            }}
          >
            <View
              className="bg-primary/10 rounded-lg border border-primary/30"
              style={{
                paddingHorizontal: mvs(16),
                paddingVertical: mvs(10),
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <SVGIcons.Certificate width={s(18)} height={s(18)} />
              <View style={{ marginLeft: s(12), flex: 1 }}>
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-neueSemibold"
                  numberOfLines={1}
                >
                  {selectedDocument.name}
                </ScaledText>
                {/* {selectedDocument.size > 0 && (
                  <ScaledText
                    allowScaling={false}
                    variant="11"
                    className="text-gray font-neueLight"
                    style={{ marginTop: mvs(4) }}
                  >
                    {(selectedDocument.size / 1024 / 1024).toFixed(2)} MB
                  </ScaledText>
                )} */}
              </View>
              <TouchableOpacity
                onPress={handleRemoveDocument}
                style={{
                  padding: s(4),
                  marginLeft: s(8),
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <SVGIcons.CloseGray width={s(12)} height={s(12)} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <NextBackFooter
        onNext={onNext}
        nextDisabled={!canProceed}
        backLabel="Back"
        onBack={() => router.back()}
      />
    </View>
  );
}
