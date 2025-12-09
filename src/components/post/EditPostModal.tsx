import { ScaledText } from "@/components/ui/ScaledText";
import StyleInfoModal from "@/components/shared/StyleInfoModal";
import { SVGIcons } from "@/constants/svg";
import { createCollection } from "@/services/collection.service";
import { fetchTattooStyles, TattooStyleItem } from "@/services/style.service";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Component to display post media (image or video)
function PostMediaDisplay({
  media,
}: {
  media: { mediaUrl: string; mediaType: "IMAGE" | "VIDEO" };
}) {
  const videoPlayer =
    media.mediaType === "VIDEO"
      ? useVideoPlayer(media.mediaUrl, (player) => {
          player.loop = true;
          player.muted = false;
          // Auto-play video
          setTimeout(() => {
            player.play();
          }, 100);
        })
      : null;

  return (
    <View
      style={{
        width: "100%",
        height: screenHeight * 0.35,
        borderBottomLeftRadius: s(32),
        borderBottomRightRadius: s(32),
        overflow: "hidden",
      }}
    >
      {media.mediaType === "IMAGE" ? (
        <Image
          source={{ uri: media.mediaUrl }}
          style={{
            width: "100%",
            height: "100%",
            resizeMode: "cover",
          }}
        />
      ) : videoPlayer ? (
        <VideoView
          player={videoPlayer}
          style={{
            width: "100%",
            height: "100%",
          }}
          contentFit="cover"
          nativeControls={false}
        />
      ) : null}
    </View>
  );
}

interface Collection {
  id: string;
  name: string;
}

interface EditPostModalProps {
  visible: boolean;
  post: {
    id: string;
    caption?: string;
    style?: { id: string; name: string }; // Keep for backward compatibility
    styles?: { id: string; name: string }[]; // New: support multiple styles
    media: { mediaUrl: string; mediaType: "IMAGE" | "VIDEO" }[];
  };
  onClose: () => void;
  onSave: (data: {
    caption: string;
    styleId?: string[]; // Array of style IDs (1-3 styles)
    collectionIds: string[];
  }) => Promise<void>;
  isBottomSheet?: boolean;
  onHasChangesChange?: (hasChanges: boolean) => void;
  currentMediaIndex?: number; // Index of currently viewed media item
}

