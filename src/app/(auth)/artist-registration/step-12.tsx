import { useFileUpload } from "@/hooks/useFileUpload";
import { cloudinaryService } from "@/services/cloudinary.service";
import { PortfolioProjectInput, useArtistRegistrationV2Store } from "@/stores/artistRegistrationV2Store";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

type DraftProject = {
  media: { uri: string; type: 'image' | 'video'; cloud?: string }[];
  description?: string;
};

export default function ArtistStep12V2() {
  const { step12, setProjectAtIndex, totalStepsDisplay, setCurrentStepDisplay } = useArtistRegistrationV2Store();
  const { pickFiles, uploadToCloudinary, uploading } = useFileUpload();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftProject>({ media: [] });

  useEffect(() => { setCurrentStepDisplay(12); }, []);

  const grid = useMemo(() => Array.from({ length: 4 }).map((_, i) => step12.projects?.[i]), [step12.projects]);

  const openProjectModal = (idx: number) => {
    setActiveIndex(idx);
    const existing = step12.projects?.[idx];
    if (existing) {
      const media = [
        ...(existing.photos || []).map((u) => ({ uri: u, type: 'image' as const, cloud: u })),
        ...(existing.videos || []).map((u) => ({ uri: u, type: 'video' as const, cloud: u })),
      ];
      setDraft({ media, description: existing.description });
    } else {
      setDraft({ media: [] });
    }
  };

  const handlePickMedia = async () => {
    const files = await pickFiles({ mediaType: 'all', allowsMultipleSelection: true, maxFiles: 5, cloudinaryOptions: cloudinaryService.getPortfolioUploadOptions('image') });
    if (files.length === 0) return;
    // show local immediately
    const locals = files.slice(0, 5).map((f) => ({
      uri: f.uri,
      type: f.type === 'video' ? 'video' : 'image',
    })) as { uri: string; type: 'image' | 'video'; cloud?: string }[];
    setDraft((d) => ({
      ...d,
      media: [...d.media, ...locals].slice(0, 5) as { uri: string; type: 'image' | 'video'; cloud?: string }[],
    }));
    // upload in background
    const uploaded = await uploadToCloudinary(files, cloudinaryService.getPortfolioUploadOptions('image'));
    setDraft((d) => ({
      ...d,
      media: d.media.map((m) => {
        const match = uploaded.find((u) => u.uri === m.uri);
        return match?.cloudinaryResult?.secureUrl ? { ...m, cloud: match.cloudinaryResult.secureUrl } : m;
      }),
    }));
  };

  const onDragEnd = ({ data }: { data: typeof draft.media }) => {
    setDraft((d) => ({ ...d, media: data }));
  };

  const renderMediaItem = ({ item, drag, isActive }: RenderItemParams<{ uri: string; type: 'image' | 'video'; cloud?: string }>) => (
    <Pressable
      onLongPress={drag}
      disabled={isActive}
      className={`flex-row items-center mb-3 p-3 rounded-xl ${isActive ? 'bg-primary/20' : 'bg-black/40'}`}
    >
      <View className="w-20 h-16 bg-gray/30 mr-3 overflow-hidden rounded-lg">
        <Image source={{ uri: item.cloud || item.uri }} className="w-full h-full" resizeMode="cover" />
      </View>
      <View className="flex-1">
        <Text className="text-foreground/80 text-sm">{item.type.toUpperCase()}</Text>
        <Text className="text-foreground/60 text-xs">Hold to reorder</Text>
      </View>
      <View className="w-6 h-6 items-center justify-center">
        <View className="w-4 h-4 border border-foreground/30 rounded" />
      </View>
    </Pressable>
  );

  const saveDraftToProject = () => {
    if (activeIndex === null) return;
    const photos = draft.media.filter((m) => (m.cloud || m.uri) && m.type === 'image').map((m) => m.cloud || m.uri);
    const videos = draft.media.filter((m) => (m.cloud || m.uri) && m.type === 'video').map((m) => m.cloud || m.uri);
    const proj: PortfolioProjectInput = { photos, videos, description: draft.description };
    setProjectAtIndex(activeIndex, proj);
    setActiveIndex(null);
  };

  const firstAsset = (p?: PortfolioProjectInput) => (p?.photos?.[0] || p?.videos?.[0]);
  const canProceed = (step12.projects || []).filter((p) => p && ((p.photos?.length || 0) + (p.videos?.length || 0)) > 0).length >= 4;

  const onNext = () => {
    if (!canProceed) return;
    router.push('/(auth)/artist-registration/step-13');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 10} className="flex-1 bg-black">
      <ScrollView className="flex-1" contentContainerClassName="flex-grow">
        {/* Header */}
        <View className="px-4 my-8">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.replace('/(auth)/welcome')} className="w-8 h-8 rounded-full bg-foreground/20 items-center justify-center">
              <Image source={require("@/assets/images/icons/close.png")} resizeMode="contain" />
            </TouchableOpacity>
            <Image source={require("@/assets/logo/logo-light.png")} className="h-10" resizeMode="contain" />
            <View className="w-10" />
          </View>
          <View className="h-px bg-[#A49A99] mt-4 opacity-50" />
        </View>

        {/* Progress */}
        <View className="items-center mb-6">
          <View className="flex-row items-center gap-1">
            {Array.from({ length: totalStepsDisplay }).map((_, idx) => (
              <View key={idx} className={`${idx < 12 ? (idx === 11 ? 'bg-foreground w-3 h-3' : 'bg-success w-2 h-2') : 'bg-gray w-2 h-2'} rounded-full`} />
            ))}
          </View>
        </View>

        {/* Title & helper */}
        <View className="px-6 mb-2 flex-row gap-2 items-center">
          <Image source={require("@/assets/images/icons/style.png")} className="w-6 h-6" resizeMode="contain" />
          <Text className="text-foreground section-title font-neueBold">Add your works</Text>
        </View>
        <View className="px-6 mb-4">
          <Text className="text-foreground/80">Add 4 projects. Each can include up to 5 media (max 2 videos).</Text>
        </View>

        {/* 2x2 grid */}
        <View className="px-6">
          <View className="flex-row gap-2 mb-2">
            {[0,1].map((i) => (
              <Pressable key={i} onPress={() => openProjectModal(i)} className="flex-1 h-40 bg-black/40 border border-gray rounded-xl items-center justify-center overflow-hidden">
                {firstAsset(grid[i]) ? (
                  <Image source={{ uri: firstAsset(grid[i])! }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-foreground/60">Add work</Text>
                )}
              </Pressable>
            ))}
          </View>
          <View className="flex-row gap-2">
            {[2,3].map((i) => (
              <Pressable key={i} onPress={() => openProjectModal(i)} className="flex-1 h-40 bg-black/40 border border-gray rounded-xl items-center justify-center overflow-hidden">
                {firstAsset(grid[i]) ? (
                  <Image source={{ uri: firstAsset(grid[i])! }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-foreground/60">Add work</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row justify-between px-6 mt-10 mb-10">
          <TouchableOpacity onPress={() => router.back()} className="rounded-full border border-foreground px-6 py-4">
            <Text className="text-foreground">Back</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={!canProceed} onPress={onNext} className={`rounded-full px-8 py-4 ${canProceed ? 'bg-primary' : 'bg-gray/40'}`}>
            <Text className="text-foreground">Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal flow */}
      <Modal visible={activeIndex !== null} transparent animationType="slide" onRequestClose={() => setActiveIndex(null)}>
        <View className="flex-1 justify-end">
          <View className="w-full bg-black rounded-t-3xl h-[100vh]">
            <View className="px-6 pb-6 pt-20 border-b border-gray flex-row items-center justify-between relative bg-primary/30">
              <TouchableOpacity onPress={() => setActiveIndex(null)} className="absolute left-6 top-20 w-8 h-8 rounded-full bg-foreground/20 items-center justify-center">
                <Image source={require("@/assets/images/icons/close.png")} resizeMode="contain" />
              </TouchableOpacity>
              <View className="flex-row items-center justify-center w-full">
                <Text className="text-foreground text-lg font-neueBold tat-body-1">Project</Text>
              </View>
            </View>

             {/* Step 1: media upload & re-order */}
             <ScrollView className="px-6 pt-6">
               {/* Upload area - matching step-6 design */}
               <View className="border-2 border-dashed border-error/70 rounded-2xl bg-black/40 items-center py-10 mb-6">
                 <Image
                   source={require("@/assets/images/icons/upload.png")}
                   className="w-16 h-16 mb-4"
                   resizeMode="contain"
                 />
                 <TouchableOpacity
                   onPress={handlePickMedia}
                   disabled={uploading}
                   className="bg-primary rounded-full py-3 px-6"
                 >
                   <Text className="text-foreground tat-body-1 font-neueBold">
                     {uploading ? "Uploading..." : "Upload files"}
                   </Text>
                 </TouchableOpacity>
                 <Text className="text-foreground/80 mt-6 text-center">
                   Fino a 5 foto, supporta JPG, PNG. Max size 5MB{"\n"}
                   Fino a 2 video, supporta MOV, MP4, AVI. Max size 10MB
                 </Text>
               </View>

               {/* Draggable media list */}
               {draft.media.length > 0 && (
                 <View className="mb-6">
                   <Text className="text-foreground mb-3 tat-body-2-med">Uploaded files (drag to reorder)</Text>
                   <DraggableFlatList
                     data={draft.media}
                     onDragEnd={onDragEnd}
                     keyExtractor={(item, index) => `${item.uri}-${index}`}
                     renderItem={renderMediaItem}
                     scrollEnabled={false}
                   />
                 </View>
               )}

              {/* Step 2: description */}
              <View className="mt-6">
                <Text className="text-foreground mb-2 tat-body-2-med">Descrizione</Text>
                <View className="rounded-2xl bg-black/40 border border-gray">
                  <TextInput
                    multiline
                    numberOfLines={4}
                    className="px-4 py-3 text-base text-foreground bg-[#100C0C] rounded-2xl min-h-[120px]"
                    placeholder="Tell us about this project..."
                    placeholderTextColor="#A49A99"
                    value={draft.description || ''}
                    onChangeText={(v) => setDraft((d) => ({ ...d, description: v }))}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal footer */}
            <View className="flex-row justify-between px-6 py-6">
              <TouchableOpacity onPress={() => setActiveIndex(null)} className="rounded-full border border-foreground px-6 py-3">
                <Text className="text-foreground">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveDraftToProject} className="rounded-full px-8 py-3 bg-primary">
                <Text className="text-foreground">Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}


