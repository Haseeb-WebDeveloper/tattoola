import { createCollection } from '@/services/collection.service';
import { usePostUploadStore } from '@/stores/postUploadStore';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';

type SimpleCollection = { id: string; name: string };

export default function UploadCollectionStep() {
  const collectionId = usePostUploadStore((s) => s.collectionId);
  const setCollectionId = usePostUploadStore((s) => s.setCollectionId);
  const [collections, setCollections] = useState<SimpleCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getUser();
        const userId = session.user?.id;
        if (!userId) return;
        const { data, error } = await supabase
          .from('collections')
          .select('id,name')
          .eq('ownerId', userId)
          .order('createdAt', { ascending: false });
        if (error) throw new Error(error.message);
        if (mounted) setCollections((data || []) as any);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const { data: session } = await supabase.auth.getUser();
    const userId = session.user?.id;
    if (!userId) return;
    const created = await createCollection(userId, trimmed);
    setCollections((prev) => [{ id: created.id, name: trimmed }, ...prev]);
    setCollectionId(created.id);
    setNewName('');
  };

  const renderItem = ({ item }: { item: SimpleCollection }) => (
    <TouchableOpacity onPress={() => setCollectionId(item.id)} className={`px-4 py-3 border-b border-gray/20 ${collectionId === item.id ? 'bg-primary/10' : ''}`}>
      <Text className="text-foreground tat-body-1">{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black">
      <View className="px-6 pt-6">
        <Text className="text-foreground section-title mb-2">Add to collection</Text>
        <Text className="text-foreground/80 mb-4">Pick an existing collection or create a new one</Text>
        <View className="flex-row items-center gap-2 mb-4">
          <View className="flex-1 rounded-2xl bg-black/40 border border-gray">
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="New collection name"
              placeholderTextColor="#A49A99"
              className="px-4 py-3 text-base text-foreground"
            />
          </View>
          <TouchableOpacity onPress={handleCreate} className="rounded-full bg-primary px-4 py-3">
            <Text className="text-foreground">Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1">
        {loading ? (
          <View />
        ) : (
          <FlatList data={collections} keyExtractor={(i) => i.id} renderItem={renderItem} />
        )}
      </View>

      <View className="flex-row justify-between px-6 py-4 bg-background z-20">
        <TouchableOpacity onPress={() => router.back()} className="rounded-full border border-foreground px-6 py-4">
          <Text className="text-foreground">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/upload/preview')} className="rounded-full px-8 py-4 bg-primary">
          <Text className="text-foreground">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


