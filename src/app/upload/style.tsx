import { SVGIcons } from '@/constants/svg';
import { fetchTattooStyles, TattooStyleItem } from '@/services/style.service';
import { usePostUploadStore } from '@/stores/postUploadStore';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text, TouchableOpacity, View } from 'react-native';

export default function UploadStyleStep() {
  const styleId = usePostUploadStore((s) => s.styleId);
  const setStyleId = usePostUploadStore((s) => s.setStyleId);
  const [styles, setStyles] = useState<TattooStyleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchTattooStyles();
        if (mounted) setStyles(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const renderItem = ({ item }: { item: TattooStyleItem }) => {
    const isSelected = styleId === item.id;
    return (
      <View className="flex-row items-center px-4 border-b border-gray/20">
        <Pressable className="w-10 items-center" onPress={() => setStyleId(item.id)}>
          <View className={`w-5 h-5 rounded-[4px] border ${isSelected ? 'bg-error border-error' : 'bg-transparent border-foreground/50'}`} />
        </Pressable>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="w-36 h-28" resizeMode="cover" />
        ) : (
          <View className="w-36 h-28 bg-gray/30" />
        )}
        <View className="flex-1 px-4">
          <Text className="text-foreground tat-body-1 font-neueBold">{item.name}</Text>
        </View>
        <View className="pr-4">
          {isSelected ? (
            <SVGIcons.StartCircleFilled className="w-5 h-5" />
          ) : (
            <SVGIcons.StartCircle className="w-5 h-5" />
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <View className="px-6 mb-4 mt-6 flex-row gap-2 items-center justify-center">
        <SVGIcons.Style width={22} height={22} />
        <Text className="text-foreground section-title font-neueBold">Select a style</Text>
      </View>

      <View className="flex-1 mb-24">
        {loading ? (
          <View />
        ) : (
          <FlatList
            data={styles}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={true}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        )}
      </View>

      <View className="flex-row justify-between px-6 py-4 bg-background">
        <TouchableOpacity onPress={() => router.back()} className="rounded-full border border-foreground px-6 py-4">
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={!styleId} onPress={() => router.push('/upload/collection')} className={`rounded-full px-8 py-4 ${styleId ? 'bg-primary' : 'bg-gray/40'}`}>
          <Text className="text-foreground">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


