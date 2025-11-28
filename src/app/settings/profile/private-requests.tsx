import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { clearProfileCache } from "@/utils/database";
import { mvs, s, scaledFont } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

const PREDEFINED_MESSAGES = [
  "L'artista non può ricevere nuove richieste private in questo momento",
  "Mi dispiace, al momento non posso ricevere nuove richieste!",
];

export default function PrivateRequestsSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [acceptRequests, setAcceptRequests] = useState<boolean>(true);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [initialAcceptRequests, setInitialAcceptRequests] =
    useState<boolean>(true);
  const [initialRejectionMessage, setInitialRejectionMessage] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [artistId, setArtistId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        if (!user?.id) return;

        // Fetch artist profile
        const { data: profileData, error: profileError } = await supabase
          .from("artist_profiles")
          .select("id, acceptPrivateRequests, rejectionMessage")
          .eq("userId", user.id)
          .single();

        if (profileError || !profileData) {
          throw new Error("Artist profile not found");
        }

        if (mounted) {
          setArtistId(profileData.id);
          setAcceptRequests(profileData.acceptPrivateRequests ?? true);
          setInitialAcceptRequests(profileData.acceptPrivateRequests ?? true);

          const rejectionMsg = profileData.rejectionMessage;
          setInitialRejectionMessage(rejectionMsg);

          // Set selected message based on initial data
          if (rejectionMsg) {
            if (PREDEFINED_MESSAGES.includes(rejectionMsg)) {
              setSelectedMessage(rejectionMsg);
            } else {
              setSelectedMessage("custom");
              setCustomMessage(rejectionMsg);
            }
          } else {
            // Default to first predefined message if none set
            setSelectedMessage(PREDEFINED_MESSAGES[0]);
          }
        }
      } catch (error: any) {
        console.error("Error loading private requests settings:", error);
        toast.error(error.message || "Failed to load settings");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Get final rejection message
  const getFinalRejectionMessage = () => {
    // Always save the rejection message, even if currently accepting requests
    // This allows users to pre-configure their rejection message
    if (selectedMessage === "custom") {
      return customMessage.trim() || null;
    }
    return selectedMessage;
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    acceptRequests !== initialAcceptRequests ||
    getFinalRejectionMessage() !== initialRejectionMessage;

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      if (step === 2) {
        setStep(1);
      } else {
        router.back();
      }
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedModal(false);
    router.back();
  };

  const handleContinueEditing = () => {
    setShowUnsavedModal(false);
  };

  const handleNext = () => {
    // Only go to step 2 if user doesn't want to receive requests
    if (!acceptRequests) {
      setStep(2);
    }
  };

  const handleSave = async () => {
    if (!artistId) {
      router.back();
      return;
    }

    setIsLoading(true);

    try {
      const finalMessage = getFinalRejectionMessage();

      // console.log("finalMessage", finalMessage);
      // console.log("acceptRequests", acceptRequests);
      // console.log("artistId", artistId);

      const { error } = await supabase
        .from("artist_profiles")
        .update({
          acceptPrivateRequests: acceptRequests,
          rejectionMessage: finalMessage,
        })
        .eq("id", artistId);

      if (error) throw error;

      // Clear profile cache to force refresh
      await clearProfileCache(user!.id);

      toast.success("Private requests updated successfully");

      // Navigate back on success
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err: any) {
      console.error("Error updating private requests settings:", err);
      toast.error(err.message || "Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

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
            className="text-white font-neueSemibold"
          >
            Richieste private
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
          contentContainerStyle={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(100),
          }}
        >
          {loading ? (
            <>
              {/* Loading Skeleton */}
              {/* Question skeleton */}
              <View
                className="bg-gray/30 rounded"
                style={{
                  width: "80%",
                  height: s(20),
                  marginBottom: mvs(24),
                }}
              />

              {/* Option skeletons */}
              <View style={{ rowGap: mvs(8) }}>
                {Array.from({ length: 2 }).map((_, index) => (
                  <View
                    key={index}
                    className="rounded-xl border border-gray bg-[#100C0C]"
                    style={{
                      paddingHorizontal: s(16),
                      paddingVertical: mvs(20),
                      opacity: 0.5,
                    }}
                  >
                    <View
                      className="flex-row items-center"
                      style={{ gap: s(12) }}
                    >
                      <View
                        className="rounded-full bg-gray/30"
                        style={{ width: s(24), height: s(24) }}
                      />
                      <View className="flex-1">
                        <View
                          className="bg-gray/30 rounded"
                          style={{
                            width: index === 0 ? "70%" : "85%",
                            height: s(16),
                          }}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : step === 1 ? (
            <>
              {/* Step 1: Accept requests question */}
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-white font-montserratMedium"
                style={{ marginBottom: mvs(24) }}
              >
                Vuoi ricevere richieste private?
              </ScaledText>

              <View style={{ rowGap: mvs(8) }}>
                {/* Yes Option */}
                <TouchableOpacity
                  onPress={() => setAcceptRequests(true)}
                  className={`rounded-xl border ${acceptRequests ? "border-foreground" : "border-gray"} bg-[#100C0C]`}
                  style={{
                    paddingHorizontal: s(16),
                    paddingVertical: mvs(20),
                  }}
                >
                  <View
                    className="flex-row items-center"
                    style={{ gap: s(12) }}
                  >
                    {acceptRequests ? (
                      <SVGIcons.CircleCheckedCheckbox
                        width={s(24)}
                        height={s(24)}
                      />
                    ) : (
                      <SVGIcons.CircleUncheckedCheckbox
                        width={s(24)}
                        height={s(24)}
                      />
                    )}
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-foreground font-montserratMedium flex-1"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      Si voglio ricevere richieste private
                    </ScaledText>
                  </View>
                </TouchableOpacity>

                {/* No Option */}
                <TouchableOpacity
                  onPress={() => setAcceptRequests(false)}
                  className={`rounded-xl border ${!acceptRequests ? "border-foreground" : "border-gray"} bg-[#100C0C]`}
                  style={{
                    paddingHorizontal: s(16),
                    paddingVertical: mvs(20),
                  }}
                >
                  <View
                    className="flex-row items-center"
                    style={{ gap: s(12) }}
                  >
                    {!acceptRequests ? (
                      <SVGIcons.CircleCheckedCheckbox
                        width={s(24)}
                        height={s(24)}
                      />
                    ) : (
                      <SVGIcons.CircleUncheckedCheckbox
                        width={s(24)}
                        height={s(24)}
                      />
                    )}
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-foreground font-montserratMedium flex-1"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      No, in questo momento non voglio ricevere richieste
                      private
                    </ScaledText>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Step 2: Rejection message */}
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueLight"
                style={{ marginBottom: mvs(8) }}
              >
                Seleziona un messaggio sostitutivo che apparirà cliccando sul
                pulsante "Invia richiesta privata"
              </ScaledText>

              <View style={{ marginTop: mvs(24), rowGap: mvs(12) }}>
                {/* Predefined Messages */}
                {PREDEFINED_MESSAGES.map((msg, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedMessage(msg)}
                    className={`rounded-xl border ${selectedMessage === msg ? "border-foreground" : "border-gray"} bg-[#100C0C]`}
                    style={{
                      paddingHorizontal: s(16),
                      paddingVertical: mvs(16),
                    }}
                  >
                    <View
                      className="flex-row items-center"
                      style={{ gap: s(12) }}
                    >
                      {selectedMessage === msg ? (
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
                        className="text-foreground font-montserratMediumItalic flex-1"
                        style={{ flexShrink: 1, flexWrap: "wrap" }}
                      >
                        "{msg}"
                      </ScaledText>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Custom Message Option */}
                <TouchableOpacity
                  onPress={() => setSelectedMessage("custom")}
                  className={`rounded-xl border ${selectedMessage === "custom" ? "border-foreground" : "border-gray"} bg-[#100C0C]`}
                  style={{
                    paddingHorizontal: s(16),
                    paddingVertical: mvs(16),
                  }}
                >
                  <View
                    className="flex-row items-center"
                    style={{ gap: s(12) }}
                  >
                    {selectedMessage === "custom" ? (
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
                      className="text-foreground font-montserratSemibold flex-1"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      Write a custom message
                    </ScaledText>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Custom Message Input shown separate, not inside the option */}
              {selectedMessage === "custom" && (
                <View style={{ marginTop: mvs(16) }}>
                  <ScaledTextInput
                    value={customMessage}
                    onChangeText={setCustomMessage}
                    placeholder="I'm not available for the next 2 weeks..."
                    multiline
                    textAlignVertical="top"
                    maxLength={200}
                    editable={!isLoading}
                    className="text-foreground"
                    containerClassName="rounded-xl"
                    containerStyle={{
                      borderWidth: s(1),
                      borderColor: "#A49A99",
                      minHeight: mvs(150),
                      paddingVertical: mvs(4),
                      paddingHorizontal: s(8),
                    }}
                    style={{
                      flex: 1,
                    }}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View
          className="bg-background/90 backdrop-blur-xl"
          style={{
            paddingHorizontal: s(0),
            marginTop: mvs(24),
            marginBottom: mvs(0),
            backgroundColor: "transparent",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <View
            className="flex-row justify-between"
            style={{
              paddingHorizontal: s(24),
              paddingTop: mvs(16),
              paddingBottom: mvs(32),
              backgroundColor: "transparent",
              gap: 0,
            }}
          >
            {step === 2 ? (
              <>
                {/* BACK BUTTON */}
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  disabled={isLoading || loading}
                  className="w-fit rounded-full border border-foreground items-center flex-row"
                  style={{
                    paddingVertical: mvs(10.5),
                    paddingLeft: s(18),
                    paddingRight: s(20),
                    gap: s(15),
                    marginRight: s(12),
                  }}
                >
                  <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueSemibold"
                  >
                    Back
                  </ScaledText>
                </TouchableOpacity>

                {/* SAVE BUTTON */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!!(isLoading || loading)}
                  className={`rounded-full items-center flex-row ${!(isLoading || loading) ? "bg-primary" : "bg-gray/40"}`}
                  style={{
                    paddingVertical: mvs(10.5),
                    paddingLeft: s(25),
                    paddingRight: s(20),
                    gap: s(15),
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueSemibold"
                  >
                    Save
                  </ScaledText>
                  <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={acceptRequests ? handleSave : handleNext}
                  disabled={!!(isLoading || loading)}
                  className={`rounded-full items-center flex-row ${!(isLoading || loading) ? "bg-primary" : "bg-gray/40"}`}
                  style={{
                    paddingVertical: mvs(10.5),
                    paddingLeft: s(25),
                    paddingRight: s(20),
                    gap: s(15),
                  }}
                >
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-foreground font-neueSemibold"
                  >
                    {loading ? "Loading..." : acceptRequests ? "Save" : "Next"}
                  </ScaledText>
                  {acceptRequests ? null : (
                    <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
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
              You have unsaved changes
            </ScaledText>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-background font-montserratMedium text-center"
              style={{ marginBottom: mvs(32) }}
            >
              Do you want to discard them?
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
                  Continue Editing
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
                  Discard changes
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
