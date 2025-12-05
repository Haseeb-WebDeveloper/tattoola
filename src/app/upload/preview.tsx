import { CustomToast } from "@/components/ui/CustomToast";
import NextBackFooter from "@/components/ui/NextBackFooter";
import { ScaledText } from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { createPostWithMediaAndCollection } from "@/services/post.service";
import { usePostUploadStore } from "@/stores/postUploadStore";
import { clearProfileCache } from "@/utils/database";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
  const mainImage = media[0]?.cloud || media[0]?.uri;
  const { width: windowWidth } = useWindowDimensions();

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      const { postId } = await createPostWithMediaAndCollection({
        caption,
        styleId: styleIds?.[0], // Use first styleId for backward compatibility
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

  const PreviewCard = () => (
    <View className="flex-1 aspect-[393/852] rounded-2xl overflow-hidden relative bg-black/40">
      {mainImage ? (
        <Image
          source={{ uri: mainImage }}
          className="absolute top-0 left-0 w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <View className="absolute top-0 left-0 w-full h-full bg-black/20" />
      )}
      <SVGIcons.PostPreview
        width="100%"
        height="100%"
        className="bg-red-500 border-2 border-blue-500"
      />
      {/* Caption and user info near bottom like mockup */}
      <View className="absolute left-2 bottom-[60px]">
        {!!caption && (
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-foreground font-neueBold"
            numberOfLines={1}
          >
            {caption}
          </ScaledText>
        )}
        <View className="flex-row items-center gap-2 mt-1">
          {user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <View className="w-4 h-4 rounded-full bg-background/80 border-[0.51px] border-error" />
          )}
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-foreground/90 font-neueBold"
            numberOfLines={1}
          >
            {DisplayName}
          </ScaledText>
        </View>
      </View>
    </View>
  );

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
            <PreviewCard />
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
            <PreviewCard />
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
