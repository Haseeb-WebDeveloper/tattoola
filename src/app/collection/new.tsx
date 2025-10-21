import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  addPostsToCollection,
  createCollection,
  fetchUserPosts,
  removePostFromCollection,
  reorderCollectionPosts,
  updateCollectionName,
} from "@/services/collection.service";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { toast } from "sonner-native";

const { width: screenWidth } = Dimensions.get("window");
const GAP = 8;
const NUM_COLUMNS = 2;
const H_PADDING = 32;
const POST_WIDTH = (screenWidth - H_PADDING - GAP) / NUM_COLUMNS;

type SimplePost = { id: string; caption?: string; thumbnailUrl?: string };

type GridPost = SimplePost & { mediaUrl?: string };
type GridItem = GridPost | { id: string; isAddButton: boolean };

export default function NewCollectionScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [name, setName] = useState("New collection");
  const [posts, setPosts] = useState<GridPost[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [allUserPosts, setAllUserPosts] = useState<SimplePost[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const previousNameRef = useRef<string>("New collection");

  useEffect(() => {
    (async () => {
      try {
        if (!user) return;
        // Ensure the collection exists immediately so reorders/deletes can persist
        await ensureCollection();
        // Load user's posts for the add modal
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
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
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
      toast.error(err.message || "Failed to add posts to collection");
    }
  };

  const handleDeletePost = (postId: string, caption?: string) => {
    toast.warning(
      `Are you sure you want to remove "${caption || "this post"}" from the collection?`
    );
  };

  const onDragEnd = async (data: GridPost[]) => {
    setPosts(data);
    try {
      if (!collectionId) return;
      await reorderCollectionPosts(
        collectionId,
        data.map((p) => p.id)
      );
    } catch (e) {
      console.error(e);
    }
  };

  const openEditName = async () => {
    await ensureCollection();
    previousNameRef.current = name;
    setShowEditNameModal(true);
  };

  const saveName = async () => {
    const newName = name.trim();
    if (!newName || !collectionId) {
      setShowEditNameModal(false);
      return;
    }
    setShowEditNameModal(false);
    try {
      await updateCollectionName(collectionId, newName);
    } catch (e: any) {
      setName(previousNameRef.current);
      toast.error(e?.message || "Failed to update collection name");
    }
  };

  const renderPostItem = ({
    item,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<GridPost>) => {
    const index = getIndex?.();
    const col = index !== undefined ? (index as number) % NUM_COLUMNS : 0;
    const row = index !== undefined ? Math.floor((index as number) / NUM_COLUMNS) : 0;

    const marginLeft = col === 0 ? 0 : GAP / 2;
    const marginRight = col === NUM_COLUMNS - 1 ? 0 : GAP / 2;
    const marginTop = row === 0 ? 0 : GAP;

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={editMode ? drag : undefined}
          delayLongPress={200}
          disabled={isActive}
          style={{
            width: POST_WIDTH,
            marginLeft,
            marginRight,
            marginTop,
          }}
        >
          <View
            className="relative aspect-[9/16]"
            style={{
              opacity: isActive ? 0.7 : 1,
              transform: [{ scale: isActive ? 1.05 : 1 }],
            }}
          >
            <Image
              source={{ uri: item.thumbnailUrl || item.mediaUrl }}
              className="w-full aspect-[9/16] rounded-lg"
              resizeMode="cover"
            />

            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              className="absolute bottom-0 left-0 right-0 rounded-b-lg p-3"
            >
              <Text className="text-white text-sm font-medium" numberOfLines={2}>
                {item.caption || "Descrizione del tatuaggio"}
              </Text>
            </LinearGradient>

            {editMode && (
              <>
                <TouchableOpacity
                  className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/50 items-center justify-center"
                  onPressIn={drag}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <SVGIcons.Drag className="w-6 h-6" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 items-center justify-center"
                  onPress={() => handleDeletePost(item.id, item.caption)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <SVGIcons.Trash className="w-4 h-4" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={handleBack}
          className="w-10 h-10 rounded-full bg-foreground/20 items-center justify-center"
        >
          <SVGIcons.ChevronLeft className="w-5 h-5" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <View className="flex-row items-center">
            <Text className="text-foreground font-bold mr-2 underline underline-offset-2 section-title">
              {name}
            </Text>
            <TouchableOpacity onPress={openEditName}>
              <SVGIcons.Pen2 className="w-4 h-4 text-white" />
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center mt-1">
            <Image
              source={{ uri: user?.avatar || "https://via.placeholder.com/20" }}
              className="w-5 h-5 rounded-full mr-2 border border-foreground"
              defaultSource={{ uri: "https://via.placeholder.com/20" }}
            />
            <Text className="text-foreground text-sm">
              {user?.firstName} {user?.lastName} • {posts.length} designs
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setEditMode((v) => !v)}
          className="w-10 h-10 rounded-full bg-foreground/20 items-center justify-center"
        >
          <SVGIcons.Settings className="w-5 h-5 text-white" />
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <DraggableFlatList
          data={[{ id: "add-button", isAddButton: true }, ...posts] as GridItem[]}
          onDragEnd={({ data }) => {
            const filtered = data.filter((i: GridItem) => !("isAddButton" in i)) as GridPost[];
            onDragEnd(filtered);
          }}
          keyExtractor={(item) => item.id}
          renderItem={({ item, drag, isActive, getIndex }) => {
            if ("isAddButton" in item && item.isAddButton) {
              const index = getIndex?.();
              const col = index !== undefined ? (index as number) % NUM_COLUMNS : 0;
              const row = index !== undefined ? Math.floor((index as number) / NUM_COLUMNS) : 0;
              const marginLeft = col === 0 ? 0 : GAP / 2;
              const marginRight = col === NUM_COLUMNS - 1 ? 0 : GAP / 2;
              const marginTop = row === 0 ? 0 : GAP;
              return (
                <TouchableOpacity
                  onPress={openAddModal}
                  style={{ width: POST_WIDTH, marginLeft, marginRight, marginTop }}
                  className="mb-0"
                  activeOpacity={0.8}
                >
                  <View className="rounded-xl border-2 border-dashed border-red-500/70 bg-red-500/10 items-center justify-center aspect-[9/16]">
                    <SVGIcons.AddRed className="w-8 h-8" />
                    <Text className="text-gray-300 mt-3">Add new tattoo</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            return renderPostItem({ item: item as GridPost, drag, isActive, getIndex });
          }}
          numColumns={NUM_COLUMNS}
          containerStyle={{
            flex: 1,
          }}
          contentContainerStyle={{
            paddingHorizontal: H_PADDING / 2,
            paddingBottom: 20,
          }}
          dragItemOverflow={true}
          activationDistance={editMode ? 0 : 999999}
        />
      </View>

      <Modal
        visible={selectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-4">
          <View className="bg-background rounded-xl p-4 w-full max-w-xl">
            <Text className="text-foreground text-lg font-bold mb-3">Select tattoos</Text>
            <ScrollView className="max-h-[60vh]">
              <View className="flex-row flex-wrap justify-between">
                {allUserPosts.map((p) => {
                  const checked = selectedPostIds.has(p.id);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => toggleSelect(p.id)}
                      style={{ width: POST_WIDTH }}
                      className="mb-4"
                    >
                      <View className={`rounded-lg overflow-hidden border ${checked ? "border-primary" : "border-transparent"}`}>
                        <Image
                          source={{ uri: p.thumbnailUrl || "https://via.placeholder.com/200" }}
                          className="w-full aspect-[9/16]"
                          resizeMode="cover"
                        />
                      </View>
                      <Text className="text-foreground text-xs mt-2" numberOfLines={2}>
                        {p.caption || "Untitled"}
                      </Text>
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

      {/* Edit Name Modal */}
      <Modal
        visible={showEditNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditNameModal(false)}
      >
        <View className="flex-1 items-center justify-center px-6 bg-black/50">
          <View className="bg-[#1a1a1a] p-6 rounded-xl w-full max-w-sm">
            <Text className="text-foreground text-lg font-bold mb-4">Edit Collection Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Collection name"
              placeholderTextColor="#666"
              className="px-4 py-3 text-base text-foreground bg-[#252424] rounded-lg mb-4"
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setShowEditNameModal(false)} className="flex-1 bg-[#100C0C] py-3 rounded-lg">
                <Text className="text-foreground text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveName} className="flex-1 bg-primary py-3 rounded-lg">
                <Text className="text-white text-center font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </GestureHandlerRootView>
  );
}
