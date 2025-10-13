import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  addPostsToCollection,
  fetchCollectionDetails,
  fetchUserPosts,
  removePostFromCollection,
  reorderCollectionPosts,
  updateCollectionName,
} from "@/services/collection.service";
import { trimText } from "@/utils/text-trim";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
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

const { width: screenWidth } = Dimensions.get("window");
const GAP = 8;
const NUM_COLUMNS = 2;
const H_PADDING = 32;
const POST_WIDTH = (screenWidth - H_PADDING - GAP) / NUM_COLUMNS;

interface CollectionPost {
  id: string;
  postId: string;
  caption?: string;
  thumbnailUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  media: {
    id: string;
    mediaType: "IMAGE" | "VIDEO";
    mediaUrl: string;
    order: number;
  }[];
  style?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  author: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    municipality?: string;
    province?: string;
  };
}

export default function CollectionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<any>(null);
  const [posts, setPosts] = useState<CollectionPost[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const previousNameRef = useRef<string>("");
  const previousPostsRef = useRef<CollectionPost[] | null>(null);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [allUserPosts, setAllUserPosts] = useState<{ id: string; caption?: string; thumbnailUrl?: string }[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());

  const loadCollection = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await fetchCollectionDetails(id);
      setCollection(data);
      setPosts(data.posts);
      setEditName(data.name);
    } catch (err: any) {
      setError(err.message || "Failed to load collection");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  // Ensure fresh data whenever screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadCollection();
      return () => {};
    }, [loadCollection])
  );

  const handleBack = () => {
    router.back();
  };

  const handleEditName = () => {
    setShowEditModal(true);
  };

  const handleSaveName = async () => {
    if (!collection || !editName.trim()) return;
    // Optimistic update
    const newName = editName.trim();
    previousNameRef.current = collection.name;
    setCollection((prev: any) => ({ ...prev, name: newName }));
    setShowEditModal(false);

    try {
      await updateCollectionName(collection.id, newName);
    } catch (err: any) {
      // Revert on error
      setCollection((prev: any) => ({
        ...prev,
        name: previousNameRef.current,
      }));
      Alert.alert("Error", err.message || "Failed to update collection name");
    }
  };

  const handleToggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleDeletePost = (postId: string, caption: string) => {
    Alert.alert(
      "Delete Post",
      `Are you sure you want to remove "${caption || "this post"}" from the collection?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removePostFromCollection(collection.id, postId);
              setPosts((prev) => prev.filter((p) => p.postId !== postId));
              setCollection((prev) => ({
                ...prev,
                postsCount: prev.postsCount - 1,
              }));
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to remove post");
            }
          },
        },
      ]
    );
  };

  const handleDragEnd = async (data: CollectionPost[]) => {
    // Optimistic reorder
    previousPostsRef.current = posts;
    setPosts(data);

    try {
      await reorderCollectionPosts(
        collection.id,
        data.map((p) => p.postId)
      );
    } catch (err: any) {
      console.error("Failed to reorder posts:", err);
      // Revert on error to previous order
      if (previousPostsRef.current) {
        setPosts(previousPostsRef.current);
      } else {
        loadCollection();
      }
    }
  };

  const openAddModal = async () => {
    try {
      if (!user || !collection) return;
      const userPosts = await fetchUserPosts(user.id);
      setAllUserPosts(userPosts);
      setSelectModalVisible(true);
    } catch (e) {
      console.error(e);
    }
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
    if (!collection) return;
    const toAdd = Array.from(selectedPostIds);
    if (!toAdd.length) {
      setSelectModalVisible(false);
      return;
    }
    // Optimistic add to top
    const addedSimple = allUserPosts.filter((p) => toAdd.includes(p.id));
    const optimistic: CollectionPost[] = addedSimple.map((p, idx) => ({
      id: `temp-${Date.now()}-${idx}`,
      postId: p.id,
      caption: p.caption,
      thumbnailUrl: p.thumbnailUrl,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      media: [],
      style: undefined,
      author: collection.author,
    }));
    const prevPostsSnapshot = posts;
    setPosts((prev) => [...optimistic, ...prev]);
    setCollection((prev: any) => ({ ...prev, postsCount: (prev?.postsCount || 0) + optimistic.length }));
    setSelectedPostIds(new Set());
    setSelectModalVisible(false);

    try {
      await addPostsToCollection(collection.id, toAdd);
      await loadCollection();
    } catch (err: any) {
      setPosts(prevPostsSnapshot);
      setCollection((prev: any) => ({ ...prev, postsCount: Math.max((prev?.postsCount || 0) - optimistic.length, 0) }));
      Alert.alert("Error", err.message || "Failed to add posts to collection");
    }
  };

  const handlePostPress = (postId: string) => {
    if (!editMode) {
      router.push(`/post/${postId}` as any);
    }
  };

  const renderPostItem = ({
    item,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<CollectionPost>) => {
    const index = getIndex();
    const col = index !== undefined ? index % NUM_COLUMNS : 0;
    const row = index !== undefined ? Math.floor(index / NUM_COLUMNS) : 0;

    const marginLeft = col === 0 ? 0 : GAP / 2;
    const marginRight = col === NUM_COLUMNS - 1 ? 0 : GAP / 2;
    const marginTop = row === 0 ? 0 : GAP;

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onPress={() => handlePostPress(item.postId)}
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
              source={{ uri: item.thumbnailUrl || item.media[0]?.mediaUrl }}
              className="w-full aspect-[9/16] rounded-lg"
              resizeMode="cover"
            />

            {/* Gradient overlay */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,1)"]}
              className="absolute bottom-0 left-0 right-0 rounded-b-lg p-3"
            >
              <Text className="text-gray text-sm font-medium" numberOfLines={1}>
                {item.caption || "Descrizione del tatuaggio"}
              </Text>
            </LinearGradient>

            {/* Edit mode controls */}
            {editMode && (
              <>
                <TouchableOpacity
                  className="absolute top-2 left-2 w-8 h-8 rounded-full items-center justify-center"
                  onPressIn={drag}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <SVGIcons.Drag className="w-6 h-6" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground items-center justify-center"
                  onPress={() =>
                    handleDeletePost(item.postId, item.caption || "")
                  }
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

  if (loading) {
    // Skeleton that matches header + grid layout
    return (
      <View className="flex-1 bg-background">
        {/* Header skeleton */}
        <View className="flex-row items-center justify-between pb-4 pt-4 px-4">
          <View className="w-10 h-10 rounded-full bg-foreground/20" />
          <View className="items-center flex-1">
            <View className="w-40 h-6 bg-foreground/20 rounded mb-2" />
            <View className="flex-row items-center mt-1">
              <View className="w-5 h-5 rounded-full mr-2 bg-foreground/20" />
              <View className="w-48 h-4 bg-foreground/20 rounded" />
            </View>
          </View>
          <View className="w-10 h-10 rounded-full bg-foreground/20" />
        </View>

        {/* Grid skeleton: 2 columns of 9:16 cards */}
        <View className="px-4">
          <View className="flex-row flex-wrap" style={{ gap: GAP }}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <View key={idx} style={{ width: POST_WIDTH }} className="mb-2">
                <View className="rounded-lg bg-foreground/10 aspect-[9/16]" />
                <View className="h-4 bg-foreground/10 rounded mt-2 w-5/6" />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (error || !collection) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-foreground text-center mb-4">
          {error || "Collection not found"}
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between pb-4 pt-4 px-4">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-foreground/20 items-center justify-center"
          >
            <SVGIcons.ChevronLeft className="w-5 h-5" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <View className="flex-row items-center">
              <Text className="text-foreground font-bold mr-2 underline underline-offset-2 section-title">
                {trimText(collection.name, 15)}
              </Text>
              <TouchableOpacity onPress={handleEditName}>
                {editMode && <SVGIcons.Edit width={16} height={16} />}
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center mt-1">
              <Image
                source={{
                  uri:
                    collection?.author?.avatar ||
                    user?.avatar ||
                    "https://via.placeholder.com/20",
                }}
                className="w-5 h-5 rounded-full mr-2 border border-foreground"
              />
              <Text className="text-foreground text-sm">
                {collection?.author?.firstName || user?.firstName || "Unknown"}{" "}
                {collection?.author?.lastName || user?.lastName || "User"} •{" "}
                {collection.postsCount} designs
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => (editMode ? openAddModal() : handleToggleEditMode())}
            style={{
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
            }}
            className={`${editMode ? "bg-primary rounded-full" : ""}`}
          >
            {editMode ? (
              <SVGIcons.Add
               width={16}
               height={16}
              />
            ) : (
              <SVGIcons.Edit
                width={20}
                height={20}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Posts Grid */}
        <DraggableFlatList
          data={posts}
          onDragEnd={({ data }) => handleDragEnd(data)}
          keyExtractor={(item) => item.postId}
          renderItem={renderPostItem}
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

        {/* Edit Name Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View className="flex-1 items-center justify-center px-6 bg-black/50">
            <View className="bg-[#1a1a1a] p-6 rounded-xl w-full max-w-sm">
              <Text className="text-foreground text-lg font-bold mb-4">
                Edit Collection Name
              </Text>

              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Collection name"
                placeholderTextColor="#666"
                className="px-4 py-3 text-base text-foreground bg-[#252424] rounded-lg mb-4"
                autoFocus
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowEditModal(false)}
                  className="flex-1 bg-[#100C0C] py-3 rounded-lg"
                >
                  <Text className="text-foreground text-center font-semibold">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveName}
                  className="flex-1 bg-primary py-3 rounded-lg"
                >
                  <Text className="text-white text-center font-semibold">
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Posts Modal */}
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
      </View>
    </GestureHandlerRootView>
  );
}
