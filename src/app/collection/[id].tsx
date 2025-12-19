import { CollectionHeader } from "@/components/collection/CollectionHeader";
import { CollectionModals } from "@/components/collection/CollectionModals";
import { CollectionPostsGrid } from "@/components/collection/CollectionPostsGrid";
import AddPostsModal from "@/components/collection/AddPostsModal";
import CollectionPostCard from "@/components/collection/CollectionPostCard";
import DeleteCollectionModal from "@/components/collection/DeleteCollectionModal";
import DeleteConfirmModal from "@/components/collection/DeleteConfirmModal";
import EditCollectionNameModal from "@/components/collection/EditCollectionNameModal";
import { CustomToast } from "@/components/ui/CustomToast";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  addPostsToCollection,
  deleteCollection as deleteCollectionApi,
  fetchCollectionDetails,
  fetchUserPosts,
  removePostFromCollection,
  reorderCollectionPosts,
  updateCollectionName,
} from "@/services/collection.service";
import { useAuthRequiredStore } from "@/stores/authRequiredStore";
import { CollectionPostInterface } from "@/types/collection";
import { clearProfileCache } from "@/utils/database";
import { isSystemCollection } from "@/utils/collection.utils";
import { mvs, s } from "@/utils/scale";
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
import { COLLECTION_NAME } from "@/constants/limits";
import { toast } from "sonner-native";

const { width: screenWidth } = Dimensions.get("window");
// Responsive spacing based on screen width (reference width 375)
const REF_WIDTH = 375;
const GAP = Math.max(6, Math.round((8 * screenWidth) / REF_WIDTH));
const H_PADDING = Math.max(24, Math.round((32 * screenWidth) / REF_WIDTH));


