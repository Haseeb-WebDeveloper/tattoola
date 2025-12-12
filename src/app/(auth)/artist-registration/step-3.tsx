import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step3Schema } from "@/utils/artistRegistrationValidation";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function ArtistStep3V2() {
  const {
    step3,
    step13,
    updateStep3,
    setAvatar,
    currentStepDisplay,
    totalStepsDisplay,
  } = useArtistRegistrationV2Store();
  const [focused, setFocused] = useState<"firstName" | "lastName" | null>(null);
  const { pickFiles, uploadToCloudinary } = useFileUpload();
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }>({});

  const handlePickAvatar = async () => {
    const files = await pickFiles({
      mediaType: "image",
      allowsMultipleSelection: false,
      quality: 0.8,
      maxFiles: 1,
      cloudinaryOptions: cloudinaryService.getAvatarUploadOptions(),
    });
    if (files.length > 0) {
      // 1) Show local URI instantly for fast feedback
      const localUri = files[0].uri;
      setAvatar(localUri);
      setErrors((e) => ({ ...e, avatar: undefined }));

      // 2) Upload in background and then replace with Cloudinary URL
      (async () => {
        const uploadedFiles = await uploadToCloudinary(
          files,
          cloudinaryService.getAvatarUploadOptions()
        );
        const first = uploadedFiles[0];
        if (first?.cloudinaryResult?.publicId) {
          const transformedUrl = cloudinaryService.getAvatarUrl(
            first.cloudinaryResult.publicId
          );
          setAvatar(transformedUrl);
        }
      })();
    }
  };

  const canProceed = isValid(step3Schema, {
    firstName: step3?.firstName || "",
    lastName: step3?.lastName || "",
    avatar: step3?.avatar || "",
  });

  const validateField = (field: "firstName" | "lastName") => {
    const result = step3Schema.safeParse({
      firstName: step3?.firstName || "",
      lastName: step3?.lastName || "",
      avatar: step3?.avatar || "",
    });
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === field);
      setErrors((e) => ({ ...e, [field]: issue?.message }));
    } else {
      setErrors((e) => ({ ...e, [field]: undefined }));
    }
  };

  const handleNext = () => {
    if (!canProceed) return;
    router.push("/(auth)/artist-registration/step-4");
  };

  return (
    <View className="flex-1 bg-background ">
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={150}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AuthStepHeader
          onClose={() => {
            if (step13?.selectedPlanId) {
              router.replace("/(auth)/artist-registration/tattoola-pro");
            } else {
              router.replace("/(auth)/welcome");
            }
          }}
        />

        {/* Progress */}
        <RegistrationProgress
          currentStep={3}
          totalSteps={totalStepsDisplay}
          name="Crea il tuo profilo"
          icon={<SVGIcons.Person width={25} height={25} />}
          nameVariant="2xl"
        />

        {/* Upload section */}
        <View style={{ paddingHorizontal: s(24) }}>
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-foreground font-neueSemibold"
            style={{ marginBottom: mvs(2) }}
          >
            Carica la tua foto
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-error"
            >
              *
            </ScaledText>
          </ScaledText>
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-foreground font-montserratLight"
            style={{ marginBottom: mvs(12) }}
          >
            Supporta JPG, PNG, max size 5MB
          </ScaledText>

          <Pressable
            onPress={handlePickAvatar}
            className="items-center rounded-full bg-black/40"
            style={{ width: s(180), height: s(180) }}
          >
            {step3?.avatar ? (
              <Image
                source={{ uri: step3.avatar }}
                className="border-2 border-dashed rounded-full border-error/70 "
                style={{ width: s(180), height: s(180) }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="items-center justify-center border-2 border-dashed rounded-full border-error/70 bg-primary/20"
                style={{ width: s(180), height: s(180), gap: s(12) }}
              >
                <SVGIcons.User
                  style={{ marginBottom: s(6) }}
                  width={s(40)}
                  height={s(40)}
                />
                <View
                  className="rounded-full bg-primary"
                  style={{ paddingVertical: mvs(8), paddingHorizontal: s(16) }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueBold"
                  >
                    Carica immagine
                  </ScaledText>
                </View>
              </View>
            )}
          </Pressable>
        </View>

        {/* Inputs */}
        <View style={{ paddingHorizontal: s(24), marginTop: mvs(24) }}>
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-tat font-montserratSemibold"
            style={{ marginBottom: mvs(4) }}
          >
            Nome
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-error"
            >
              *
            </ScaledText>
          </ScaledText>
          <ScaledTextInput
            containerClassName={`flex-row items-center rounded-xl  ${focused === "firstName" ? "border-2 border-foreground" : "border border-gray"}`}
            className="flex-1 text-foreground"
            style={{ fontSize: s(12) }}
            placeholder="John"
            value={step3?.firstName || ""}
            onChangeText={(v) => updateStep3({ firstName: v })}
            onFocus={() => setFocused("firstName")}
            onBlur={() => {
              setFocused(null);
              validateField("firstName");
            }}
          />
          {!!errors.firstName && (
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-error font-montserratLight"
              style={{ marginTop: mvs(4) }}
            >
              {errors.firstName}
            </ScaledText>
          )}

          <View style={{ marginTop: mvs(15) }}>
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-tat font-montserratSemibold"
              style={{ marginBottom: mvs(4) }}
            >
              Cognome
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-error"
              >
                *
              </ScaledText>
            </ScaledText>
            <ScaledTextInput
              containerClassName={`flex-row items-center rounded-xl ${focused === "lastName" ? "border-2 border-foreground" : "border border-gray"}`}
              className="flex-1 text-foreground rounded-xl"
              style={{ fontSize: s(12) }}
              placeholder="Doe"
              value={step3?.lastName || ""}
              onChangeText={(v) => updateStep3({ lastName: v })}
              onFocus={() => setFocused("lastName")}
              onBlur={() => {
                setFocused(null);
                validateField("lastName");
              }}
            />
            {!!errors.lastName && (
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-error font-montserratLight"
                style={{ marginTop: mvs(4) }}
              >
                {errors.lastName}
              </ScaledText>
            )}
          </View>
        </View>

        {/* Next button */}
        <NextBackFooter
          showBack={false}
          onNext={handleNext}
          nextDisabled={!canProceed}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}
