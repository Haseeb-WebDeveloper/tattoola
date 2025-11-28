import AddPostsModal from "@/components/collection/AddPostsModal";
import CollectionPostCard from "@/components/collection/CollectionPostCard";
import DeleteConfirmModal from "@/components/collection/DeleteConfirmModal";
import EditCollectionNameModal from "@/components/collection/EditCollectionNameModal";
import { CustomToast } from "@/components/ui/CustomToast";
import ScaledText from "@/components/ui/ScaledText";
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
import { clearProfileCache } from "@/utils/database";
import { mvs } from "@/utils/scale";
import { TrimText } from "@/utils/text-trim";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Image, TouchableOpacity, View } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const { width: screenWidth } = Dimensions.get("window");
// Responsive spacing based on screen width (reference width 375)
const REF_WIDTH = 375;
const GAP = Math.max(6, Math.round((8 * screenWidth) / REF_WIDTH));
const H_PADDING = Math.max(24, Math.round((32 * screenWidth) / REF_WIDTH));

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
  const insets = useSafeAreaInsets();

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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{
    id: string;
    caption: string;
  } | null>(null);
  const [allUserPosts, setAllUserPosts] = useState<
    { id: string; caption?: string; thumbnailUrl?: string }[]
  >([]);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(
    new Set()
  );

  // Layout depends on edit mode: 1 column while editing for reliable DnD
  const NUM_COLUMNS = editMode ? 1 : 2;
  const POST_WIDTH = (screenWidth - H_PADDING - GAP) / NUM_COLUMNS;
  const layoutKey = editMode ? "one-col" : "two-col";

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

      // Clear profile cache to refresh collections on profile screen
      if (user?.id) {
        await clearProfileCache(user.id);
      }
    } catch (err: any) {
      // Revert on error
      setCollection((prev: any) => ({
        ...prev,
        name: previousNameRef.current,
      }));
      const toastId = toast.custom(
        <CustomToast
          message={err.message || "Failed to update collection name"}
          iconType="error"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 4000 }
      );
    }
  };

  const handleToggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleDeletePost = (postId: string, caption: string) => {
    setPostToDelete({ id: postId, caption });
    setDeleteModalVisible(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete || !collection) return;
    setDeleting(true);
    try {
      await removePostFromCollection(collection.id, postToDelete.id);
      setPosts((prev) => prev.filter((p) => p.postId !== postToDelete.id));
      setCollection((prev) => ({ ...prev, postsCount: prev.postsCount - 1 }));
      if (user?.id) {
        await clearProfileCache(user.id);
      }
      setDeleteModalVisible(false);
      setPostToDelete(null);
    } catch (err: any) {
      const toastId = toast.custom(
        <CustomToast
          message={err.message || "Failed to remove post"}
          iconType="error"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 4000 }
      );
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
      setPostToDelete(null);
    }
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

      // Clear profile cache to refresh collections on profile screen
      if (user?.id) {
        await clearProfileCache(user.id);
      }
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
    setCollection((prev: any) => ({
      ...prev,
      postsCount: (prev?.postsCount || 0) + optimistic.length,
    }));
    setSelectedPostIds(new Set());
    setSelectModalVisible(false);

    try {
      await addPostsToCollection(collection.id, toAdd);
      await loadCollection();

      // Clear profile cache to refresh collections on profile screen
      if (user?.id) {
        await clearProfileCache(user.id);
      }

      // Show success toast
      const toastId = toast.custom(
        <CustomToast
          message={`${toAdd.length} ${toAdd.length === 1 ? "tattoo" : "tattoos"} added to collection`}
          iconType="success"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 4000 }
      );
    } catch (err: any) {
      setPosts(prevPostsSnapshot);
      setCollection((prev: any) => ({
        ...prev,
        postsCount: Math.max((prev?.postsCount || 0) - optimistic.length, 0),
      }));
      const toastId = toast.custom(
        <CustomToast
          message={err.message || "Failed to add posts to collection"}
          iconType="error"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 4000 }
      );
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
        <CollectionPostCard
          thumbnailUrl={item.thumbnailUrl}
          mediaUrl={item.media[0]?.mediaUrl}
          caption={item.caption}
          editMode={editMode}
          isActive={isActive}
          onPress={() => handlePostPress(item.postId)}
          onDragHandlePressIn={editMode ? drag : undefined}
          onDeletePress={() =>
            handleDeletePost(item.postId, item.caption || "")
          }
          width={POST_WIDTH}
          marginLeft={marginLeft}
          marginRight={marginRight}
          marginTop={marginTop}
          fixedHeight={editMode ? mvs(253) : undefined}
        />
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
        <ScaledText
          className="text-foreground text-center"
          style={{ marginBottom: mvs(16) }}
        >
          {error || "Collection not found"}
        </ScaledText>
        <TouchableOpacity
          onPress={handleBack}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <ScaledText className="text-white font-neueSemibold">
            Go Back
          </ScaledText>
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
              <ScaledText
                allowScaling={false}
                variant="2xl"
                className="text-foreground font-neueSemibold mr-2  border-foreground"
                style={{
                  lineHeight: mvs(20),
                  borderBottomWidth: mvs(0.5),
                }}
              >
                {TrimText(collection.name, 15)}
              </ScaledText>
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
                    `https://api.dicebear.com/7.x/initials/png?seed=${collection?.author?.firstName?.split(" ")[0]}`,
                }}
                className="w-5 h-5 rounded-full mr-2 border border-foreground"
              />
              <ScaledText
                variant="sm"
                className="text-foreground font-montserratSemibold"
              >
                {collection?.author?.firstName || user?.firstName || "Unknown"}{" "}
                {collection?.author?.lastName || user?.lastName || "User"} •{" "}
                {collection.postsCount} designs
              </ScaledText>
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
              <SVGIcons.Add width={16} height={16} />
            ) : (
              <SVGIcons.Edit width={20} height={20} />
            )}
          </TouchableOpacity>
        </View>

        {/* Posts Grid */}
        <DraggableFlatList
          key={layoutKey}
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
          autoscrollThreshold={24}
        />

        {/* Edit Name Modal */}
        <EditCollectionNameModal
          visible={showEditModal}
          value={editName}
          onChangeValue={setEditName}
          onCancel={() => setShowEditModal(false)}
          onSave={handleSaveName}
        />

        {/* Add Posts Modal */}
        <AddPostsModal
          visible={selectModalVisible}
          items={allUserPosts as any}
          selectedIds={selectedPostIds}
          onToggle={toggleSelect}
          onClose={() => setSelectModalVisible(false)}
          onConfirm={confirmAdd}
          collectionId={id}
        />

        {/* Delete Confirm Modal */}
        <DeleteConfirmModal
          visible={deleteModalVisible}
          caption={postToDelete?.caption}
          onCancel={() => {
            if (!deleting) {
              setDeleteModalVisible(false);
              setPostToDelete(null);
            }
          }}
          onConfirm={confirmDeletePost}
        />
      </View>
    </GestureHandlerRootView>
  );
}
