import { createPostWithMediaAndCollection } from '@/services/post.service';
import { usePostUploadStore } from '@/stores/postUploadStore';
import { router } from 'expo-router';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function UploadPreviewStep() {
  const { media, caption, styleId, collectionId, reset, setSubmitting } = usePostUploadStore();

  const onSubmit = async () => {
    console.log('onSubmit tiggerd');
    try {
      setSubmitting(true);
      console.log('onSubmit', { caption, styleId, mediaCount: media.length, collectionId });
      const { postId } = await createPostWithMediaAndCollection({
        caption,
        styleId,
        media: media.map((m, index) => ({
          mediaUrl: m.cloud || m.uri,
          mediaType: m.type === 'video' ? 'VIDEO' : 'IMAGE',
          order: index,
        })),
        collectionId,
      });
      reset();
      router.replace(`/post/${postId}`);
    } catch (e) {
      console.error('onSubmit failed', e);
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <ScrollView className="px-6 pt-6">
        <Text className="text-foreground section-title mb-4">Preview</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {media.map((m, i) => (
            <View key={`${m.uri}-${i}`} className="w-24 h-24 rounded-lg overflow-hidden bg-black/30">
              <Image source={{ uri: m.cloud || m.uri }} className="w-full h-full" resizeMode="cover" />
            </View>
          ))}
        </View>
        {caption ? (
          <View className="mb-6"><Text className="text-foreground/90">{caption}</Text></View>
        ) : null}
        {styleId ? (
          <View className="mb-6"><Text className="text-foreground/70">Style selected</Text></View>
        ) : null}
        {collectionId ? (
          <View className="mb-6"><Text className="text-foreground/70">Collection selected</Text></View>
        ) : null}
      </ScrollView>

      <View className="flex-row justify-between px-6 py-4 bg-background">
        <TouchableOpacity onPress={() => router.back()} className="rounded-full border border-foreground px-6 py-4">
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSubmit} className="rounded-full px-8 py-4 bg-primary">
          <Text className="text-foreground">Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


