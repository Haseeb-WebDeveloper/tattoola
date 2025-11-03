import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { isValid, step7Schema } from "@/utils/artistRegistrationValidation";
import { mvs, s } from "@/utils/scale";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
export default function ArtistStep7V2() {
  const {
    step7,
    updateStep7,
    totalStepsDisplay,
    currentStepDisplay,
    setCurrentStepDisplay,
  } = useArtistRegistrationV2Store();
  const [focused, setFocused] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ bio?: string }>({});

  useEffect(() => {
    setCurrentStepDisplay(7);
  }, []);

  const canProceed = isValid(step7Schema, {
    bio: step7.bio || "",
    instagram: step7.instagram || undefined,
    tiktok: step7.tiktok || undefined,
  });

  const validateAll = () => {
    const result = step7Schema.safeParse({
      bio: step7.bio || "",
      instagram: step7.instagram || undefined,
      tiktok: step7.tiktok || undefined,
    });
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "bio");
      setErrors({ bio: issue?.message });
    } else {
      setErrors({});
    }
  };

  const onNext = () => {
    if (!canProceed) return;
    router.push("/(auth)/artist-registration/step-8");
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={150}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-black"
    >
      {/* Header */}
      <AuthStepHeader />

      {/* Progress */}
      <RegistrationProgress
        currentStep={currentStepDisplay}
        totalSteps={totalStepsDisplay}
        name="Add Bio & Socials"
        icon={<SVGIcons.Heart width={22} height={22} />}
        nameVariant="2xl"
      />

      {/* Bio */}
      <View style={{ paddingHorizontal: s(24), marginBottom: mvs(20) }}>
        <ScaledText
          allowScaling={false}
          variant="sm"
          className="text-tat font-montserratSemibold"
          style={{ marginBottom: mvs(4) }}
        >
          Racconta qualcosa di te
          <ScaledText allowScaling={false} variant="sm" className="text-error">
            *
          </ScaledText>
        </ScaledText>
        <ScaledTextInput
          containerClassName={`rounded-2xl bg-black/40 ${focused === "bio" ? "border-2 border-foreground" : "border border-gray"}`}
          className="text-foreground"
          placeholder="Hi, I’m John. I’m a tattoo artist from the past 10 years..."
          placeholderTextColor="#A49A99"
          value={step7.bio || ""}
          onChangeText={(v) => updateStep7({ bio: v })}
          onFocus={() => setFocused("bio")}
          onBlur={() => {
            setFocused(null);
            validateAll();
          }}
          multiline
          numberOfLines={6}
          style={{
            textAlignVertical: "top",
            minHeight: mvs(120),
            fontSize: s(12),
          }}
        />
        {!!errors.bio && (
          <ScaledText
            allowScaling={false}
            variant="body2"
            className="text-error"
            style={{ marginTop: mvs(4) }}
          >
            {errors.bio}
          </ScaledText>
        )}
      </View>

      {/* Instagram */}
      <View style={{ paddingHorizontal: s(24), marginBottom: mvs(20) }}>
        <ScaledText
          allowScaling={false}
          variant="sm"
          className="text-tat font-montserratSemibold"
          style={{ marginBottom: mvs(4) }}
        >
          Inserisci il link al tuo account Instagram (facoltativo)
        </ScaledText>
        <View
          className={`flex-row items-center rounded-xl bg-black/40 ${focused === "instagram" ? "border-2 border-foreground" : "border border-gray"}`}
        >
          <View style={{ paddingLeft: s(16) }} className="bg-tat-foreground">
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-gray font-montserratSemibold bg-tat-foreground"
            >
              @
            </ScaledText>
          </View>
          <ScaledTextInput
            containerClassName="flex-1 rounded-xl "
            className="text-foreground rounded-xl"
            style={{ fontSize: s(12), paddingHorizontal: s(4) }}
            placeholder="tattooking_857"
            placeholderTextColor="#A49A99"
            autoCapitalize="none"
            value={(step7.instagram || "").replace(/^@/, "")}
            onChangeText={(v) => {
              const username = v.replace(/\s+/g, "").replace(/^@/, "");
              updateStep7({ instagram: username });
            }}
            onFocus={() => setFocused("instagram")}
            onBlur={() => setFocused(null)}
          />
        </View>
      </View>

      {/* TikTok */}
      <View style={{ paddingHorizontal: s(24), marginBottom: mvs(15) }}>
        <ScaledText
          allowScaling={false}
          variant="sm"
          className="text-tat font-montserratSemibold"
          style={{ marginBottom: mvs(4) }}
        >
          Inserisci il link al tuo account Tiktok (facoltativo)
        </ScaledText>
        <View
          className={`flex-row items-center rounded-xl bg-black/40 ${focused === "tiktok" ? "border-2 border-foreground" : "border border-gray"}`}
        >
          <View style={{ paddingLeft: s(16) }} className="bg-tat-foreground">
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-gray font-montserratSemibold bg-tat-foreground"
            >
              @
            </ScaledText>
          </View>
          <ScaledTextInput
            containerClassName="flex-1 rounded-xl "
            className="text-foreground rounded-xl"
            style={{ fontSize: s(12), paddingHorizontal: s(4) }}
            placeholder="tattooking_857"
            placeholderTextColor="#A49A99"
            autoCapitalize="none"
            value={(step7.tiktok || "").replace(/^@/, "")}
            onChangeText={(v) => {
              const username = v.replace(/\s+/g, "").replace(/^@/, "");
              updateStep7({ tiktok: username });
            }}
            onFocus={() => setFocused("tiktok")}
            onBlur={() => setFocused(null)}
          />
        </View>
      </View>

      {/* Footer */}
      <NextBackFooter
        onNext={onNext}
        nextLabel="Next"
        nextDisabled={!canProceed}
        backLabel="Back"
        onBack={() => router.back()}
      />
    </KeyboardAwareScrollView>
  );
}
