import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { addPostsToCollection, createCollection, fetchUserPosts, removePostFromCollection, reorderCollectionPosts } from "@/services/collection.service";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";

const { width: screenWidth } = Dimensions.get("window");
const POST_WIDTH = (screenWidth - 48) / 2;

type SimplePost = { id: string; caption?: string; thumbnailUrl?: string };

type GridPost = SimplePost & { mediaUrl?: string };

export default function NewCollectionScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [name] = useState("New collection");
  const [posts, setPosts] = useState<GridPost[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [allUserPosts, setAllUserPosts] = useState<SimplePost[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        if (!user) return;
        const p = await fetchUserPosts(user.id);
        setAllUserPosts(p);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user?.id]);

  const handleBack = () => router.back();

  const ensureCollection = async () => {
    if (collectionId) return collectionId;
    if (!user) throw new Error("Not authenticated");
    const created = await createCollection(user.id, name);
    setCollectionId(created.id);
    return created.id;
  };

  const openAddModal = async () => {
    await ensureCollection();
    setSelectModalVisible(true);
  };

  const toggleSelect = (postId: string) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  };

  const confirmAdd = async () => {
    try {
      const cid = await ensureCollection();
      const toAdd = Array.from(selectedPostIds);
      if (!toAdd.length) {
        setSelectModalVisible(false);
        return;
      }
      await addPostsToCollection(cid, toAdd);
      const added = allUserPosts.filter((p) => toAdd.includes(p.id));
      setPosts((prev) => [...added, ...prev]);
      setSelectedPostIds(new Set());
      setSelectModalVisible(false);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add posts to collection");
    }
  };

  const handleDeletePost = (postId: string, caption?: string) => {
    Alert.alert(
      "Delete Post",
      `Are you sure you want to remove "${caption || 'this post'}" from the collection?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (!collectionId) return;
              await removePostFromCollection(collectionId, postId);
              setPosts((prev) => prev.filter((p) => p.id !== postId));
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to remove post");
            }
          },
        },
      ]
    );
  };

  const onDragEnd = async (data: GridPost[]) => {
    setPosts(data);
    try {
      if (!collectionId) return;
      await reorderCollectionPosts(collectionId, data.map((p) => p.id));
    } catch (e) {
      console.error(e);
    }
  };

  const renderPostItem = ({ item, drag }: RenderItemParams<GridPost>) => (
    <View style={{ width: POST_WIDTH }} className="mb-4">
      <View className="relative">
        <Image source={{ uri: item.thumbnailUrl || item.mediaUrl }} className="w-full aspect-square rounded-lg" resizeMode="cover" />
        {editMode && (
          <>
            <TouchableOpacity className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 items-center justify-center" onPress={drag}>
              <SVGIcons.Drag className="w-3 h-3" />
            </TouchableOpacity>
            <TouchableOpacity className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 items-center justify-center" onPress={() => handleDeletePost(item.id, item.caption)}>
              <SVGIcons.Close className="w-3 h-3 text-white" />
            </TouchableOpacity>
          </>
        )}
      </View>
      <Text className="text-foreground text-sm mt-2" numberOfLines={2}>{item.caption || "Descrizione del tatuaggio"}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={handleBack} className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center">
          <SVGIcons.ChevronLeft className="w-5 h-5" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <View className="flex-row items-center">
            <Text className="text-white text-xl font-bold mr-2">New collection</Text>
            <SVGIcons.Pen2 className="w-4 h-4 text-white" />
          </View>
          <View className="flex-row items-center mt-1">
            <Image source={{ uri: user?.avatar || "https://via.placeholder.com/20" }} className="w-5 h-5 rounded-full mr-2" />
            <Text className="text-white text-sm">{user?.firstName} {user?.lastName} • {posts.length} designs</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setEditMode((v) => !v)} className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center">
          <SVGIcons.Settings className="w-5 h-5 text-white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap justify-between">
          <TouchableOpacity onPress={openAddModal} style={{ width: POST_WIDTH }} className="mb-4">
            <View className="rounded-xl border-2 border-dashed border-red-500/70 bg-red-500/10 items-center justify-center aspect-square">
              <SVGIcons.AddRed className="w-8 h-8" />
              <Text className="text-gray-300 mt-3">Add new tattoo</Text>
            </View>
          </TouchableOpacity>

          {posts.length > 0 && (
            <DraggableFlatList
              data={posts}
              onDragEnd={({ data }) => onDragEnd(data)}
              keyExtractor={(item) => item.id}
              renderItem={renderPostItem}
              numColumns={2}
            />
          )}
        </View>
      </ScrollView>

      <Modal visible={selectModalVisible} transparent animationType="fade" onRequestClose={() => setSelectModalVisible(false)}>
        <View className="flex-1 bg-black/60 items-center justify-center px-4">
          <View className="bg-background rounded-xl p-4 w-full max-w-xl">
            <Text className="text-foreground text-lg font-bold mb-3">Select tattoos</Text>
            <ScrollView className="max-h-[60vh]">
              <View className="flex-row flex-wrap justify-between">
                {allUserPosts.map((p) => {
                  const checked = selectedPostIds.has(p.id);
                  return (
                    <TouchableOpacity key={p.id} onPress={() => toggleSelect(p.id)} style={{ width: POST_WIDTH }} className="mb-4">
                      <View className={`rounded-lg overflow-hidden border ${checked ? 'border-primary' : 'border-transparent'}`}>
                        <Image source={{ uri: p.thumbnailUrl || "https://via.placeholder.com/200" }} className="w-full aspect-square" resizeMode="cover" />
                      </View>
                      <Text className="text-foreground text-xs mt-2" numberOfLines={2}>{p.caption || 'Untitled'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity onPress={() => setSelectModalVisible(false)} className="flex-1 bg-gray-200 py-3 rounded-lg">
                <Text className="text-foreground text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAdd} className="flex-1 bg-primary py-3 rounded-lg">
                <Text className="text-white text-center font-semibold">Add to collection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
