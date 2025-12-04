import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAuth } from "@/providers/AuthProvider";
import { cloudinaryService } from "@/services/cloudinary.service";
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
};

type ModalStep = "upload" | "description";

export default function ArtistStep12V2() {
  const {
    step12,
    setProjectAtIndex,
    totalStepsDisplay,
    setCurrentStepDisplay,
  } = useArtistRegistrationV2Store();
  const { completeArtistRegistration } = useAuth();
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftProject>({ media: [] });
  const [modalStep, setModalStep] = useState<ModalStep>("upload");
  const insets = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentStepDisplay(12);
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
      setDraft({ media, description: existing.description });
    } else {
      setDraft({ media: [] });
    }
  };

  const handlePickMedia = async () => {
    const files = await pickFiles({
      mediaType: "all",
      allowsMultipleSelection: true,
      maxFiles: 5,
      cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions("image"),
    });
    if (files.length === 0) return;
    // show local immediately
    const locals = files.slice(0, 5).map((f) => ({
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
          className="bg-tat-foreground border-gray rounded-xl flex-row items-center"
          style={{
            paddingLeft: s(10),
            paddingRight: s(16),
            overflow: "visible",
            position: "relative",
            borderWidth: s(1),
            paddingVertical: mvs(3),
          }}
        >
          {/* Drag Handle */}
          <Pressable
            onLongPress={drag}
            disabled={isActive}
            style={{
              justifyContent: "center",
              alignItems: "center",
              marginRight: s(12),
            }}
            accessibilityLabel="Reorder"
          >
            <SVGIcons.Drag style={{ width: s(6), height: s(6) }} />
          </Pressable>
          {/* Thumb */}
          <View
            className="overflow-hidden rounded-lg h-fit aspect-square"
            style={{ width: s(60), marginRight: s(16) }}
          >
            {item.type === "image" ? (
              <Image
                source={{ uri: item.cloud || item.uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="items-center justify-center bg-tat-darkMaroon border border-gray rounded-xl"
                style={{ width: "100%", height: "100%" }}
              >
                <SVGIcons.Video style={{ width: s(30), height: s(30) }} />
              </View>
            )}
          </View>
          {/* Filename */}
          <View style={{ flex: 1 }}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-gray font-neueSemibold"
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
                return `${TrimText(base, 10)}${ext}`;
              })()}
            </ScaledText>
          </View>
          {/* Trash/Delete */}
          <TouchableOpacity
            onPress={() => removeMedia(index)}
            className="bg-foreground"
            style={{
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              top: -12,
              right: 0,
              elevation: 4,
              zIndex: 100,
              width: s(20),
              height: s(20),
              borderRadius: s(70),
              borderWidth: s(1),
              borderColor: "#A49A99",
            }}
            accessibilityLabel="Remove"
          >
            <SVGIcons.Trash width={s(13.5)} height={s(13.5)} />
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
    };
    setProjectAtIndex(activeIndex, proj);
    setActiveIndex(null);
  };

  const firstAsset = (p?: PortfolioProjectInput) =>
    p?.photos?.[0] || p?.videos?.[0];
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
          projects: (step12State.projects || []).map((project, index) => ({
            title: project.title,
            description: project.description,
            photos: project.photos,
            videos: project.videos,
            associatedStyles: [],
            order: index + 1,
          })),
        },
        // Minimal stub to satisfy type; not used by backend save
        step13: {
          selectedPlanId: "",
          billingCycle: "MONTHLY",
        },
      };

      console.log("registrationData", registrationData);

      await completeArtistRegistration(registrationData);
      router.replace("/(auth)/artist-registration/step-13");
    } catch (error) {
      logger.error("Registration save error:", error);
      let errorMessage = "Failed to save registration. Please try again.";
      if (error instanceof Error) {
        if (
          error.message.includes("duplicate") ||
          error.message.includes("already exists")
        ) {
          errorMessage =
            "Some information already exists. Your profile has been updated.";
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
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-black pb-40 relative">
      {/* Header */}
      <AuthStepHeader />

      {/* Progress */}
      <RegistrationProgress
        currentStep={12}
        totalSteps={totalStepsDisplay}
        name="Aggiungi le tue opere"
        description="Aggiungi 4 progetti. Ognuno può includere fino a 5 contenuti multimediali (massimo 2 video)."
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
              className="flex-1 h-full aspect-square bg-tat-darkMaroon border-dashed border-primary rounded-xl items-center justify-center overflow-hidden"
              style={{ borderWidth: s(1) }}
            >
              {firstAsset(grid[i]) ? (
                <View className="w-full h-full items-center justify-between gap-2 pb-2">
                  <Image
                    source={{ uri: firstAsset(grid[i])! }}
                    className="w-full h-32"
                    resizeMode="cover"
                  />
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-gray font-neueMedium"
                  >
                    Work {i + 1}
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
              className="flex-1 h-full aspect-square bg-tat-darkMaroon border-dashed border-primary rounded-xl items-center justify-center overflow-hidden"
              style={{ borderWidth: s(1) }}
            >
              {firstAsset(grid[i]) ? (
                <View className="w-full h-full items-center justify-between gap-2 pb-2">
                  <Image
                    source={{ uri: firstAsset(grid[i])! }}
                    className="w-full h-32"
                    resizeMode="cover"
                  />
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="text-gray font-neueMedium"
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
        nextLabel={submitting ? "Saving..." : "Ci siamo quasi!"}
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
              className="border-b border-gray flex-row items-center justify-between relative bg-tat-darkMaroon"
              style={{
                paddingBottom: mvs(20),
                paddingTop: mvs(60),
                paddingHorizontal: s(20),
              }}
            >
              <TouchableOpacity
                onPress={() => setActiveIndex(null)}
                className=" rounded-full bg-foreground/20 items-center justify-center"
                style={{
                  width: s(30),
                  height: s(30),
                }}
              >
                <SVGIcons.Close className="w-8 h-8" />
              </TouchableOpacity>
              <View className="flex-row items-center  justify-center">
                <ScaledText
                  allowScaling={false}
                  variant="lg"
                  className="text-foreground font-neueSemibold"
                >
                  Aggiungi disegno
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
                          una foto
                        </ScaledText>{" "}
                        e 3 foto/video
                      </ScaledText>
                    </View>
                    {/* Upload area - matching step-6 design */}
                    <View
                      className="border-dashed border-primary rounded-xl bg-tat-darkMaroon items-center"
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
                          {uploading ? "Uploading..." : "Carica file"}
                        </ScaledText>
                      </TouchableOpacity>
                      <ScaledText
                        allowScaling={false}
                        variant="11"
                        className="text-gray font-neueSemibold text-center"
                        style={{ marginTop: mvs(12) }}
                      >
                        Fino a 5 foto, supporta JPG, PNG. Max size 5MB{"\n"}
                        Fino a 2 video, supporta MOV, MP4, AVI. Max size 10MB
                      </ScaledText>
                    </View>
                  </ScrollView>
                ) : (
                  <View className="px-6 pt-6 flex-1">
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
                          une foto
                        </ScaledText>{" "}
                        e 3 foto/video
                      </ScaledText>
                    </View>

                    {/* Upload area */}
                    <View
                      className="border-dashed border-primary rounded-xl bg-tat-darkMaroon items-center"
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
                        disabled={uploading}
                        className="bg-primary text-background rounded-full"
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
                          {uploading ? "Uploading..." : "Carica file"}
                        </ScaledText>
                      </TouchableOpacity>
                      <ScaledText
                        allowScaling={false}
                        variant="11"
                        className="text-gray font-neueSemibold text-center"
                        style={{ marginTop: mvs(12), paddingHorizontal: s(16) }}
                      >
                        Fino a 5 foto, supporta JPG, PNG. Max size 5MB{"\n"}
                        Fino a 2 video, supporta MOV, MP4, AVI. Max size 10MB
                      </ScaledText>
                    </View>

                    {/* <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-foreground font-neueSemibold"
                      style={{ marginBottom: mvs(15) }}
                    >
                      Uploaded files
                    </ScaledText> */}

                    <View style={{ maxHeight: 350, marginTop: mvs(15) }}>
                      <DraggableFlatList
                        data={draft.media}
                        onDragEnd={onDragEnd}
                        keyExtractor={(item, index) => `${item.uri}-${index}`}
                        renderItem={renderMediaItem}
                        scrollEnabled={true}
                        removeClippedSubviews={false}
                        style={{ maxHeight: 350 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                          paddingBottom: mvs(90),
                          paddingTop: mvs(14),
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
                      {draft.media.map((item, index) => (
                        <View
                          key={`${item.uri}-${index}`}
                          className="w-20 h-32 rounded-lg overflow-hidden"
                        >
                          <Image
                            source={{ uri: item.cloud || item.uri }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Description input */}
                <View className="relative">
                  <ScaledTextInput
                    containerClassName="rounded-xl border border-gray "
                    className="text-foreground rounded-xl  bg-tat-foreground"
                    style={{
                      textAlignVertical: "top",
                      minHeight: mvs(150),
                      fontSize: s(12),
                      paddingLeft: s(35),
                    }}
                    multiline
                    numberOfLines={4}
                    placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                      
                    value={draft.description || ""}
                    onChangeText={(v) =>
                      setDraft((d) => ({ ...d, description: v }))
                    }
                  />

                  {/* Edit icon */}
                  <View className="absolute"
                  style={{
                    backgroundColor: "#100C0C",
                    borderRadius: s(70),
                    justifyContent: "center",
                    alignItems: "center",
                    position: "absolute",
                    left: s(12),
                    top: s(15),
                  }}
                  >
                    <SVGIcons.Pen1 width={s(16)} height={s(16)} />
                  </View>
                </View>
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
              {modalStep === "upload" ? (
                <>
                  <TouchableOpacity
                    onPress={() => setModalStep("upload")}
                    className="rounded-full border border-foreground items-center flex-row gap-3"
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
                      Prossima
                    </ScaledText>
                    <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setModalStep("upload")}
                    className="rounded-full border border-foreground items-center justify-center flex-row gap-3"
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
                      Back
                    </ScaledText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={saveDraftToProject}
                    className="rounded-full items-center justify-center flex-row gap-3 bg-primary"
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
                      Next
                    </ScaledText>
                    <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