export default function EditPostModal({
  visible,
  post,
  onClose,
  onSave,
  isBottomSheet = false,
  onHasChangesChange,
  currentMediaIndex = 0,
}: EditPostModalProps) {
  // Initialize state with empty/default values - will be set in useEffect
  const [caption, setCaption] = useState("");
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    []
  );
  const [styles, setStyles] = useState<TattooStyleItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showStylesDropdown, setShowStylesDropdown] = useState(false);
  const [showCollectionsDropdown, setShowCollectionsDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] =
    useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [selectedStyleForInfo, setSelectedStyleForInfo] = useState<TattooStyleItem | null>(null);
  // Track newly created collections that should be deleted if user doesn't save
  // Track pending collections (created in frontend but not yet saved to database)
  const pendingCollectionsRef = useRef<{ tempId: string; name: string }[]>([]);

  // Track initial values to detect changes
  const [initialCaption, setInitialCaption] = useState("");
  const [initialStyleIds, setInitialStyleIds] = useState<string[]>([]);
  const [initialCollectionIds, setInitialCollectionIds] = useState<string[]>(
    []
  );

  // Track the post ID we've initialized for to prevent resetting on re-renders
  const initializedPostIdRef = useRef<string | null>(null);
  const previousVisibleRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  // Store post data in ref to prevent re-initialization when post object changes
  const postDataRef = useRef<{
    id: string;
    caption?: string;
    style?: { id: string; name: string };
    styles?: { id: string; name: string }[];
  }>({
    id: post.id,
    caption: post.caption,
    style: post.style,
    styles: post.styles,
  });

  // Update postDataRef when post changes, but only if it's a different post
  useEffect(() => {
    if (post.id !== postDataRef.current.id) {
      postDataRef.current = {
        id: post.id,
        caption: post.caption,
        style: post.style,
        styles: post.styles,
      };
    }
  }, [post.id, post.caption, post.style?.id, post.styles]);

  useEffect(() => {
    // Only initialize when modal becomes visible (transitions from false to true)
    // or when the post ID actually changes (different post)
    const isOpening = visible && !previousVisibleRef.current;
    const currentPostId = postDataRef.current.id;
    const isDifferentPost =
      visible && initializedPostIdRef.current !== currentPostId;

    // CRITICAL: Prevent any initialization if we're already initialized for this post and modal is open
    // This is the key fix - we must return early to prevent any state updates
    if (!isOpening && !isDifferentPost) {
      previousVisibleRef.current = visible;
      // Don't do anything if modal is already open and we're initialized
      if (!visible) {
        initializedPostIdRef.current = null;
        isInitializingRef.current = false;
      }
      return;
    }

    // Only initialize if we're opening or it's a different post
    if (isOpening || isDifferentPost) {
      isInitializingRef.current = true;
      const postData = postDataRef.current;
      const captionValue = postData.caption || "";
      // Use styles array if available, otherwise fall back to single style
      // This is a temporary value - loadData will fetch the actual styles from DB
      const styleIdsValue =
        post.styles && post.styles.length > 0
          ? post.styles.map((s) => s.id)
          : postData.style
            ? [postData.style.id]
            : [];

      // Only set state if we're actually initializing
      setCaption(captionValue);
      setSelectedStyleIds(styleIdsValue); // Temporary - will be updated by loadData
      setInitialCaption(captionValue);
      setInitialStyleIds(styleIdsValue); // Temporary - will be updated by loadData
      initializedPostIdRef.current = currentPostId;

      // loadData will fetch actual styles from database and update selectedStyleIds
      loadData().finally(() => {
        isInitializingRef.current = false;
      });
    }

    // Track previous visible state
    previousVisibleRef.current = visible;

    // Reset ref when modal closes
    if (!visible) {
      initializedPostIdRef.current = null;
      isInitializingRef.current = false;
      // Clear pending collections (they were only in frontend, so no cleanup needed)
      pendingCollectionsRef.current = [];
    }
    // Only depend on visible - post data is tracked via ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentPostId = postDataRef.current.id;
      const [stylesData, collectionsData, postCollectionsData, postStylesData] =
        await Promise.all([
          fetchTattooStyles(),
          fetchUserCollections(),
          fetchPostCollections(currentPostId),
          fetchPostStyles(currentPostId),
        ]);

      setStyles(stylesData);
      setCollections(collectionsData);
      // Only set collections and styles if we're initializing (not if user has made changes)
      if (isInitializingRef.current) {
        setSelectedCollectionIds(postCollectionsData);
        setInitialCollectionIds(postCollectionsData);
        // Update styles from database (this will override the temporary value set during initialization)
        setSelectedStyleIds(postStylesData);
        setInitialStyleIds(postStylesData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCollections = async (): Promise<Collection[]> => {
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return [];

    const { data, error } = await supabase
      .from("collections")
      .select("id, name")
      .eq("ownerId", session.user.id)
      .order("createdAt", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Collection[];
  };

  // No cleanup needed - pending collections are only in frontend, not in database

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      return; // Don't create empty collection
    }

    try {
      setCreatingCollection(true);

      // Generate temporary ID (don't call createCollection service - only frontend)
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Track this pending collection
      pendingCollectionsRef.current.push({
        tempId,
        name: newCollectionName.trim(),
      });

      // Add to collections list (frontend only)
      const newCollection: Collection = {
        id: tempId,
        name: newCollectionName.trim(),
      };
      setCollections((prev) => [newCollection, ...prev]);

      // Automatically select the new collection
      setSelectedCollectionIds((prev) => [...prev, tempId]);

      // Close modal and reset name
      setShowCreateCollectionModal(false);
      setNewCollectionName("");
    } catch (error) {
      console.error("Error creating collection:", error);
    } finally {
      setCreatingCollection(false);
    }
  };

  const fetchPostCollections = async (postId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("collection_posts")
      .select("collectionId")
      .eq("postId", postId);

    if (error) throw new Error(error.message);
    return (data || []).map((item: any) => item.collectionId);
  };

  const fetchPostStyles = async (postId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("styleId")
        .eq("id", postId)
        .single();

      if (error) {
        console.warn("Error fetching post styles from DB:", error);
        // Fallback to post prop
        return post.style
          ? [post.style.id]
          : post.styles?.map((s) => s.id) || [];
      }

      // Handle array type
      if (data?.styleId) {
        if (Array.isArray(data.styleId)) {
          return data.styleId;
        }
        // If it's still a string (old data), convert to array
        if (typeof data.styleId === "string") {
          return [data.styleId];
        }
      }

      // Fallback to empty array or post prop
      return post.style ? [post.style.id] : post.styles?.map((s) => s.id) || [];
    } catch (err) {
      console.warn(
        "Error fetching post styles, falling back to post prop:",
        err
      );
      return post.style ? [post.style.id] : post.styles?.map((s) => s.id) || [];
    }
  };

  const toggleStyle = (styleId: string) => {
    setSelectedStyleIds((prev) => {
      if (prev.includes(styleId)) {
        return prev.filter((id) => id !== styleId);
      } else {
        if (prev.length >= 3) return prev;
        return [...prev, styleId];
      }
    });
  };

  const toggleCollection = (collectionId: string) => {
    setSelectedCollectionIds((prev) => {
      if (prev.includes(collectionId)) {
        return prev.filter((id) => id !== collectionId);
      } else {
        return [...prev, collectionId];
      }
    });
  };

  const handleSave = async () => {
    if (selectedStyleIds.length === 0) {
      // Show error - at least 1 style needed
      return;
    }
    if (selectedCollectionIds.length === 0) {
      // Show error - at least 1 collection needed
      return;
    }

    try {
      setSaving(true);
      // Ensure we have at least one style selected
      if (selectedStyleIds.length === 0) {
        throw new Error("Almeno uno stile deve essere selezionato");
      }

      // Get user session
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) throw new Error("Not authenticated");

      // Create pending collections in database first
      const tempIdToRealIdMap = new Map<string, string>();

      for (const pendingCollection of pendingCollectionsRef.current) {
        // Only create if it's selected
        if (selectedCollectionIds.includes(pendingCollection.tempId)) {
          const { id } = await createCollection(
            session.user.id,
            pendingCollection.name
          );
          tempIdToRealIdMap.set(pendingCollection.tempId, id);
        }
      }

      // Replace temporary IDs with real IDs in selectedCollectionIds
      const realCollectionIds = selectedCollectionIds.map((id) => {
        return tempIdToRealIdMap.get(id) || id; // Use real ID if it was temp, otherwise keep original
      });

      await onSave({
        caption: caption.trim(),
        styleId: selectedStyleIds, // Pass styleId array (1-3 styles)
        collectionIds: realCollectionIds, // Use real collection IDs
      });

      // Clear pending collections since they're now saved
      pendingCollectionsRef.current = [];
      onClose();
    } catch (error) {
      console.error("Error saving post:", error);
    } finally {
      setSaving(false);
    }
  };

  const selectedStyles = styles.filter((s) => selectedStyleIds.includes(s.id));
  const selectedCollections = collections.filter((c) =>
    selectedCollectionIds.includes(c.id)
  );

  // Check if any changes were made
  const hasChanges = useMemo(() => {
    const captionChanged = caption.trim() !== initialCaption.trim();
    const stylesChanged =
      selectedStyleIds.length !== initialStyleIds.length ||
      !selectedStyleIds.every((id) => initialStyleIds.includes(id)) ||
      !initialStyleIds.every((id) => selectedStyleIds.includes(id));
    const collectionsChanged =
      selectedCollectionIds.length !== initialCollectionIds.length ||
      !selectedCollectionIds.every((id) => initialCollectionIds.includes(id)) ||
      !initialCollectionIds.every((id) => selectedCollectionIds.includes(id));

    return captionChanged || stylesChanged || collectionsChanged;
  }, [
    caption,
    initialCaption,
    selectedStyleIds,
    initialStyleIds,
    selectedCollectionIds,
    initialCollectionIds,
  ]);

  // Notify parent when changes occur
  useEffect(() => {
    if (onHasChangesChange) {
      onHasChangesChange(hasChanges);
    }
  }, [hasChanges, onHasChangesChange]);

  const content = (
    <View className="flex-1" style={{ position: "relative" }}>
      {/* Post Image/Media - Show when bottom sheet, positioned behind header */}
      {isBottomSheet && post.media && post.media.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1,
            height: screenHeight * 0.35,
          }}
        >
          <PostMediaDisplay
            media={
              post.media[Math.min(currentMediaIndex, post.media.length - 1)]
            }
          />
        </View>
      )}

      {/* Header - show for both modal and bottom sheet, overlay on image */}
      <View
        className="flex-row items-center justify-between px-4 pb-4"
        style={{
          paddingTop: isBottomSheet ? s(20) : s(48),
          zIndex: 10,
          backgroundColor: "transparent",
          position: "relative",
        }}
      >
        <TouchableOpacity
          onPress={onClose}
          className="items-center justify-center rounded-full bg-foreground/30"
          style={{
            padding: mvs(10),
          }}
        >
          <SVGIcons.Close width={s(12)} height={s(12)} />
        </TouchableOpacity>
        <ScaledText
          variant="lg"
          className="text-white font-neueMedium"
          style={{ fontSize: s(16) }}
        >
          Dettagli Tatuaggio
        </ScaledText>
        <View style={{ width: s(35) }} />
      </View>

      {/* Background for form area below image */}
      {isBottomSheet && (
        <View
          style={{
            position: "absolute",
            top: screenHeight * 0.35, // Start below image
            left: 0,
            right: 0,
            bottom: 0, // Extend to bottom of screen
            backgroundColor: "#0F0202", // Background color for form area and below
            zIndex: 2,
          }}
        />
      )}

      {/* Form container with background */}
      <View
        style={{
          zIndex: 3,
          height: isBottomSheet ? screenHeight * 0.6 : undefined,
          backgroundColor: "#0F0202", // Background color for form area
          flexDirection: "column",
          position: "absolute",
          top: isBottomSheet ? screenHeight * 0.35 : 0, // Start below image
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingBottom: mvs(40), // Extra padding for Save button space
            paddingTop: s(16), // Small padding at top
          }}
          showsVerticalScrollIndicator={false}
          style={{
            flex: 1,
          }}
        >
          {/* Description */}
          <View style={{ marginBottom: mvs(16), paddingHorizontal: s(16) }}>
            <ScaledText
              variant="sm"
              className="mb-2 text-gray font-montserratMedium"
            >
              Descrizione
            </ScaledText>
            <View
              className="bg-[#100C0C] border border-gray rounded-lg"
              style={{
                minHeight: mvs(150),
                paddingHorizontal: s(10),
              }}
            >
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Una descrizione breve e veloce per questo tatuaggio. Probabilmente dovrebbe andare su due righe |"
                placeholderTextColor="#262626"
                multiline
                className="text-white font-montserratMedium"
                style={{
                  textAlignVertical: "top",
                  color: "#FFFFFF",
                }}
              />
            </View>
          </View>

          {/* Styles Selection */}
          <View style={{ marginBottom: mvs(16), paddingHorizontal: s(16) }}>
            <ScaledText
              variant="sm"
              className="mb-2 text-gray font-montserratMedium"
            >
              Assegna stili{" "}
              <ScaledText
                variant="sm"
                className="text-tat-chat font-montserratMedium"
              >
                (almeno 1 deve essere selezionato)
              </ScaledText>
            </ScaledText>
            <TouchableOpacity
              onPress={() => setShowStylesDropdown(!showStylesDropdown)}
              className="bg-[#100C0C] border border-gray rounded-lg flex-row items-center justify-between"
              style={{
                height: mvs(48),
                paddingHorizontal: s(13),
              }}
            >
              <View
                className="flex-row items-center flex-1"
                style={{ gap: s(10) }}
              >
                {selectedStyles.length > 0 && (
                  <View className="flex-row" style={{ gap: s(-12) }}>
                    {selectedStyles.slice(0, 3).map((style, index) => (
                      <View
                        key={style.id}
                        style={{
                          marginLeft: index > 0 ? s(-12) : 0,
                          zIndex: 3 - index,
                        }}
                      >
                        {style.imageUrl ? (
                          <Image
                            source={{ uri: style.imageUrl }}
                            style={{
                              width: s(20),
                              height: s(20),
                              borderRadius: s(10),
                              borderWidth: 2,
                              borderColor: "#100C0C",
                            }}
                          />
                        ) : (
                          <View
                            className="bg-gray/30"
                            style={{
                              width: s(20),
                              height: s(20),
                              borderRadius: s(10),
                              borderWidth: 2,
                              borderColor: "#100C0C",
                            }}
                          />
                        )}
                      </View>
                    ))}
                  </View>
                )}
                <ScaledText
                  variant="sm"
                  className="text-white font-montserratSemibold"
                >
                  {`${selectedStyles.length} stile${selectedStyles.length !== 1 ? "i" : ""} selezionato${selectedStyles.length !== 1 ? "i" : ""}`}
                </ScaledText>
              </View>
              <SVGIcons.ChevronDown
                width={s(8)}
                height={s(8)}
                style={{
                  transform: [
                    { rotate: showStylesDropdown ? "180deg" : "0deg" },
                  ],
                }}
              />
            </TouchableOpacity>

            {showStylesDropdown && (
              <View
                className="bg-[#100C0C] border border-gray rounded-lg mt-2"
                style={{
                  maxHeight: mvs(300), // Increased height for better scrolling
                }}
              >
                <ScrollView
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  style={{
                    maxHeight: mvs(300),
                  }}
                  contentContainerStyle={{
                    paddingVertical: s(4),
                  }}
                >
                  {styles.map((style) => {
                    const isSelected = selectedStyleIds.includes(style.id);
                    const isDisabled =
                      !isSelected && selectedStyleIds.length >= 3;
                    return (
                      <View
                        key={style.id}
                        className="flex-row items-center justify-between px-4 py-3"
                        style={{
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                      >
                        <TouchableOpacity
                          className="flex-row items-center flex-1"
                          onPress={() => setSelectedStyleForInfo(style)}
                          activeOpacity={0.7}
                          disabled={isDisabled}
                        >
                          {style.imageUrl && (
                            <Image
                              source={{ uri: style.imageUrl }}
                              style={{
                                width: s(40),
                                height: s(40),
                                borderRadius: s(4),
                              }}
                            />
                          )}
                          <ScaledText
                            variant="sm"
                            className="ml-3 text-white font-neueMedium"
                          >
                            {style.name}
                          </ScaledText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => toggleStyle(style.id)}
                          disabled={isDisabled}
                        >
                          {isSelected ? (
                            <SVGIcons.CheckedCheckbox
                              width={s(20)}
                              height={s(20)}
                            />
                          ) : (
                            <SVGIcons.UncheckedCheckbox
                              width={s(20)}
                              height={s(20)}
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Collections Selection */}
          <View style={{ marginBottom: mvs(16), paddingHorizontal: s(16) }}>
            <ScaledText
              variant="sm"
              className="text-gray font-montserratMedium"
            >
              Assegna una o più collezioni{" "}
              <ScaledText
                variant="sm"
                className="text-tat-chat font-montserratMedium"
              >
                (almeno 1 deve essere selezionata)
              </ScaledText>
            </ScaledText>
            <TouchableOpacity
              onPress={() =>
                setShowCollectionsDropdown(!showCollectionsDropdown)
              }
              className="bg-[#100C0C] border border-gray rounded-lg flex-row items-center justify-between"
              style={{
                height: mvs(48),
                paddingHorizontal: s(13),
              }}
            >
              <ScaledText
                variant="sm"
                className="text-white font-montserratMedium"
              >
                {`${selectedCollections.length} collezione${selectedCollections.length !== 1 ? "i" : ""} selezionata${selectedCollections.length !== 1 ? "e" : ""}`}
              </ScaledText>
              <SVGIcons.ChevronDown
                width={s(8)}
                height={s(8)}
                style={{
                  transform: [
                    { rotate: showCollectionsDropdown ? "180deg" : "0deg" },
                  ],
                }}
              />
            </TouchableOpacity>

            {showCollectionsDropdown && (
              <View
                className="bg-[#100C0C] border border-gray rounded-lg mt-2"
                style={{
                  maxHeight: mvs(300), // Increased height for better scrolling
                }}
              >
                <ScrollView
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  style={{
                    maxHeight: mvs(300),
                  }}
                  contentContainerStyle={{
                    paddingVertical: s(4),
                  }}
                >
                  {collections.map((collection) => {
                    const isSelected = selectedCollectionIds.includes(
                      collection.id
                    );
                    return (
                      <TouchableOpacity
                        key={collection.id}
                        onPress={() => toggleCollection(collection.id)}
                        className="flex-row items-center justify-between px-4 py-3"
                      >
                        <ScaledText
                          variant="sm"
                          className="text-white font-neueMedium"
                        >
                          {collection.name}
                        </ScaledText>
                        {isSelected ? (
                          <SVGIcons.CheckedCheckbox
                            width={s(20)}
                            height={s(20)}
                          />
                        ) : (
                          <SVGIcons.UncheckedCheckbox
                            width={s(20)}
                            height={s(20)}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  {/* Create New Collection Option */}
                  <View
                    className="border-t border-gray/30"
                    style={{
                      borderStyle: "dashed",
                      borderTopWidth: 1,
                      marginTop: s(4),
                      marginHorizontal: s(4),
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCreateCollectionModal(true)}
                    className="flex-col items-center justify-center"
                    style={{
                      backgroundColor: "#140404", // TAT- dark gray maroon
                      borderWidth: 1,
                      borderColor: "#AE0E0E", // TAT - Brand red
                      borderStyle: "dashed",
                      borderRadius: s(8),
                      padding: s(24),
                      marginHorizontal: s(4),
                      marginTop: s(4),
                      marginBottom: s(4),
                      minHeight: mvs(70),
                      gap: s(5),
                    }}
                  >
                    <SVGIcons.Plus
                      width={s(19)}
                      height={s(19)}
                      fill="#AE0E0E"
                    />
                    <ScaledText
                      variant="sm"
                      className="text-gray font-neueLight"
                      style={{
                        fontSize: s(14),
                        lineHeight: s(23),
                        color: "#A49A99", // TAT- gray
                      }}
                    >
                      Crea nuova collezione
                    </ScaledText>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </View>

          {/* Save Button - Fixed at bottom of form area */}
          <View
            style={{
              backgroundColor: "#0F0202", // Match form background
              paddingTop: s(16),
              paddingHorizontal: s(16),
            }}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={
                saving ||
                !hasChanges ||
                selectedStyleIds.length === 0 ||
                selectedCollectionIds.length === 0
              }
              className="items-center justify-center rounded-full bg-primary"
              style={{
                paddingVertical: mvs(10.5),
                opacity:
                  saving ||
                  !hasChanges ||
                  selectedStyleIds.length === 0 ||
                  selectedCollectionIds.length === 0
                    ? 0.5
                    : 1,
              }}
            >
              <ScaledText variant="md" className="text-white font-neueMedium">
                {saving ? "Salvataggio..." : "Salva modifiche"}
              </ScaledText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Create Collection Modal */}
      <Modal
        visible={showCreateCollectionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowCreateCollectionModal(false);
          setNewCollectionName("");
        }}
      >
        <View
          className="items-center justify-center flex-1 px-4 bg-black/50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <View
            className="bg-[#100C0C] border border-gray rounded-lg w-full"
            style={{ maxWidth: s(400), padding: s(20) }}
          >
            <ScaledText
              variant="lg"
              className="mb-4 text-white font-neueMedium"
              style={{ fontSize: s(18) }}
            >
              Crea Nuova Collezione
            </ScaledText>
            <TextInput
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              placeholder="Nome collezione"
              placeholderTextColor="#A49A99"
              className="bg-[#1A1616] border border-gray rounded-lg text-white font-montserratSemibold px-4 py-3 mb-4"
              style={{ fontSize: s(14) }}
              autoFocus
              onSubmitEditing={handleCreateCollection}
            />
            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowCreateCollectionModal(false);
                  setNewCollectionName("");
                }}
                className="px-6 py-3 border rounded-lg border-gray"
              >
                <ScaledText variant="sm" className="text-white font-neueMedium">
                  Annulla
                </ScaledText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateCollection}
                disabled={!newCollectionName.trim() || creatingCollection}
                className="px-6 py-3 rounded-lg bg-red"
                style={{
                  opacity:
                    !newCollectionName.trim() || creatingCollection ? 0.5 : 1,
                }}
              >
                <ScaledText variant="sm" className="text-white font-neueMedium">
                  {creatingCollection ? "Creazione..." : "Crea"}
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  if (isBottomSheet) {
    return (
      <>
        {content}
        {/* Style Info Modal */}
        <StyleInfoModal
          visible={selectedStyleForInfo !== null}
          style={selectedStyleForInfo}
          onClose={() => setSelectedStyleForInfo(null)}
        />
      </>
    );
  }

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={(e) => {
            // Prevent closing on outside press - only allow close button or back button
            e.stopPropagation();
          }}
        >
          <View style={{ flex: 1 }} pointerEvents="box-none">
            {content}
          </View>
        </Pressable>
      </Modal>
      {/* Style Info Modal */}
      <StyleInfoModal
        visible={selectedStyleForInfo !== null}
        style={selectedStyleForInfo}
        onClose={() => setSelectedStyleForInfo(null)}
      />
    </>
  );
}
