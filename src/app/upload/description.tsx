import { usePostUploadStore } from '@/stores/postUploadStore';
import { router } from 'expo-router';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function UploadDescriptionStep() {
  const caption = usePostUploadStore((s) => s.caption);
  const setCaption = usePostUploadStore((s) => s.setCaption);

  return (
    <View className="flex-1 bg-black">
      <ScrollView className="px-6 pt-6">
        <Text className="text-foreground section-title mb-4">Description</Text>
        <View className="rounded-2xl bg-black/40 border border-gray">
          <TextInput
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            className="px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-2xl min-h-[160px]"
            placeholder="Write something about your post..."
            placeholderTextColor="#A49A99"
            value={caption || ''}
            onChangeText={(v) => setCaption(v)}
          />
        </View>
      </ScrollView>

      <View className="flex-row justify-between px-6 py-4 bg-background">
        <TouchableOpacity onPress={() => router.back()} className="rounded-full border border-foreground px-6 py-4">
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/upload/style')} className="rounded-full px-8 py-4 bg-primary">
          <Text className="text-foreground">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


