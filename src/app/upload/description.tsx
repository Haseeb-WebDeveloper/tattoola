import { SVGIcons } from "@/constants/svg";
import { usePostUploadStore } from "@/stores/postUploadStore";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import NextBackFooter from "@/components/ui/NextBackFooter";
import { s } from "@/utils/scale";

export default function UploadDescriptionStep() {
  const caption = usePostUploadStore((s) => s.caption);
  const setCaption = usePostUploadStore((s) => s.setCaption);
  const media = usePostUploadStore((s) => s.media);

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
      <ScrollView className="px-6 pt-6">
        {/* Title + helper */}
        <Text className="text-foreground tat-body-1 font-neueBold mb-0.5">
          Descrizione
        </Text>
        <Text className="tat-body-4 text-gray mb-6">
          Describe your post in a few words
        </Text>

        {/* Media previews (9/16 aspect, horizontal scroll) */}
        {media.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ gap: 12 }}
          >
            {media.map((m, idx) => (
              <View
                key={`${m.uri}-${idx}`}
                className="rounded-xl overflow-hidden bg-black/40 w-24 aspect-[9/16]"
              >
                <Image
                  source={{ uri: m.cloud || m.uri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
        )}

        {/* Description input with edit icon */}
        <View className="rounded-2xl bg-black/40 border border-gray relative">
          <View className="absolute left-2 top-3 w-6 h-6  items-center justify-center z-10">
            <SVGIcons.Pen1 className="w-5 h-5 " />
          </View>
          <TextInput
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            className="text-foreground bg-tat-darkMaroon rounded-2xl min-h-[180px]"
            style={{ fontSize: s(12) }}
            placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit....."
            placeholderTextColor="#A49A99"
            value={caption || ""}
            onChangeText={(v) => setCaption(v)}
          />
        </View>
      </ScrollView>

      <NextBackFooter
        onBack={() => router.back()}
        onNext={() => router.push("/upload/style")}
        nextDisabled={!caption}
        nextLabel="Next"
        backLabel="Back"
      />
    </View>
  );
}
