import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { createPostWithMediaAndCollection } from "@/services/post.service";
import { usePostUploadStore } from "@/stores/postUploadStore";
import { clearProfileCache } from "@/utils/database";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import NextBackFooter from "@/components/ui/NextBackFooter";
export default function UploadPreviewStep() {
  const { media, caption, styleId, collectionId, reset, setSubmitting } =
    usePostUploadStore();
  const { user } = useAuth();
  const mainImage = media[0]?.cloud || media[0]?.uri;
  const { width: windowWidth } = useWindowDimensions();

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      const { postId } = await createPostWithMediaAndCollection({
        caption,
        styleId,
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
      
      reset();
      router.replace(`/post/${postId}`);
    } catch (e) {
      console.error("onSubmit failed", e);
      setSubmitting(false);
    }
  };

  const DisplayName =
    user?.firstName || user?.lastName
      ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      : user?.username || "User";

  const PreviewCard = () => (
    <View className="flex-1 aspect-[393/852] rounded-2xl overflow-hidden relative bg-black/40">
      {mainImage ? (
        <Image
          source={{ uri: mainImage }}
          className="absolute left-0 top-0 w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <View className="absolute left-0 top-0 w-full h-full bg-black/20" />
      )}
      <SVGIcons.PostPreview
        width="100%"
        height="100%"
        className="bg-red-500 border-2 border-blue-500"
      />
      {/* Caption and user info near bottom like mockup */}
      <View className="absolute left-2 bottom-[60px]">
        {!!caption && (
          <Text
            className="text-foreground text-[10px] font-neueBold"
            numberOfLines={1}
          >
            {caption}
          </Text>
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
          <Text className="text-foreground/90 text-[10px]" numberOfLines={1}>
            {DisplayName}
          </Text>
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
        <View className="items-center mb-4">
          <Text className="text-foreground section-title">Preview</Text>
        </View>
        <View className="flex flex-row" style={{ gap: betweenGap }}>
          <View style={{ width: cardWidth }}>
            <Text className="text-foreground/80 mb-2">Feed view</Text>
            <PreviewCard />
          </View>
          <View style={{ width: cardWidth }}>
            <Text className="text-foreground/80 mb-2">Detailed view</Text>
            <PreviewCard />
          </View>
        </View>
      </ScrollView>
      <NextBackFooter
        onBack={() => router.back()}
        onNext={onSubmit}
        nextDisabled={!media.length || !caption || !styleId || !collectionId}
        nextLabel="Publish"
        backLabel="Back"
      />

    </View>
  );
}
