import AuthStepHeader from "@/components/ui/auth-step-header";
import NextBackFooter from "@/components/ui/NextBackFooter";
import RegistrationProgress from "@/components/ui/RegistrationProgress";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import {
  PortfolioProjectInput,
  useArtistRegistrationV2Store,
} from "@/stores/artistRegistrationV2Store";
import { getFileNameFromUri } from "@/utils/get-file-name";
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
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftProject>({ media: [] });
  const [modalStep, setModalStep] = useState<ModalStep>("upload");
  const insets = useSafeAreaInsets();

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
      <View className="mb-4" style={{ position: "relative" }}>
        <View
          className="bg-gray-foreground border border-gray rounded-xl flex-row items-center py-1"
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
            accessibilityLabel="Reorder"
          >
            <SVGIcons.Drag className="w-6 h-6" />
          </Pressable>
          {/* Thumb */}
          <View
            className="overflow-hidden rounded-lg h-fit aspect-square"
            style={{ width: 65, marginRight: 16 }}
          >
            {item.type === "image" ? (
              <Image
                source={{ uri: item.cloud || item.uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="items-center justify-center bg-tat-darkMaroon border border-gray rounded-lg"
                style={{ width: "100%", height: "100%" }}
              >
                <SVGIcons.Video width={30} height={30} />
              </View>
            )}
          </View>
          {/* Filename */}
          <View style={{ flex: 1 }}>
            <ScaledText
              allowScaling={false}
              variant="body2"
              className="text-foreground"
              style={{ fontWeight: "400" }}
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
            className="bg-foreground rounded-full border border-foreground p-2 items-center justify-center  elevation-2 w-8 h-8"
            accessibilityLabel="Remove"
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

  const onNext = () => {
    if (!canProceed) return;
    router.push("/(auth)/artist-registration/step-13");
  };

  return (
    <View className="flex-1 bg-black pb-40 relative">
      {/* Header */}
      <AuthStepHeader />

      {/* Progress */}
      <RegistrationProgress
        currentStep={12}
        totalSteps={totalStepsDisplay}
        name="Add your works"
        description="Add 4 projects. Each can include up to 5 media (max 2 videos)."
        icon={<SVGIcons.Work width={19} height={19} />}
      />

      {/* 2x2 grid */}
      <View className="px-6">
        <View
          className="flex-row mb-2"
          style={{ marginBottom: mvs(13), gap: mvs(15) }}
        >
          {[0, 1].map((i) => (
            <Pressable
              key={i}
              onPress={() => openProjectModal(i)}
              className="flex-1 h-full aspect-square bg-primary/20 border-2 border-dashed border-error/70 rounded-xl items-center justify-center overflow-hidden"
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
                    Work {i + 1}
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
              className="flex-1 h-full aspect-square bg-primary/20 border-2 border-dashed border-error/70 rounded-xl items-center justify-center overflow-hidden"
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
                    variant="body2"
                    className="text-gray"
                  >
                    Work {i + 1}
                  </ScaledText>
                </View>
              ) : (
                <View className="items-center justify-center gap-2">
                  <SVGIcons.AddRed className="w-6 h-6" />
                  <ScaledText
                    allowScaling={false}
                    variant="body2"
                    className="text-gray"
                  >
                    Work {i + 1}
                  </ScaledText>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Footer */}
      <NextBackFooter
        onNext={onNext}
        nextDisabled={!canProceed}
        backLabel="Back"
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
              className="border-b border-gray flex-row items-center justify-between relative bg-primary/30"
              style={{
                paddingBottom: mvs(20),
                paddingTop: mvs(70),
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
                  variant="xl"
                  className="text-foreground font-neueBold"
                >
                  Add Design
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
                    <View className="mb-6">
                      <ScaledText
                        allowScaling={false}
                        variant="lg"
                        className="text-foreground font-neueBold"
                      >
                        Carica foto e video
                      </ScaledText>
                      <ScaledText
                        allowScaling={false}
                        variant="11"
                        className="text-foreground/80"
                      >
                        You need to select atleast{" "}
                        <ScaledText
                          allowScaling={false}
                          variant="11"
                          className="text-error"
                        >
                          one photo
                        </ScaledText>{" "}
                        and 3 photos/videos
                      </ScaledText>
                    </View>
                    {/* Upload area - matching step-6 design */}
                    <View className="border-2 border-dashed border-error/70 rounded-2xl bg-primary/20 items-center py-10 mb-6">
                      <SVGIcons.Upload width={s(42)} height={s(42)} />
                      <TouchableOpacity
                        onPress={handlePickMedia}
                        disabled={uploading}
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
                          {uploading ? "Uploading..." : "Upload files"}
                        </ScaledText>
                      </TouchableOpacity>
                      <ScaledText
                        allowScaling={false}
                        variant="11"
                        className="text-foreground/80 text-center"
                        style={{ marginTop: mvs(12), paddingHorizontal: s(16) }}
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
                        className="text-foreground font-neueBold"
                      >
                        Carica foto e video
                      </ScaledText>
                      <ScaledText
                        allowScaling={false}
                        variant="11"
                        className="text-foreground/80"
                      >
                        You need to select atleast{" "}
                        <ScaledText
                          allowScaling={false}
                          variant="11"
                          className="text-error"
                        >
                          one photo
                        </ScaledText>{" "}
                        and 3 photos/videos
                      </ScaledText>
                    </View>

                    {/* Upload area */}
                    <View className="border-2 border-dashed border-error/70 rounded-2xl bg-primary/20 items-center py-10 mb-6">
                      <SVGIcons.Upload width={s(42)} height={s(42)} />
                      <TouchableOpacity
                        onPress={handlePickMedia}
                        disabled={uploading}
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
                          {uploading ? "Uploading..." : "Upload files"}
                        </ScaledText>
                      </TouchableOpacity>
                      <ScaledText
                        allowScaling={false}
                        variant="11"
                        className="text-foreground/80 text-center"
                        style={{ marginTop: mvs(12), paddingHorizontal: s(16) }}
                      >
                        Fino a 5 foto, supporta JPG, PNG. Max size 5MB{"\n"}
                        Fino a 2 video, supporta MOV, MP4, AVI. Max size 10MB
                      </ScaledText>
                    </View>

                    <ScaledText
                      allowScaling={false}
                      variant="body2"
                      className="text-foreground mb-3"
                    >
                      Uploaded files
                    </ScaledText>

                    <View style={{ maxHeight: 350 }}>
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
                          paddingBottom: 90,
                          paddingTop: 14,
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
                  className="text-foreground/80 mb-6"
                >
                  Describe your post in a few words.
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
                <View className="">
                  <ScaledTextInput
                    containerClassName="rounded-xl border border-gray "
                    className="text-foreground rounded-xl pl-6"
                    multiline
                    numberOfLines={4}
                    placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus blandit augue et rhoncus consectetur. In ut metus lacinia, rutrum purus ac, malesuada magna. Ut euismod erat."
                    placeholderTextColor="#A49A99"
                    value={draft.description || ""}
                    onChangeText={(v) =>
                      setDraft((d) => ({ ...d, description: v }))
                    }
                    style={{ textAlignVertical: "top", minHeight: 120 }}
                  />
                </View>
              </ScrollView>
            )}

            {/* Modal footer */}
            <View
              className="flex-row justify-between"
              style={{
                paddingHorizontal: s(20),
                paddingTop: mvs(16),
                paddingBottom: Math.max(insets.bottom, mvs(20)),
              }}
            >
              {modalStep === "upload" ? (
                <>
                  <TouchableOpacity
                    onPress={() => setActiveIndex(null)}
                    className="rounded-full border border-foreground"
                    style={{
                      paddingVertical: mvs(12),
                      paddingHorizontal: s(18),
                    }}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="md"
                      className="text-foreground"
                    >
                      Back
                    </ScaledText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setModalStep("description")}
                    disabled={draft.media.length === 0}
                    className={`rounded-full px-8 py-3 ${
                      draft.media.length > 0 ? "bg-primary" : "bg-gray/40"
                    }`}
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="body1"
                      className="text-foreground"
                    >
                      Next
                    </ScaledText>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setModalStep("upload")}
                    className="rounded-full border border-foreground px-6 py-3"
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="body1"
                      className="text-foreground"
                    >
                      Back
                    </ScaledText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={saveDraftToProject}
                    className="rounded-full px-8 py-3 bg-primary"
                  >
                    <ScaledText
                      allowScaling={false}
                      variant="body1"
                      className="text-foreground"
                    >
                      Next
                    </ScaledText>
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
