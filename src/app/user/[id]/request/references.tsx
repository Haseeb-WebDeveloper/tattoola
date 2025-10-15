import RequestHeader from "@/components/ui/RequestHeader";
import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { usePrivateRequestStore } from "@/stores/privateRequestStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";

export default function ReferencesStep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();
  const media = usePrivateRequestStore((s) => s.answers.referenceMedia);
  const setReferences = usePrivateRequestStore((s) => s.setReferences);

  const canProceed = useMemo(() => media.length > 0, [media]);

  const handlePick = async () => {
    const files = await pickFiles({ mediaType: "image", allowsMultipleSelection: true, maxFiles: 5, cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions("image") });
    if (!files || files.length === 0) return;

    const locals = files.slice(0, 5).map((f) => ({ id: f.uri, uri: f.uri, type: (f.type === "video" ? "video" : "image") as const }));
    setReferences([...
      media,
      ...locals
    ] as any);

    const uploaded = await uploadToCloudinary(files, cloudinaryService.getPortfolioUploadOptions("image"));
    setReferences(
      usePrivateRequestStore.getState().answers.referenceMedia.map((m) => {
        const match = uploaded.find((u) => u.uri === m.uri);
        return match?.cloudinaryResult?.secureUrl ? { ...m, cloud: match.cloudinaryResult.secureUrl } : m;
      })
    );
  };

  const onDragEnd = ({ data }: { data: typeof media }) => setReferences(data as any);

  const renderItem = ({ item, drag, isActive }: RenderItemParams<(typeof media)[number]>) => (
    <View className="mb-4" style={{ position: "relative" }}>
      <View className="bg-gray-foreground border border-gray rounded-xl flex-row items-center py-2" style={{ paddingLeft: 12, minHeight: 70, paddingRight: 12 }}>
        <TouchableOpacity onLongPress={drag} disabled={isActive} className="w-10 h-10 items-center justify-center mr-3">
          <Text className="text-foreground">≡</Text>
        </TouchableOpacity>
        <View className="overflow-hidden rounded-lg" style={{ width: 65, height: 65, marginRight: 16 }}>
          <Image source={{ uri: item.cloud || item.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-foreground" numberOfLines={1}>{item.uri.split("/").pop()}</Text>
        </View>
        <TouchableOpacity onPress={() => setReferences(media.filter((m) => m.id !== item.id))} className="ml-auto">
          <Text className="text-error">Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <RequestHeader title="Inviare una richiesta privata a" stepIndex={1} totalSteps={5} />

      <View className="px-4">
        <Text className="text-foreground tat-body-1 text-center mt-2 mb-6">Can you post some examples of tattoos that resemble the result you'd like?</Text>
        <View className="border-2 border-dashed border-error/70 rounded-2xl bg-primary/20 items-center py-10 mb-6">
          <TouchableOpacity onPress={handlePick} disabled={uploading} className="bg-primary rounded-full py-3 px-6 mt-2">
            <Text className="text-foreground tat-body-1 font-neueBold">{uploading ? "Uploading..." : "Upload files"}</Text>
          </TouchableOpacity>
          <Text className="text-foreground/80 mt-6 text-center px-4">Fino a 5 foto, supporta JPG, PNG. Max size 5MB</Text>
        </View>

        {media.length > 0 && (
          <View style={{ maxHeight: 350 }}>
            <DraggableFlatList
              data={media as any}
              keyExtractor={(item) => item.id}
              renderItem={renderItem as any}
              onDragEnd={onDragEnd as any}
              scrollEnabled={true}
              removeClippedSubviews={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 90, paddingTop: 14 }}
            />
          </View>
        )}
      </View>

      <View className="flex-row justify-between px-4 py-4 mt-auto">
        <TouchableOpacity onPress={() => router.back()} className="rounded-full border px-6 py-3">
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!canProceed}
          onPress={() => router.push("/user/" + id + "/request/color" as any)}
          className={`rounded-full px-8 py-3 ${canProceed ? "bg-primary" : "bg-gray/40"}`}
        >
          <Text className="text-white">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


