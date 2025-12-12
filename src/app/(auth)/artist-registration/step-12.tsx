import StyleInfoModal from "@/components/shared/StyleInfoModal";
import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/providers/AuthProvider";
import { cloudinaryService } from "@/services/cloudinary.service";
import { fetchTattooStyles, TattooStyleItem } from "@/services/style.service";
import {
  PortfolioProjectInput,
  useArtistRegistrationV2Store,
} from "@/stores/artistRegistrationV2Store";
import type { CompleteArtistRegistration } from "@/types/auth";
import { WorkArrangement } from "@/types/auth";
import { getFileNameFromUri } from "@/utils/get-file-name";
import { logger } from "@/utils/logger";
import { mvs, s } from "@/utils/scale";
import { TrimText } from "@/utils/text-trim";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

type DraftProject = {
  media: { uri: string; type: "image" | "video"; cloud?: string }[];
  description?: string;
  styles: string[]; // style IDs, max 3
};

type ModalStep = "upload" | "description" | "styles";

export default function ArtistStep12V2() {
  const {
    step12,
    step13,
    setProjectAtIndex,
    totalStepsDisplay,
    setCurrentStepDisplay,
  } = useArtistRegistrationV2Store();
  const { completeArtistRegistration } = useAuth();
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftProject>({ media: [], styles: [] });
  const [modalStep, setModalStep] = useState<ModalStep>("upload");
  const insets = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);
  const [allStyles, setAllStyles] = useState<TattooStyleItem[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [selectedStyleForInfo, setSelectedStyleForInfo] =
    useState<TattooStyleItem | null>(null);

  useEffect(() => {
    setCurrentStepDisplay(12);
  }, []);

  // Load tattoo styles for project style selection
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingStyles(true);
        const data = await fetchTattooStyles();
        if (mounted) setAllStyles(data);
      } catch (error) {
        console.error("Error loading tattoo styles:", error);
        if (mounted) setAllStyles([]);
      } finally {
        if (mounted) setLoadingStyles(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const grid = useMemo(
    () => Array.from({ length: 4 }).map((_, i) => step12.projects?.[i]),
    [step12.projects]
  );

  const openProjectModal = (idx: number) => {
    setActiveIndex(idx);
    setModalStep("upload");
    const existing = step12.projects?.[idx];
    if (existing) {
      const media = [
        ...(existing.photos || []).map((u) => ({
          uri: u,
          type: "image" as const,
          cloud: u,
        })),
        ...(existing.videos || []).map((u) => ({
          uri: u,
          type: "video" as const,
          cloud: u,
        })),
      ];
      setDraft({
        media,
        description: existing.description,
        styles: existing.associatedStyles || [],
      });
    } else {
      setDraft({ media: [], styles: [] });
    }
  };

  const handlePickMedia = async () => {
    // Calculate how many more files can be added
    const currentCount = draft.media.length;
    const remainingSlots = 5 - currentCount;
    if (remainingSlots <= 0) return; // Already at max

    const files = await pickFiles({
      mediaType: "all",
      allowsMultipleSelection: true,
      maxFiles: Math.min(remainingSlots, 5),
      cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions("image"),
    });
    if (files.length === 0) return;
    // show local immediately
    const locals = files.slice(0, remainingSlots).map((f) => ({
      uri: f.uri,
      type: f.type === "video" ? "video" : "image",
    })) as { uri: string; type: "image" | "video"; cloud?: string }[];
    setDraft((d) => ({
      ...d,
      media: [...d.media, ...locals].slice(0, 5) as {
        uri: string;
        type: "image" | "video";
        cloud?: string;
      }[],
    }));
    // upload in background
    const uploaded = await uploadToCloudinary(
      files,
      cloudinaryService.getPortfolioUploadOptions("image")
    );
    setDraft((d) => ({
      ...d,
      media: d.media.map((m) => {
        const match = uploaded.find((u) => u.uri === m.uri);
        return match?.cloudinaryResult?.secureUrl
          ? { ...m, cloud: match.cloudinaryResult.secureUrl }
          : m;
      }),
    }));
  };

  const onDragEnd = ({ data }: { data: typeof draft.media }) => {
    setDraft((d) => ({ ...d, media: data }));
  };

  const removeMedia = (index: number) => {
    setDraft((d) => ({
      ...d,
      media: d.media.filter((_, i) => i !== index),
    }));
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
    const index = draft.media.findIndex((m) => m.uri === item.uri);
    return (
      <View style={{ position: "relative", marginBottom: mvs(4) }}>
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
            accessibilityLabel="Riordina"
          >
            <SVGIcons.Drag className="w-6 h-6" />
          </Pressable>
          {/* Thumb */}
          <View
            className="relative overflow-hidden rounded-lg h-fit aspect-square"
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
                {item.cloud ? (
                  <Image
                    source={{
                      uri: cloudinaryService.getVideoThumbnailFromUrl(
                        item.cloud,
                        1,
                        200,
                        200
                      ),
                    }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="items-center justify-center border bg-tat-darkMaroon border-gray rounded-xl"
                    style={{ width: "100%", height: "100%" }}
                  />
                )}
                {/* Video icon overlay */}
                <View
                  className="absolute inset-0 items-center justify-center"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                >
                  <SVGIcons.Video style={{ width: s(30), height: s(30) }} />
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
            onPress={() => removeMedia(index)}
            style={{
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              top: -12,
              right: 0,
              elevation: 4,
              zIndex: 100,
            }}
            accessibilityLabel="Rimuovi"
          >
            <SVGIcons.Trash className="w-5 h-5" style={{ color: "#ff4c4c" }} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const saveDraftToProject = () => {
    if (activeIndex === null) return;
    const photos = draft.media
      .filter((m) => (m.cloud || m.uri) && m.type === "image")
      .map((m) => m.cloud || m.uri);
    const videos = draft.media
      .filter((m) => (m.cloud || m.uri) && m.type === "video")
      .map((m) => m.cloud || m.uri);
    const proj: PortfolioProjectInput = {
      photos,
      videos,
      description: draft.description,
      associatedStyles: draft.styles || [],
    };
    setProjectAtIndex(activeIndex, proj);
    setActiveIndex(null);
  };

  const firstAsset = (p?: PortfolioProjectInput) =>
    p?.photos?.[0] || p?.videos?.[0];

  // Helper to check if URL is a video
  const isVideoUrl = (url?: string) =>
    url &&
    (url.endsWith(".mp4") ||
      url.endsWith(".mov") ||
      url.endsWith(".webm") ||
      url.includes("/video/upload"));

  // Get thumbnail URL for videos
  const getThumbnailUrl = (url?: string) => {
    if (!url) return null;
    if (isVideoUrl(url)) {
      return cloudinaryService.getVideoThumbnailFromUrl(url, 1, 400, 400);
    }
    return url;
  };

  const canProceed =
    (step12.projects || []).filter(
      (p) => p && (p.photos?.length || 0) + (p.videos?.length || 0) > 0
    ).length >= 4;

  const handleSaveAndProceed = async () => {
    if (!canProceed || submitting) return;
    setSubmitting(true);
    try {
      const {
        step3,
        step4,
        step5,
        step7,
        step8,
        step9,
        step10,
        step11,
        step12: step12State,
        step13: step13State,
      } = useArtistRegistrationV2Store.getState();

      const registrationData: CompleteArtistRegistration = {
        step3: {
          firstName: step3.firstName || "",
          lastName: step3.lastName || "",
          avatar: step3.avatar || "",
        },
        step4: {
          workArrangement: step4.workArrangement || WorkArrangement.FREELANCE,
        },
        step5: {
          studioName: step5.studioName || "",
          province: step5.province || "",
          provinceId: step5.provinceId || "",
          municipalityId: step5.municipalityId || "",
          municipality: step5.municipality || "",
          studioAddress: step5.studioAddress || "",
          website: step5.website || "",
          phone: step5.phone || "",
        },
        step6: {
          certificateUrl: step4.certificateUrl || "",
        },
        step7: {
          bio: step7.bio || "",
          instagram: step7.instagram || "",
          tiktok: step7.tiktok || "",
        },
        step8: {
          // All styles selected via checkboxes
          styles: step8.styles || [],
          // Subset marked as favorites via star icons
          favoriteStyles: step8.favoriteStyles || [],
        },
        step9: {
          servicesOffered: step9.servicesOffered || [],
        },
        step10: {
          bodyParts: step10.bodyParts || [],
        },
        step11: {
          minimumPrice: step11.minimumPrice || 0,
          hourlyRate: step11.hourlyRate || 0,
        },
        step12: {
          projects: (step12State.projects || []).map((project, index) => {
            // Ensure associatedStyles is always an array
            let stylesArray: string[] = [];
            if (project.associatedStyles) {
              if (Array.isArray(project.associatedStyles)) {
                stylesArray = project.associatedStyles.filter(
                  (s) => s && typeof s === "string"
                );
              } else if (typeof project.associatedStyles === "string") {
                // If it's a single string, convert to array
                stylesArray = [project.associatedStyles];
              }
            }

            return {
              title: project.title,
              description: project.description,
              photos: project.photos || [],
              videos: project.videos || [],
              associatedStyles: stylesArray,
              order: index + 1,
            };
          }),
        },
        // Minimal stub to satisfy type; not used by backend save
        step13: {
          selectedPlanId: "",
          billingCycle: "MONTHLY",
        },
      };

      // Check if plan is selected before attempting registration
      const currentStep13 = useArtistRegistrationV2Store.getState().step13;

      // If plan is selected, redirect to checkout first (payment required)
      if (currentStep13?.selectedPlanId) {
        logger.log("Plan selected, redirecting to checkout for payment");
        router.replace("/(auth)/artist-registration/checkout");
        setSubmitting(false);
        return;
      }

      // If no plan selected, try to complete registration (will fail with PAYMENT_REQUIRED)
      await completeArtistRegistration(registrationData);

      // Success - profile created successfully with active subscription
      // Redirect to main app or profile page
      logger.log("Registration completed successfully");
      router.replace("/(tabs)/profile");
    } catch (error) {
      logger.error("Registration save error:", error);
      let errorMessage = "Failed to save registration. Please try again.";

      // Handle payment required error - redirect to checkout or plan selection
      if (
        error instanceof Error &&
        (error as any).code === "PAYMENT_REQUIRED"
      ) {
        logger.log("Payment required, checking plan selection");
        const currentStep13 = useArtistRegistrationV2Store.getState().step13;
        if (currentStep13?.selectedPlanId) {
          // Plan selected but not paid - redirect to checkout
          logger.log("Plan selected, redirecting to checkout");
          router.replace("/(auth)/artist-registration/checkout");
          toast.error("Please complete payment to create your artist profile.");
        } else {
          // No plan selected - redirect to plan selection
          logger.log("No plan selected, redirecting to plan selection");
          router.replace("/(auth)/artist-registration/tattoola-pro");
          toast.error("Please select a subscription plan to continue.");
        }
        setSubmitting(false);
        return;
      }

      // Check if profile was partially created (user exists in database)
      // If profile exists, still redirect to checkout so user can complete payment
      let profileCreated = false;
      try {
        const { supabase } = await import("@/utils/supabase");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data: userExists } = await supabase
            .from("users")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle();

          if (userExists) {
            profileCreated = true;
            logger.log(
              "Profile was created despite error, redirecting to checkout"
            );
          }
        }
      } catch (checkError) {
        logger.error("Error checking if profile was created:", checkError);
      }

      if (error instanceof Error) {
        if (
          error.message.includes("duplicate") ||
          error.message.includes("already exists")
        ) {
          errorMessage =
            "Some information already exists. Your profile has been updated.";
          profileCreated = true; // Profile likely exists
        } else if (
          error.message.includes("foreign key") ||
          error.message.includes("violates")
        ) {
          errorMessage = "Invalid data provided. Please check your entries.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (
          error.message.includes("column") &&
          error.message.includes("does not exist")
        ) {
          errorMessage =
            "Database configuration error. Please contact support.";
        } else if (
          error.message.includes("cache") ||
          error.message.includes("schema")
        ) {
          errorMessage = "Database sync error. Please try again in a moment.";
        } else if (error.message) {
          errorMessage =
            error.message.length > 100
              ? error.message.substring(0, 100) + "..."
              : error.message;
        }
      }

      // Check if plan is selected - if so, redirect to checkout even on error
      // This allows user to complete payment and retry
      const currentStep13 = useArtistRegistrationV2Store.getState().step13;
      if (currentStep13?.selectedPlanId) {
        if (profileCreated) {
          toast.error(
            "Profile created but some data may be incomplete. Please check your profile."
          );
        } else {
          toast.error("Please complete payment to finish registration.");
        }
        logger.log(
          "Plan selected, redirecting to checkout:",
          currentStep13.selectedPlanId
        );
        router.replace("/(auth)/artist-registration/checkout");
        setSubmitting(false);
        return;
      }

      // If no plan selected and profile wasn't created, show error
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="relative flex-1 pb-40 bg-black">
      {/* Header */}
      <AuthStepHeader
        onClose={() => {
          router.replace("/(auth)/welcome");
        }}
      />

      {/* Progress */}
      <RegistrationProgress
        currentStep={12}
        totalSteps={totalStepsDisplay}
        name="Aggiungi i tuoi lavori"
        description="Aggiungi 4 progetti. Ogni progetto: carica media (1-5), aggiungi descrizione, seleziona stili (0-3)."
        icon={<SVGIcons.Work width={19} height={19} />}
        nameVariant="2xl"
      />

      {/* 2x2 grid */}
      <View style={{ paddingHorizontal: s(16) }}>
        <View
          className="flex-row mb-2"
          style={{ marginBottom: mvs(13), gap: mvs(15) }}
        >
          {[0, 1].map((i) => (
            <Pressable
              key={i}
              onPress={() => openProjectModal(i)}
              className="items-center justify-center flex-1 h-full overflow-hidden border-dashed aspect-square bg-tat-darkMaroon border-primary rounded-xl"
              style={{ borderWidth: s(1) }}
            >
              {firstAsset(grid[i]) ? (
                <View className="relative items-center justify-between w-full h-full">
                  <View className="w-full ">
                    <Image
                      source={{
                        uri:
                          getThumbnailUrl(firstAsset(grid[i])) ||
                          firstAsset(grid[i])!,
                      }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {isVideoUrl(firstAsset(grid[i])) && (
                      <View
                        className="absolute inset-0 items-center justify-center"
                        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                      >
                        <SVGIcons.Video width={s(30)} height={s(30)} />
                      </View>
                    )}
                  </View>
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="absolute bottom-0 left-0 right-0 text-center text-gray font-neueMedium bg-tat-darkMaroon"
                    style={{
                      paddingHorizontal: s(16),
                      paddingVertical: mvs(6),
                    }}
                  >
                    Lavoro {i + 1}
                  </ScaledText>
                </View>
              ) : (
                <View className="items-center justify-center gap-2">
                  <SVGIcons.AddRed className="w-6 h-6" />
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-gray font-neueMedium"
                  >
                    Lavoro {i + 1}
                  </ScaledText>
                </View>
              )}
            </Pressable>
          ))}
        </View>
        <View className="flex-row" style={{ gap: mvs(15) }}>
          {[2, 3].map((i) => (
            <Pressable
              key={i}
              onPress={() => openProjectModal(i)}
              className="items-center justify-center flex-1 h-full overflow-hidden border-dashed aspect-square bg-tat-darkMaroon border-primary rounded-xl"
              style={{ borderWidth: s(1) }}
            >
              {firstAsset(grid[i]) ? (
                <View className="relative items-center justify-between w-full h-full">
                  <View className="relative w-full">
                    <Image
                      source={{
                        uri:
                          getThumbnailUrl(firstAsset(grid[i])) ||
                          firstAsset(grid[i])!,
                      }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {isVideoUrl(firstAsset(grid[i])) && (
                      <View
                        className="absolute inset-0 items-center justify-center"
                        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                      >
                        <SVGIcons.Video width={s(30)} height={s(30)} />
                      </View>
                    )}
                  </View>
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="absolute bottom-0 left-0 right-0 text-center text-gray font-neueMedium bg-tat-darkMaroon"
                    style={{
                      paddingHorizontal: s(16),
                      paddingVertical: mvs(6),
                    }}
                  >
                    Lavoro {i + 1}
                  </ScaledText>
                </View>
              ) : (
                <View className="items-center justify-center gap-2">
                  <SVGIcons.AddRed className="w-6 h-6" />
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-gray font-neueMedium"
                  >
                    Lavoro {i + 1}
                  </ScaledText>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Footer */}
      <NextBackFooter
        onNext={handleSaveAndProceed}
        nextDisabled={!canProceed || submitting || uploading}
        backDisabled={submitting || uploading}
        nextLabel={submitting ? "Salvataggio..." : "Quasi fatto!"}
        backLabel="Indietro"
        onBack={() => router.back()}
      />

      {/* Modal flow */}
      <Modal
        visible={activeIndex !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveIndex(null)}
      >
        <View className="flex-1  min-h-[100dvh] bg-background  ">
          <View className="flex-1 w-full rounded-t-3xl">
            <View
              className="relative flex-row items-center justify-between border-b border-gray bg-tat-darkMaroon"
              style={{
                paddingBottom: mvs(20),
                paddingTop: mvs(60),
                paddingHorizontal: s(20),
              }}
            >
              <TouchableOpacity
                onPress={() => setActiveIndex(null)}
                className="items-center justify-center rounded-full bg-foreground/20"
                style={{
                  width: s(30),
                  height: s(30),
                }}
              >
                <SVGIcons.Close className="w-8 h-8" />
              </TouchableOpacity>
              <View className="flex-row items-center justify-center">
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-foreground font-neueSemibold"
                >
                  Aggiungi Design
                </ScaledText>
              </View>

              <View style={{ height: mvs(30), width: mvs(30) }} />
            </View>

            {/* Step 1: media upload & re-order */}
            {modalStep === "upload" && (
              <View className="flex-1">
                {draft.media.length === 0 ? (
                  <ScrollView
                    style={{ paddingTop: mvs(20) }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: s(20) }}
                  >
                    <View style={{ marginBottom: mvs(15) }}>
                      <ScaledText
                        allowScaling={false}
                        variant="lg"
                        className="text-foreground font-neueSemibold"
                      >
                        Carica foto e video
                      </ScaledText>
                      <ScaledText
                        allowScaling={false}
                        variant="11"
                        className="text-gray font-neueSemibold"
                        style={{ marginTop: mvs(3) }}
                      >
                        Devi selezionare almeno{" "}
                        <ScaledText
                          allowScaling={false}
                          variant="11"
                          className="font-neueSemibold"
                          style={{ color: "#FF7F56" }}
                        >
                          1 media
                        </ScaledText>{" "}
                        (massimo 5)
                      </ScaledText>
                    </View>
                    {/* Upload area - matching step-6 design */}
                    {draft.media.length < 5 && (
                      <View
                        className="items-center border-dashed border-primary rounded-xl bg-tat-darkMaroon"
                        style={{
                          paddingVertical: mvs(24),
                          paddingHorizontal: s(16),
                          borderWidth: s(1),
                          marginBottom: mvs(15),
                        }}
                      >
                        <SVGIcons.Upload width={s(42)} height={s(42)} />
                        <TouchableOpacity
                          onPress={handlePickMedia}
                          disabled={uploading || draft.media.length >= 5}
                          className={`text-background rounded-full ${
                            draft.media.length >= 5
                              ? "bg-gray/40"
                              : "bg-primary"
                          }`}
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
                            {uploading
                              ? "Caricamento..."
                              : draft.media.length >= 5
                                ? "Massimo 5 file"
                                : "Carica file"}
                          </ScaledText>
                        </TouchableOpacity>
                        <ScaledText
                          allowScaling={false}
                          variant="11"
                          className="text-center text-gray font-neueSemibold"
                          style={{ marginTop: mvs(12) }}
                        >
                          Fino a 5 foto, supporta JPG, PNG. Max size 5MB{"\n"}
                          Fino a 2 video, supporta MOV, MP4, AVI. Max size 10MB
                        </ScaledText>
                      </View>
                    )}
                  </ScrollView>
                ) : (
                  <View className="flex-1 px-6 pt-6">
                    <View className="mb-6">
                      <ScaledText
                        allowScaling={false}
                        variant="lg"
                        className="text-foreground font-neueSemibold"
                      >
                        Carica foto e video
                      </ScaledText>
                      <ScaledText
                        allowScaling={false}
                        variant="11"
                        className="text-gray font-neueSemibold"
                      >
                        Devi selezionare almeno{" "}
                        <ScaledText
                          allowScaling={false}
                          variant="11"
                          className="font-neueSemibold"
                          style={{ color: "#FF7F56" }}
                        >
                          1 media
                        </ScaledText>{" "}
                        (massimo 5)
                      </ScaledText>
                    </View>

                    {/* Upload area */}
                    {draft.media.length < 5 && (
                      <View
                        className="items-center border-dashed border-primary rounded-xl bg-tat-darkMaroon"
                        style={{
                          paddingVertical: mvs(24),
                          paddingHorizontal: s(16),
                          borderWidth: s(1),
                          marginBottom: mvs(15),
                        }}
                      >
                        <SVGIcons.Upload width={s(42)} height={s(42)} />
                        <TouchableOpacity
                          onPress={handlePickMedia}
                          disabled={uploading || draft.media.length >= 5}
                          className={`text-background rounded-full ${
                            draft.media.length >= 5
                              ? "bg-gray/40"
                              : "bg-primary"
                          }`}
                          style={{
                            paddingVertical: mvs(8),
                            paddingHorizontal: s(20),
                            borderRadius: s(70),
                            marginTop: mvs(8),
                          }}
                        >
                          <ScaledText
                            allowScaling={false}
                            variant="md"
                            className="text-foreground font-neueSemibold"
                          >
                            {uploading
                              ? "Caricamento..."
                              : draft.media.length >= 5
                                ? "Massimo 5 file"
                                : "Carica file"}
                          </ScaledText>
                        </TouchableOpacity>
                        <ScaledText
                          allowScaling={false}
                          variant="11"
                          className="text-center text-gray font-neueSemibold"
                          style={{
                            marginTop: mvs(12),
                            paddingHorizontal: s(16),
                          }}
                        >
                          Fino a 5 foto, supporta JPG, PNG. Max size 5MB{"\n"}
                          Fino a 2 video, supporta MOV, MP4, AVI. Max size 10MB
                        </ScaledText>
                      </View>
                    )}

                    {/* <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-foreground font-neueSemibold"
                      style={{ marginBottom: mvs(15) }}
                    >
                      Uploaded files
                    </ScaledText> */}

                    <View style={{ marginTop: mvs(15) }}>
                      <DraggableFlatList
                        data={draft.media}
                        onDragEnd={onDragEnd}
                        keyExtractor={(item, index) => `${item.uri}-${index}`}
                        renderItem={renderMediaItem}
                        scrollEnabled={true}
                        removeClippedSubviews={false}
                        style={{ maxHeight: draft.media.length * 100 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                          paddingBottom: mvs(90),
                          paddingTop: mvs(14),
                          rowGap: mvs(12),
                        }}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Step 2: description */}
            {modalStep === "description" && (
              <ScrollView
                className="px-6 pt-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: mvs(20) }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-foreground font-neueBold"
                >
                  Descrizione
                </ScaledText>
                <ScaledText
                  allowScaling={false}
                  variant="11"
                  className="text-gray font-neueSemibold"
                  style={{ marginBottom: mvs(6) }}
                >
                  Descrivi il tuo post in poche parole.
                </ScaledText>

                {/* Display uploaded images */}
                {draft.media.length > 0 && (
                  <View className="mb-6">
                    <View className="flex-row flex-wrap gap-2">
                      {draft.media.map((item, index) => {
                        const thumbnailUrl =
                          item.type === "video" && item.cloud
                            ? cloudinaryService.getVideoThumbnailFromUrl(
                                item.cloud,
                                1,
                                200,
                                320
                              )
                            : null;
                        return (
                          <View
                            key={`${item.uri}-${index}`}
                            className="relative w-20 h-32 overflow-hidden rounded-lg"
                          >
                            {thumbnailUrl ? (
                              <Image
                                source={{ uri: thumbnailUrl }}
                                className="w-full h-full"
                                resizeMode="cover"
                              />
                            ) : (
                              <Image
                                source={{ uri: item.cloud || item.uri }}
                                className="w-full h-full"
                                resizeMode="cover"
                              />
                            )}
                            {item.type === "video" && (
                              <View
                                className="absolute inset-0 items-center justify-center"
                                style={{
                                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                                }}
                              >
                                <SVGIcons.Video width={s(20)} height={s(20)} />
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Description input */}
                <View className="relative">
                  {!descriptionFocused && (
                    <View
                      className="absolute z-10 items-center justify-center"
                      style={{
                        top: s(12),
                        left: s(12),
                      }}
                    >
                      <SVGIcons.Pen1 width={s(18)} height={s(18)} />
                    </View>
                  )}
                  <ScaledTextInput
                    containerClassName="rounded-xl border border-gray"
                    className="text-foreground rounded-xl bg-tat-foreground"
                    style={{
                      textAlignVertical: "top",
                      minHeight: mvs(150),
                      fontSize: s(12),
                      paddingLeft: descriptionFocused ? s(16) : s(35),
                    }}
                    multiline
                    numberOfLines={4}
                    placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    value={draft.description || ""}
                    onChangeText={(v) =>
                      setDraft((d) => ({ ...d, description: v }))
                    }
                    onFocus={() => setDescriptionFocused(true)}
                    onBlur={() => setDescriptionFocused(false)}
                  />
                </View>
              </ScrollView>
            )}

            {/* Step 3: styles selection */}
            {modalStep === "styles" && (
              <ScrollView
                className="px-6 pt-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: mvs(20) }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-foreground font-neueBold"
                >
                  Seleziona stili per questo lavoro
                </ScaledText>
                <ScaledText
                  allowScaling={false}
                  variant="11"
                  className="text-gray font-neueSemibold"
                  style={{ marginBottom: mvs(12) }}
                >
                  Scegli fino a 3 stili che descrivono meglio questo progetto.
                </ScaledText>

                {loadingStyles ? (
                  <View className="items-center justify-center py-8">
                    <ScaledText
                      allowScaling={false}
                      variant="sm"
                      className="text-gray font-montserratMedium"
                    >
                      Caricamento stili...
                    </ScaledText>
                  </View>
                ) : (
                  <View style={{ rowGap: mvs(0) }}>
                    {allStyles.map((style) => {
                      const selected = draft.styles.includes(style.id);
                      const isDisabled = !selected && draft.styles.length >= 3;

                      // Resolve image URL
                      const resolveImageUrl = (url?: string | null) => {
                        if (!url) return undefined;
                        try {
                          if (
                            url.includes("imgres") &&
                            url.includes("imgurl=")
                          ) {
                            const u = new URL(url);
                            const real = u.searchParams.get("imgurl");
                            return real || url;
                          }
                          return url;
                        } catch {
                          return url;
                        }
                      };

                      const img = resolveImageUrl(style.imageUrl);

                      return (
                        <View
                          key={style.id}
                          className="flex-row items-center"
                          style={{ opacity: isDisabled ? 0.5 : 1 }}
                        >
                          {/* Left select box */}
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => {
                              setDraft((d) => {
                                if (selected) {
                                  return {
                                    ...d,
                                    styles: d.styles.filter(
                                      (id) => id !== style.id
                                    ),
                                  };
                                }
                                if (isDisabled) return d;
                                return {
                                  ...d,
                                  styles: [...d.styles, style.id],
                                };
                              });
                            }}
                            disabled={isDisabled}
                            style={{
                              alignItems: "center",
                              justifyContent: "center",
                              paddingVertical: mvs(6),
                              paddingRight: s(16),
                            }}
                          >
                            {selected ? (
                              <SVGIcons.CheckedCheckbox
                                width={s(20)}
                                height={s(20)}
                              />
                            ) : (
                              <SVGIcons.UncheckedCheckbox
                                width={s(20)}
                                height={s(20)}
                              />
                            )}
                          </TouchableOpacity>

                          {/* Image */}
                          <TouchableOpacity
                            onPress={() => setSelectedStyleForInfo(style)}
                            activeOpacity={0.7}
                            disabled={isDisabled}
                          >
                            {img ? (
                              <Image
                                source={{ uri: img }}
                                className="border-b border-gray/20"
                                style={{ width: s(120), height: mvs(72) }}
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                className="bg-gray/30"
                                style={{ width: s(155), height: mvs(72) }}
                              />
                            )}
                          </TouchableOpacity>

                          {/* Name */}
                          <TouchableOpacity
                            className="flex-1"
                            style={{ paddingLeft: s(16) }}
                            onPress={() => setSelectedStyleForInfo(style)}
                            activeOpacity={0.7}
                            disabled={isDisabled}
                          >
                            <ScaledText
                              allowScaling={false}
                              style={{ fontSize: 12.445 }}
                              className="text-foreground font-montserratSemibold"
                            >
                              {style.name}
                            </ScaledText>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            )}

            {/* Modal footer */}
            <View
              className="flex-row justify-between"
              style={{
                paddingHorizontal: s(24),
                marginTop: mvs(24),
                paddingBottom: Math.max(insets.bottom, mvs(20)),
              }}
            >
              {modalStep === "upload" && (
                <>
                  <TouchableOpacity
                    onPress={() => setActiveIndex(null)}
                    className="flex-row items-center gap-3 border rounded-full border-foreground"
                    style={{
                      paddingVertical: mvs(10.5),
                      paddingLeft: s(18),
                      paddingRight: s(20),
                    }}
                  >
                    <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-foreground font-neueSemibold"
                    >
                      Indietro
                    </ScaledText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setModalStep("description")}
                    disabled={draft.media.length === 0}
                    className={`rounded-full items-center justify-center flex-row gap-3 ${
                      draft.media.length > 0 ? "bg-primary" : "bg-gray/40"
                    }`}
                    style={{
                      paddingVertical: mvs(10.5),
                      paddingLeft: s(18),
                      paddingRight: s(20),
                    }}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-foreground font-neueSemibold"
                    >
                      Avanti
                    </ScaledText>
                    <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
                  </TouchableOpacity>
                </>
              )}

              {modalStep === "description" && (
                <>
                  <TouchableOpacity
                    onPress={() => setModalStep("upload")}
                    className="flex-row items-center justify-center gap-3 border rounded-full border-foreground"
                    style={{
                      paddingVertical: mvs(10.5),
                      paddingLeft: s(18),
                      paddingRight: s(20),
                    }}
                  >
                    <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-foreground font-neueSemibold"
                    >
                      Indietro
                    </ScaledText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setModalStep("styles")}
                    className="flex-row items-center justify-center gap-3 rounded-full bg-primary"
                    style={{
                      paddingVertical: mvs(10.5),
                      paddingLeft: s(18),
                      paddingRight: s(20),
                    }}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-foreground font-neueSemibold"
                    >
                      Avanti
                    </ScaledText>
                    <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
                  </TouchableOpacity>
                </>
              )}

              {modalStep === "styles" && (
                <>
                  <TouchableOpacity
                    onPress={() => setModalStep("description")}
                    className="flex-row items-center justify-center gap-3 border rounded-full border-foreground"
                    style={{
                      paddingVertical: mvs(10.5),
                      paddingLeft: s(18),
                      paddingRight: s(20),
                    }}
                  >
                    <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-foreground font-neueSemibold"
                    >
                      Indietro
                    </ScaledText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={saveDraftToProject}
                    className="flex-row items-center justify-center gap-3 rounded-full bg-primary"
                    style={{
                      paddingVertical: mvs(10.5),
                      paddingLeft: s(18),
                      paddingRight: s(20),
                    }}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-foreground font-neueSemibold"
                    >
                      Salva
                    </ScaledText>
                    <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Style Info Modal */}
      <StyleInfoModal
        visible={selectedStyleForInfo !== null}
        style={selectedStyleForInfo}
        onClose={() => setSelectedStyleForInfo(null)}
      />
    </View>
  );
}
