import NextBackFooter from "@/components/ui/NextBackFooter";
import { SVGIcons } from "@/constants/svg";
import { usePostUploadStore } from "@/stores/postUploadStore";
import { s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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
        <Text className="tat-body-4 text-gray mb-6 font-neueMedium">
          Descrivi il tuo post in poche parole
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
        <View className="rounded-2xl border border-gray relative">
          <View
            className="absolute items-center justify-center z-10"
            style={{
              top: s(12),
              left: s(16),
            }}
          >
            <SVGIcons.Pen1 width={s(20)} height={s(20)} />
          </View>
          <TextInput
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            className="text-foreground bg-tat-darkMaroon rounded-2xl min-h-[180px] font-neueMedium"
            style={{
              fontSize: s(12),
              paddingHorizontal: s(42),
              paddingVertical: s(12),
            }}
            placeholder="Scrivi una descrizione per il tuo post..."
            value={caption || ""}
            onChangeText={(v) => setCaption(v)}
          />
        </View>
      </ScrollView>

      <NextBackFooter
        onBack={() => router.back()}
        onNext={() => router.push("/upload/style")}
        nextDisabled={!caption}
        nextLabel="Avanti"
        backLabel="Indietro"
      />
    </View>
  );
}