function useCollectionDetail(
  collectionId?: string,
  viewerId?: string | null
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<any>(null);
  const [posts, setPosts] = useState<CollectionPostInterface[]>([]);
  const [editName, setEditName] = useState("");
  const previousNameRef = useRef<string>("");
  const previousPostsRef = useRef<CollectionPostInterface[] | null>(null);

  const loadCollection = useCallback(async () => {
    if (!collectionId) return;

    try {
      setLoading(true);
      const data = await fetchCollectionDetails(collectionId);
      setCollection(data);
      setPosts(data.posts);
      setEditName(data.name);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Impossibile caricare la collezione");
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  const handleSaveName = useCallback(async () => {
    if (!collection || !editName.trim()) return;
    // Optimistic update
    const newName = editName.trim();
    previousNameRef.current = collection.name;
    setCollection((prev: any) => ({ ...prev, name: newName }));

    try {
      await updateCollectionName(collection.id, newName);

      if (viewerId) {
        await clearProfileCache(viewerId);
      }
    } catch (err: any) {
      setCollection((prev: any) => ({
        ...prev,
        name: previousNameRef.current,
      }));
      const toastId = toast.custom(
        <CustomToast
          message={
            err.message || "Impossibile aggiornare il nome della collezione"
          }
          iconType="error"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 4000 }
      );
    }
  }, [collection, editName, viewerId]);

  const confirmDeleteCollection = useCallback(async () => {
    if (!collection) return;
    try {
      await deleteCollectionApi(collection.id);

      if (viewerId) {
        await clearProfileCache(viewerId);
      }
    } catch (err: any) {
      const toastId = toast.custom(
        <CustomToast
          message={err.message || "Impossibile eliminare la collezione"}
          iconType="error"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 4000 }
      );
      throw err;
    }
  }, [collection, viewerId]);

  const deletePost = useCallback(
    async (postId: string) => {
      if (!collection) return;

      try {
        await removePostFromCollection(collection.id, postId);
        setPosts((prev) => prev.filter((p) => p.postId !== postId));
        setCollection((prev: any) => ({
          ...prev,
          postsCount: prev.postsCount - 1,
        }));
        if (viewerId) {
          await clearProfileCache(viewerId);
        }
      } catch (err: any) {
        const toastId = toast.custom(
          <CustomToast
            message={err.message || "Impossibile rimuovere il post"}
            iconType="error"
            onClose={() => toast.dismiss(toastId)}
          />,
          { duration: 4000 }
        );
        throw err;
      }
    },
    [collection, viewerId]
  );

  const reorderPosts = useCallback(
    async (data: CollectionPostInterface[]) => {
      if (!collection) return;

      const validPosts = data.filter(
        (item: any) =>
          item &&
          !item.isAddButton &&
          item.postId &&
          typeof item.postId === "string" &&
          item.postId !== "add-button"
      ) as CollectionPostInterface[];

      const postIds = validPosts.map((p) => p.postId);
      const uniquePostIds = Array.from(new Set(postIds));

      if (postIds.length !== uniquePostIds.length) {
        console.error("Duplicate posts detected in reorder, removing duplicates");
        const seen = new Set<string>();
        const deduplicatedPosts = validPosts.filter((post) => {
          if (seen.has(post.postId)) {
            return false;
          }
          seen.add(post.postId);
          return true;
        });

        if (deduplicatedPosts.length !== posts.length) {
          console.error("Deduplication resulted in different count, reverting");
          if (previousPostsRef.current) {
            setPosts(previousPostsRef.current);
          }
          return;
        }

        previousPostsRef.current = posts;
        setPosts(deduplicatedPosts);

        try {
          await reorderCollectionPosts(
            collection.id,
            deduplicatedPosts.map((p) => p.postId)
          );
          if (viewerId) {
            await clearProfileCache(viewerId);
          }
        } catch (err: any) {
          console.error("Failed to reorder posts:", err);
          if (previousPostsRef.current) {
            setPosts(previousPostsRef.current);
          } else {
            loadCollection();
          }
        }
        return;
      }

      if (validPosts.length === 0 || validPosts.length !== posts.length) {
        console.warn("Invalid reorder data, reverting");
        if (previousPostsRef.current) {
          setPosts(previousPostsRef.current);
        }
        return;
      }

      previousPostsRef.current = posts;
      setPosts(validPosts);

      try {
        await reorderCollectionPosts(collection.id, uniquePostIds);

        if (viewerId) {
          await clearProfileCache(viewerId);
        }
      } catch (err: any) {
        console.error("Failed to reorder posts:", err);
        if (previousPostsRef.current) {
          setPosts(previousPostsRef.current);
        } else {
          loadCollection();
        }
      }
    },
    [collection, loadCollection, posts, viewerId]
  );

  const addPosts = useCallback(
    async (toAdd: string[], optimistic: CollectionPostInterface[]) => {
      if (!collection || !toAdd.length) return;

      const prevPostsSnapshot = posts;
      setPosts((prev) => [...optimistic, ...prev]);
      setCollection((prev: any) => ({
        ...prev,
        postsCount: (prev?.postsCount || 0) + optimistic.length,
      }));

      try {
        await addPostsToCollection(collection.id, toAdd);
        await loadCollection();

        if (viewerId) {
          await clearProfileCache(viewerId);
        }

        const toastId = toast.custom(
          <CustomToast
            message={`${toAdd.length} ${
              toAdd.length === 1 ? "tatuaggio" : "tatuaggi"
            } aggiunti alla collezione`}
            iconType="success"
            onClose={() => toast.dismiss(toastId)}
          />,
          { duration: 4000 }
        );
      } catch (err: any) {
        setPosts(prevPostsSnapshot);
        setCollection((prev: any) => ({
          ...prev,
          postsCount: Math.max(
            (prev?.postsCount || 0) - optimistic.length,
            0
          ),
        }));
        const toastId = toast.custom(
          <CustomToast
            message={
              err.message || "Impossibile aggiungere i post alla collezione"
            }
            iconType="error"
            onClose={() => toast.dismiss(toastId)}
          />,
          { duration: 4000 }
        );
        throw err;
      }
    },
    [collection, loadCollection, posts, viewerId]
  );

  return {
    loading,
    error,
    collection,
    posts,
    editName,
    setEditName,
    reload: loadCollection,
    saveName: handleSaveName,
    deleteCollection: confirmDeleteCollection,
    deletePost,
    reorderPosts,
    addPosts,
  };
}

export default function CollectionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { show } = useAuthRequiredStore();

  const [editMode, setEditMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
  const [deleteCollectionModalVisible, setDeleteCollectionModalVisible] =
    useState(false);
  const [deletingCollection, setDeletingCollection] = useState(false);

  const {
    loading,
    error,
    collection,
    posts,
    editName,
    setEditName,
    reload,
    saveName,
    deleteCollection,
    deletePost,
    reorderPosts,
    addPosts,
  } = useCollectionDetail(id, user?.id || null);

  // Layout depends on edit mode: 1 column while editing for reliable DnD
  const NUM_COLUMNS = editMode ? 1 : 2;
  const POST_WIDTH = (screenWidth - H_PADDING - GAP) / NUM_COLUMNS;
  const layoutKey = editMode ? "one-col" : "two-col";
  const isOwner = !!user && !!collection && collection.author?.id === user.id;
  // Check if this is the "Preferiti" collection (case-insensitive)
  const collectionNameLower = collection?.name?.toLowerCase() || "";
  const isArtistFavCollection =
    !!collection && collectionNameLower === "preferiti";
  // Check if this is "Tutti" collection - completely non-editable
  const isTuttiCollection =
    !!collection && collectionNameLower === "tutti";
  // Check if this is a system collection (Tutti or Preferiti)
  const isSystemCol = !!collection && isSystemCollection(collection.name);
  // Preferiti can edit posts but not name/delete. Tutti cannot edit at all.
  const canEditPosts = isOwner && !isTuttiCollection; // Allow edit mode for Preferiti
  const canEditName = isOwner && !isSystemCol; // Cannot edit name for any system collection
  const canDeleteCollection = isOwner && !isSystemCol; // Cannot delete any system collection
  const currentPostCount = collection?.postsCount ?? posts.length;
  const isArtistFavFull =
    isArtistFavCollection && currentPostCount >= 4;

  useEffect(() => {
    // Show auth modal for anonymous users when opening collection (dismissible so they can view)
    if (!user) {
      show("Sign in to view and manage collections", true);
    }
    reload();
  }, [reload, show, user]);

  // Ensure fresh data whenever screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      reload();
      return () => {};
    }, [reload])
  );

  const handleBack = () => {
    router.back();
  };

  const handleEditName = () => {
    if (!isOwner) return;
    setShowEditModal(true);
  };

  const handleToggleEditMode = () => {
    if (!isOwner) return;
    setEditMode(!editMode);
  };

  const handleDeleteCollection = () => {
    if (!isOwner) return;
    setDeleteCollectionModalVisible(true);
  };

  const confirmDeleteCollection = async () => {
    if (!isOwner || !collection) return;
    setDeletingCollection(true);
    try {
      await deleteCollection();
      router.back();
    } catch (err) {
      // Error toast is handled inside the hook
    } finally {
      setDeletingCollection(false);
      setDeleteCollectionModalVisible(false);
    }
  };

  const handleDeletePost = (postId: string, caption: string) => {
    if (!isOwner) return;
    setPostToDelete({ id: postId, caption });
    setDeleteModalVisible(true);
  };

  const confirmDeletePost = async () => {
    if (!isOwner) return;
    if (!postToDelete || !collection) return;
    setDeleting(true);
    try {
      await deletePost(postToDelete.id);
      setDeleteModalVisible(false);
      setPostToDelete(null);
    } catch (err) {
      // Error toast is handled inside the hook
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
      setPostToDelete(null);
    }
  };

  const handleDragEnd = async (data: CollectionPostInterface[]) => {
    if (!isOwner || !collection) return;
    await reorderPosts(data);
  };

  const openAddModal = async () => {
    try {
      if (!isOwner || !user || !collection) return;

      // Prevent adding more posts if this is the artist's "Preferiti" collection and it's full
      if (isArtistFavCollection && isArtistFavFull) {
        const toastId = toast.custom(
          <CustomToast
            message="Puoi salvare massimo 4 post nei Preferiti"
            iconType="error"
            onClose={() => toast.dismiss(toastId)}
          />,
          { duration: 4000 }
        );
        return;
      }

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
    if (!isOwner) return;
    if (!collection) return;
    
    // Prevent adding more posts if this is the artist's "Preferiti" collection and it's full
    if (isArtistFavCollection && isArtistFavFull) {
      const toastId = toast.custom(
        <CustomToast
          message="Puoi salvare massimo 4 post nei Preferiti"
          iconType="error"
          onClose={() => toast.dismiss(toastId)}
        />,
        { duration: 4000 }
      );
      setSelectModalVisible(false);
      return;
    }
    
    const toAdd = Array.from(selectedPostIds);
    if (!toAdd.length) {
      setSelectModalVisible(false);
      return;
    }
    // Optimistic add to top
    const addedSimple = allUserPosts.filter((p) => toAdd.includes(p.id));
    const optimistic: CollectionPostInterface[] = addedSimple.map((p, idx) => ({
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
    setSelectedPostIds(new Set());
    setSelectModalVisible(false);

    try {
      await addPosts(toAdd, optimistic);
    } catch (err) {
      // Error toast and revert handled in hook
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
  }: RenderItemParams<CollectionPostInterface>) => {
    const index = getIndex();
    const col = index !== undefined ? index % NUM_COLUMNS : 0;
    const row = index !== undefined ? Math.floor(index / NUM_COLUMNS) : 0;

    const marginLeft = col === 0 ? 0 : GAP / 2;
    const marginRight = col === NUM_COLUMNS - 1 ? 0 : GAP / 2;
    const marginTop = row === 0 ? 0 : GAP;

    return (
      <ScaleDecorator key={item.postId}>
        <CollectionPostCard
          thumbnailUrl={item.thumbnailUrl}
          mediaUrl={item.media[0]?.mediaUrl}
          mediaType={item.media[0]?.mediaType}
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
        <View className="flex-row items-center justify-between px-4 pt-4 pb-4">
          <View className="w-10 h-10 rounded-full bg-foreground/20" />
          <View className="items-center flex-1">
            <View className="w-40 h-6 mb-2 rounded bg-foreground/20" />
            <View className="flex-col items-center mt-1">
              <View className="flex-row items-center mb-1">
                <View className="w-5 h-5 mr-2 rounded-full bg-foreground/20" />
                <View className="w-32 h-4 rounded bg-foreground/20" />
              </View>
              <View className="w-20 h-4 rounded bg-foreground/20" />
            </View>
          </View>
          <View className="w-10 h-10 rounded-full bg-foreground/20" />
        </View>

        {/* Grid skeleton: 2 columns of 9:16 cards */}
        <View style={{ paddingHorizontal: H_PADDING / 2 }}>
          <View className="flex-row justify-between">
            {/* Left column */}
            <View style={{ width: POST_WIDTH }}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <View
                  key={`left-${idx}`}
                  style={{ marginTop: idx === 0 ? 0 : GAP }}
                >
                  <View className="rounded-lg bg-foreground/10 aspect-[9/16]" />
                </View>
              ))}
            </View>

            {/* Right column */}
            <View style={{ width: POST_WIDTH }}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <View
                  key={`right-${idx}`}
                  style={{ marginTop: idx === 0 ? 0 : GAP }}
                >
                  <View className="rounded-lg bg-foreground/10 aspect-[9/16]" />
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (error || !collection) {
    return (
      <View className="items-center justify-center flex-1 px-6 bg-background">
        <ScaledText
          className="text-center text-foreground"
          style={{ marginBottom: mvs(16) }}
        >
          {error || "Collezione non trovata"}
        </ScaledText>
        <TouchableOpacity
          onPress={handleBack}
          className="px-6 py-3 rounded-lg bg-primary"
        >
          <ScaledText className="text-white font-neueSemibold">
            Torna indietro
          </ScaledText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 ">
          <TouchableOpacity
            onPress={handleBack}
            className="items-center justify-center w-8 h-8 rounded-full bg-foreground/20"
          >
            <SVGIcons.ChevronLeft width={16} height={16} />
          </TouchableOpacity>

          <View className="items-center flex-1">
            <View className="flex-row items-center justify-center">
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-foreground font-neueSemibold"
                style={{
                  lineHeight: mvs(20),
                  borderBottomWidth: editMode ? mvs(0.5) : 0,
                  borderBottomColor: editMode ? undefined : "transparent",
                }}
              >
                {TrimText(collection.name, 15)}
              </ScaledText>
            {isOwner && editMode && !isSystemCol && (
              <TouchableOpacity
                onPress={handleEditName}
                style={{ marginLeft: s(8) }}
              >
                <SVGIcons.Edit width={16} height={16} />
              </TouchableOpacity>
            )}
            </View>
          </View>

          {canEditPosts && !(editMode && isArtistFavCollection) && (
            <TouchableOpacity
              onPress={editMode ? handleDeleteCollection : handleToggleEditMode}
              style={{
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {editMode ? (
                canDeleteCollection ? (
                  <SVGIcons.Trash width={20} height={20} />
                ) : (
                  <SVGIcons.Edit width={20} height={20} />
                )
              ) : (
                <SVGIcons.Edit width={20} height={20} />
              )}
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-col items-center pb-4 mt-1">
          <View className="flex-row items-center">
            <Image
              source={{
                uri:
                  collection?.author?.avatar ||
                  user?.avatar ||
                  `https://api.dicebear.com/7.x/initials/png?seed=${collection?.author?.firstName?.split(" ")[0]}`,
              }}
              className="w-5 h-5 mr-2 border rounded-full border-foreground"
            />
            <ScaledText
              variant="sm"
              className="text-foreground font-montserratLight"
            >
              {collection?.author?.firstName ||
                user?.firstName ||
                "Sconosciuto"}{" "}
              {collection?.author?.lastName || user?.lastName || ""}
            </ScaledText>
            {/* <ScaledText variant="sm" className="pl-2 text-foreground font-montserratLight">
              <span className="text-xl leading-none align-middle font-montserratSemibold">•</span>
                {collection.postsCount} {collection.postsCount === 1 ? 'design' : 'designs'}
            </ScaledText> */}
          </View>

          <View className="flex-row items-center">
            <ScaledText
              variant="sm"
              className="text-foreground font-montserratLight"
            >
              {collection.postsCount} design
            </ScaledText>
          </View>
        </View>

        {/* Posts Grid */}
        <DraggableFlatList
          key={layoutKey}
          data={posts}
          onDragEnd={({ data }) => handleDragEnd(data)}
          keyExtractor={(item) => item.postId}
          renderItem={renderPostItem}
          numColumns={NUM_COLUMNS}
          ListHeaderComponent={
            editMode ? (
              <View
                style={{
                  marginTop: GAP,
                  marginBottom: GAP,
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  onPress={isArtistFavFull ? undefined : openAddModal}
                  disabled={isArtistFavFull}
                  activeOpacity={isArtistFavFull ? 1 : 0.8}
                  className="items-center justify-center border-2 border-dashed rounded-xl border-primary bg-primary/10"
                  style={{
                    width: POST_WIDTH,
                    height: mvs(253),
                    opacity: isArtistFavFull ? 0.5 : 1,
                    pointerEvents: isArtistFavFull ? "none" : "auto",
                  }}
                >
                  <SVGIcons.AddRed width={s(32)} height={s(32)} />
                  <ScaledText
                    allowScaling={false}
                    variant="md"
                    className="mt-3 text-foreground font-neueMedium"
                  >
                    Aggiungi nuovo tatuaggio
                  </ScaledText>
                  {isArtistFavFull && (
                    <ScaledText
                      allowScaling={false}
                      variant="xs"
                      className="mt-2 text-center text-gray font-neueLight"
                      style={{ paddingHorizontal: s(8) }}
                    >
                      Limite 4 post raggiunto
                    </ScaledText>
                  )}
                </TouchableOpacity>
              </View>
            ) : null
          }
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

        <CollectionModals
          showEditName={showEditModal}
          editName={editName}
          onEditNameChange={setEditName}
          onEditNameClose={() => setShowEditModal(false)}
          onEditNameSave={async () => {
            await saveName();
            setShowEditModal(false);
          }}
          showSelectPosts={selectModalVisible}
          allUserPosts={allUserPosts}
          selectedPostIds={selectedPostIds}
          onTogglePostSelect={toggleSelect}
          onCloseSelect={() => setSelectModalVisible(false)}
          onConfirmAdd={confirmAdd}
          collectionId={id}
          showDeletePost={deleteModalVisible}
          deletingPost={deleting}
          postToDelete={postToDelete}
          onCancelDeletePost={() => {
            if (!deleting) {
              setDeleteModalVisible(false);
              setPostToDelete(null);
            }
          }}
          onConfirmDeletePost={confirmDeletePost}
          showDeleteCollection={deleteCollectionModalVisible}
          deletingCollection={deletingCollection}
          collectionName={collection?.name}
          onCancelDeleteCollection={() => {
            if (!deletingCollection) {
              setDeleteCollectionModalVisible(false);
            }
          }}
          onConfirmDeleteCollection={confirmDeleteCollection}
        />
      </View>
    </GestureHandlerRootView>
  );
}
