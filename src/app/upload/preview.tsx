import { CustomToast } from "@/components/ui/CustomToast";
import NextBackFooter from "@/components/ui/NextBackFooter";
import { ScaledText } from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { createPostWithMediaAndCollection } from "@/services/post.service";
import { fetchTattooStyles, TattooStyleItem } from "@/services/style.service";
import { usePostUploadStore } from "@/stores/postUploadStore";
import { clearProfileCache } from "@/utils/database";
import { mvs, s } from "@/utils/scale";
import { TrimText } from "@/utils/text-trim";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { toast } from "sonner-native";

export default function UploadPreviewStep() {
  const {
    media,
    caption,
    styleIds,
    collectionId,
    redirectToCollectionId,
    reset,
    setSubmitting,
  } = usePostUploadStore();
  const { user } = useAuth();
  const mainMedia = media[0];
  const mainImage = mainMedia?.cloud || mainMedia?.uri;
  const isVideo = mainMedia?.type === "video";
  const { width: windowWidth } = useWindowDimensions();
  const [allStyles, setAllStyles] = useState<TattooStyleItem[]>([]);

  // Fetch all styles to get names for selected styleIds
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchTattooStyles();
        if (mounted) setAllStyles(data);
      } catch (error) {
        console.error("Failed to fetch styles:", error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Get selected styles based on styleIds
  const selectedStyles = useMemo(() => {
    if (!styleIds || styleIds.length === 0 || allStyles.length === 0) return [];
    return allStyles.filter((style) => styleIds.includes(style.id));
  }, [styleIds, allStyles]);

  // Video player for autoplay - prefer local URI for preview (faster), fallback to cloud URL
  // Always call hook at top level with a URL (empty string if not video)
  // Create two separate players - one for each preview card
  const videoUrl = isVideo ? mainMedia?.uri || mainMedia?.cloud || "" : "";
  const videoPlayer1 = useVideoPlayer(videoUrl || "", (player) => {
    if (isVideo && videoUrl) {
      player.loop = true;
      player.muted = true;
      // Small delay for iOS to ensure player is ready
      setTimeout(() => {
        player.play();
      }, 100);
    }
  });
  const videoPlayer2 = useVideoPlayer(videoUrl || "", (player) => {
    if (isVideo && videoUrl) {
      player.loop = true;
      player.muted = true;
      // Small delay for iOS to ensure player is ready
      setTimeout(() => {
        player.play();
      }, 100);
    }
  });

  // Update player sources when URL changes
  useEffect(() => {
    const updatePlayers = async () => {
      if (isVideo && videoUrl) {
        if (videoPlayer1) {
          try {
            await videoPlayer1.replaceAsync(videoUrl);
            videoPlayer1.loop = true;
            videoPlayer1.muted = true;
            // Small delay for iOS to ensure player is ready
            setTimeout(() => {
              videoPlayer1.play();
            }, 100);
          } catch (error) {
            console.error("Error loading video player 1:", error);
          }
        }
        if (videoPlayer2) {
          try {
            await videoPlayer2.replaceAsync(videoUrl);
            videoPlayer2.loop = true;
            videoPlayer2.muted = true;
            // Small delay for iOS to ensure player is ready
            setTimeout(() => {
              videoPlayer2.play();
            }, 100);
          } catch (error) {
            console.error("Error loading video player 2:", error);
          }
        }
      }
    };
    updatePlayers();
  }, [videoUrl, isVideo, videoPlayer1, videoPlayer2]);

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      const { postId } = await createPostWithMediaAndCollection({
        caption,
        styleId: styleIds && styleIds.length > 0 ? styleIds : undefined, // Pass styleId array (1-3 styles)
        media: media.map((m, index) => ({
          mediaUrl: m.cloud || m.uri,
          mediaType: m.type === "video" ? "VIDEO" : "IMAGE",
          order: index,
        })),
        collectionId,
      });

      // Clear profile cache to refresh collections on profile screen
      if (user?.id) {
        await clearProfileCache(user.id);
      }

      // Show success toast
      const toastId = toast.custom(
        <CustomToast
          message="Post pubblicato con successo!"
          iconType="success"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 3000 }
      );

      // Redirect to collection page if we came from there
      // const redirectId = redirectToCollectionId || collectionId;
      reset();

      router.replace(`/post/${postId}`);

      // if (redirectId) {
      //   router.replace(`/collection/${redirectId}` as any);
      // } else {
      //   router.replace(`/post/${postId}`);
      // }
    } catch (e) {
      console.error("onSubmit failed", e);
      // Show error toast on failure
      const toastId = toast.custom(
        <CustomToast
          message={
            e instanceof Error
              ? e.message
              : "Errore durante la pubblicazione del post"
          }
          iconType="error"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 4000 }
      );
      setSubmitting(false);
    }
  };

  const DisplayName =
    user?.firstName || user?.lastName
      ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      : user?.username || "Utente";

  const PreviewCard = ({
    player,
  }: {
    player: ReturnType<typeof useVideoPlayer>;
  }) => (
    <View
      className="flex-1 aspect-[393/852] rounded-2xl overflow-hidden relative bg-black/40"
      style={{
        borderWidth: s(1),
        borderColor: "#A49A99",
      }}
    >
      {mainImage ? (
        isVideo ? (
          <VideoView
            player={player}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
            contentFit="cover"
            nativeControls={false}
          />
        ) : (
          <Image
            source={{ uri: mainImage }}
            className="absolute top-0 left-0 w-full h-full"
            resizeMode="cover"
          />
        )
      ) : (
        <View className="absolute top-0 left-0 w-full h-full bg-black/20" />
      )}
      <SVGIcons.PostPreview
        width="100%"
        height="100%"
        className="bg-red-500 border-2 border-blue-500"
      />

      {/* Top gradient overlay for better readability (like in DetailPreviewCard) */}
      <LinearGradient
        colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0)"]}
        locations={[0, 0.5, 1]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "12%",
          zIndex: 1,
        }}
        pointerEvents="none"
      />

      <View
        className="absolute w-fit"
        style={{
          top: s(10),
          left: "50%",
          transform: [{ translateX: "-50%" }],
        }}
      >
        <SVGIcons.LogoLight width={s(32)} height={s(32)} />
      </View>
      {/* Caption and user info near bottom like mockup */}
      <View className="absolute left-2 bottom-[60px]">
        {!!caption && (
          <ScaledText
            allowScaling={false}
            variant="xs"
            className="text-foreground font-neueBold"
            numberOfLines={1}
          >
            {TrimText(caption, 30)}
          </ScaledText>
        )}
        <View className="flex-row items-center mt-1" style={{ gap: s(4) }}>
          {user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              className="rounded-full"
              style={{
                width: s(16),
                height: s(16),
              }}
            />
          ) : (
            <View
              className="rounded-full bg-background/80 border-[0.51px] border-error"
              style={{ width: s(16), height: s(16) }}
            />
          )}
          <ScaledText
            allowScaling={false}
            variant="9"
            className="text-foreground font-montserratMedium"
            numberOfLines={1}
          >
            {TrimText(DisplayName, 15)}
          </ScaledText>
        </View>
      </View>
    </View>
  );

  const DetailPreviewCard = ({
    player,
  }: {
    player: ReturnType<typeof useVideoPlayer>;
  }) => {
    return (
      <View
        className="flex-1 aspect-[393/852] rounded-2xl overflow-hidden relative bg-black/40"
        style={{
          borderWidth: s(1),
          borderColor: "#A49A99",
        }}
      >
        <View
          className="absolute top-0 left-0 w-full"
          style={{
            borderBottomLeftRadius: s(16),
            borderBottomRightRadius: s(16),
            overflow: "hidden",
            height: "80%",
          }}
        >
          {mainImage ? (
            isVideo ? (
              <VideoView
                player={player}
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
                contentFit="cover"
                nativeControls={false}
              />
            ) : (
              <Image
                source={{ uri: mainImage }}
                className="absolute top-0 left-0 w-full h-full"
                resizeMode="cover"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            )
          ) : (
            <View
              className="absolute top-0 left-0 w-full h-full bg-black/20"
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          )}
        </View>
        <SVGIcons.DetailPreview
          width="100%"
          height="100%"
          className="bg-red-500 border-2 border-blue-500"
        />

        {/* Bottom gradient overlay for better text readability */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          locations={[0, 1]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "40%",
            zIndex: 1,
          }}
          pointerEvents="none"
        />

        {/* Content section - matching post detail layout */}
        <View
          className="absolute left-0 right-0"
          style={{
            bottom: s(-6),
            paddingHorizontal: s(12),
            paddingBottom: s(12),
            paddingTop: s(28),
            zIndex: 2,
          }}
        >
          {/* Caption and like button section */}
          <View
            className="flex-row items-start justify-between"
            style={{ marginBottom: s(8) }}
          >
            <View className="flex-1 mr-2">
              {!!caption && (
                <ScaledText
                  allowScaling={false}
                  variant="xs"
                  className="text-foreground font-neueMedium"
                  numberOfLines={1}
                >
                  {TrimText(caption, 50)}
                </ScaledText>
              )}

              {/* Style tags */}
              {selectedStyles.length > 0 && (
                <View className="flex-row flex-wrap gap-1">
                  {selectedStyles.slice(0, 1).map((style) => (
                    <View
                      key={style.id}
                      className="inline-flex self-start  rounded-full border-gray max-w-fit"
                      style={{
                        paddingHorizontal: s(2),
                        paddingVertical: s(1),
                        borderRadius: s(12),
                        borderWidth: s(0.5),
                      }}
                    >
                      <ScaledText
                        allowScaling={false}
                        variant="6"
                        className="text-gray font-neueLight"
                      >
                        {style.name}
                      </ScaledText>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Like button placeholder */}
            <View style={{ marginTop: s(2) }}>
              <SVGIcons.LikeFilled width={s(12)} height={s(12)} />
            </View>
          </View>

          {/* Author info section */}
          {user && (
            <View className="flex-row items-center justify-between">
              <View
                className="flex-row items-center flex-1"
                style={{ gap: s(4) }}
              >
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    className="rounded-full"
                    style={{
                      width: s(20),
                      height: s(20),
                    }}
                  />
                ) : (
                  <View
                    className="rounded-full bg-background/80 border border-gray"
                    style={{
                      width: s(20),
                      height: s(20),
                    }}
                  />
                )}
                <View className="flex-1">
                  <ScaledText
                    allowScaling={false}
                    variant="6"
                    className="text-foreground font-neueMedium"
                    numberOfLines={1}
                  >
                    {TrimText(DisplayName, 14)}
                  </ScaledText>
                  {user?.username && (
                    <ScaledText
                      allowScaling={false}
                      variant="6"
                      className="text-gray font-neueLight"
                      numberOfLines={1}
                    >
                      {`@${TrimText(user.username, 15)}`}
                    </ScaledText>
                  )}
                </View>
              </View>

              {/* Follow button - scaled down for preview */}
              <View
                className="rounded-full flex-row items-center"
                style={{
                  borderColor: "#A49A99",
                  paddingHorizontal: s(6),
                  paddingVertical: s(3),
                  gap: s(2),
                  borderWidth: s(0.5),
                }}
              >
                <SVGIcons.Follow width={s(6)} height={s(6)} />
                <ScaledText
                  allowScaling={false}
                  variant="5"
                  className="text-foreground font-montserratSemibold"
                >
                  Segui
                </ScaledText>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Calculate half of container minus gap (gap is e.g. 16px)
  const containerPadding = 24; // px-6 == 24px
  const betweenGap = 16; // gap-4 == 16px
  const cardWidth = (windowWidth - containerPadding * 2 - betweenGap) / 2;

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false}>
        <View
          className="flex-row items-center justify-center"
          style={{
            marginBottom: mvs(16),
            gap: s(8),
          }}
        >
          <SVGIcons.Eye width={s(20)} height={s(20)} />
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-foreground font-neueBold"
          >
            Anteprima
          </ScaledText>
        </View>
        <View className="flex flex-row" style={{ gap: betweenGap }}>
          <View style={{ width: cardWidth }}>
            <ScaledText
              allowScaling={false}
              variant="11"
              className="text-center text-foreground/80 font-neueBold"
              style={{ marginBottom: mvs(6) }}
            >
              Vista feed
            </ScaledText>
            <PreviewCard player={videoPlayer1} />
          </View>
          <View style={{ width: cardWidth }}>
            <ScaledText
              allowScaling={false}
              variant="11"
              className="text-center text-foreground/80 font-neueBold"
              style={{ marginBottom: mvs(6) }}
            >
              Vista dettagliata
            </ScaledText>
            <DetailPreviewCard player={videoPlayer2} />
          </View>
        </View>
      </ScrollView>
      <NextBackFooter
        onBack={() => router.back()}
        onNext={onSubmit}
        nextDisabled={
          !media.length ||
          !caption ||
          !styleIds ||
          styleIds.length === 0 ||
          (user?.role === "ARTIST" && !collectionId)
        }
        nextLabel="Pubblica"
        backLabel="Indietro"
      />
    </View>
  );
}
