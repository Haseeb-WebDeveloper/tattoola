import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { fetchCollectionDetails, removePostFromCollection, reorderCollectionPosts, updateCollectionName } from "@/services/collection.service";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";

const { width: screenWidth } = Dimensions.get("window");
const POST_WIDTH = (screenWidth - 48) / 2; // 2 columns with padding

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

  const handleBack = () => {
    router.back();
  };

  const handleEditName = () => {
    setShowEditModal(true);
  };

  const handleSaveName = async () => {
    if (!collection || !editName.trim()) return;
    
    try {
      await updateCollectionName(collection.id, editName.trim());
      setCollection(prev => ({ ...prev, name: editName.trim() }));
      setShowEditModal(false);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update collection name");
    }
  };

  const handleToggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleDeletePost = (postId: string, caption: string) => {
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
              await removePostFromCollection(collection.id, postId);
              setPosts(prev => prev.filter(p => p.postId !== postId));
              setCollection(prev => ({ ...prev, postsCount: prev.postsCount - 1 }));
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to remove post");
            }
          },
        },
      ]
    );
  };

  const handleDragEnd = async (data: CollectionPost[]) => {
    if (!editMode) return;
    
    setPosts(data);

    // Update order in database
    try {
      await reorderCollectionPosts(collection.id, data.map(p => p.postId));
    } catch (err: any) {
      console.error("Failed to reorder posts:", err);
      // Revert on error
      loadCollection();
    }
  };

  const handlePostPress = (postId: string) => {
    router.push(`/post/${postId}` as any);
  };

  const renderPostItem = ({ item, drag, isActive }: RenderItemParams<CollectionPost>) => (
    <TouchableOpacity
      onPress={() => handlePostPress(item.postId)}
      onLongPress={editMode ? drag : undefined}
      className="mb-4"
      style={{ width: POST_WIDTH }}
      disabled={editMode && isActive}
    >
      <View className="relative">
        <Image
          source={{ uri: item.thumbnailUrl || item.media[0]?.mediaUrl }}
          className="w-full aspect-square rounded-lg"
          resizeMode="cover"
        />
        
        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          className="absolute bottom-0 left-0 right-0 rounded-b-lg p-3"
        >
          <Text className="text-white text-sm font-medium" numberOfLines={2}>
            {item.caption || "Descrizione del tatuaggio"}
          </Text>
        </LinearGradient>

        {/* Edit mode controls */}
        {editMode && (
          <>
            <TouchableOpacity
              className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 items-center justify-center"
              onPress={drag}
            >
              <SVGIcons.Drag className="w-3 h-3 text-white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
              onPress={() => handleDeletePost(item.postId, item.caption)}
            >
              <SVGIcons.Trash className="w-3 h-3 text-white" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground">Loading...</Text>
      </View>
    );
  }

  if (error || !collection) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-foreground text-center mb-4">{error || "Collection not found"}</Text>
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
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={handleBack}
          className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
        >
          <SVGIcons.ChevronLeft className="w-5 h-5 text-white" />
        </TouchableOpacity>
        
        <View className="flex-1 items-center">
          <View className="flex-row items-center">
            <Text className="text-white text-xl font-bold mr-2">{collection.name}</Text>
            <TouchableOpacity onPress={handleEditName}>
              <SVGIcons.Pen2 className="w-4 h-4 text-white" />
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center mt-1">
            <Image
              source={{ uri: user?.avatar || "https://via.placeholder.com/20" }}
              className="w-5 h-5 rounded-full mr-2"
            />
            <Text className="text-white text-sm">
              {user?.firstName} {user?.lastName} • {collection.postsCount} designs
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleToggleEditMode}
          className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
        >
          <SVGIcons.Settings className="w-5 h-5 text-white" />
        </TouchableOpacity>
      </View>

      {/* Posts Grid */}
      <View className="flex-1 px-4">
        <DraggableFlatList
          data={posts}
          onDragEnd={({ data }) => handleDragEnd(data)}
          keyExtractor={(item) => item.postId}
          renderItem={renderPostItem}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 20 }}
          scrollEnabled={true}
        />
      </View>

      {/* Edit Name Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-background rounded-xl p-6 w-full max-w-sm">
            <Text className="text-foreground text-lg font-bold mb-4">Edit Collection Name</Text>
            
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Collection name"
              className="bg-gray-100 rounded-lg px-4 py-3 mb-6 text-foreground"
              autoFocus
            />
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                className="flex-1 bg-gray-200 py-3 rounded-lg"
              >
                <Text className="text-foreground text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSaveName}
                className="flex-1 bg-primary py-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
