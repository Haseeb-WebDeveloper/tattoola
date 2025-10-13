import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function UploadScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-primary">
      <Text className="text-xl font-bold text-primary-foreground mb-4">Upload</Text>
      <TouchableOpacity
        onPress={() => router.push('/upload/media')}
        className="bg-black/30 border border-foreground rounded-full px-6 py-3"
      >
        <Text className="text-foreground">Start Upload</Text>
      </TouchableOpacity>
    </View>
  );
}
