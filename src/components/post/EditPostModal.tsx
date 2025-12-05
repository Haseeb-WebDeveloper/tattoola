import { ScaledText } from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { fetchTattooStyles, TattooStyleItem } from "@/services/style.service";
import { mvs, s } from "@/utils/scale";
import { supabase } from "@/utils/supabase";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface Collection {
  id: string;
  name: string;
}

interface EditPostModalProps {
  visible: boolean;
  post: {
    id: string;
    caption?: string;
    style?: { id: string; name: string };
    media: { mediaUrl: string; mediaType: "IMAGE" | "VIDEO" }[];
  };
  onClose: () => void;
  onSave: (data: {
    caption: string;
    styleId?: string;
    collectionIds: string[];
  }) => Promise<void>;
  isBottomSheet?: boolean;
}

export default function EditPostModal({
  visible,
  post,
  onClose,
  onSave,
  isBottomSheet = false,
}: EditPostModalProps) {
  const [caption, setCaption] = useState(post.caption || "");
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>(
    post.style ? [post.style.id] : []
  );
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    []
  );
  const [styles, setStyles] = useState<TattooStyleItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showStylesDropdown, setShowStylesDropdown] = useState(false);
  const [showCollectionsDropdown, setShowCollectionsDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Track initial values to detect changes
  const [initialCaption, setInitialCaption] = useState(post.caption || "");
  const [initialStyleIds, setInitialStyleIds] = useState<string[]>(
    post.style ? [post.style.id] : []
  );
  const [initialCollectionIds, setInitialCollectionIds] = useState<string[]>(
    []
  );

  useEffect(() => {
    if (visible) {
      const captionValue = post.caption || "";
      const styleIdsValue = post.style ? [post.style.id] : [];
      setCaption(captionValue);
      setSelectedStyleIds(styleIdsValue);
      setInitialCaption(captionValue);
      setInitialStyleIds(styleIdsValue);
      loadData();
    }
  }, [visible, post]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stylesData, collectionsData, postCollectionsData] =
        await Promise.all([
          fetchTattooStyles(),
          fetchUserCollections(),
          fetchPostCollections(post.id),
        ]);

      setStyles(stylesData);
      setCollections(collectionsData);
      setSelectedCollectionIds(postCollectionsData);
      setInitialCollectionIds(postCollectionsData);
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

  const fetchPostCollections = async (postId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("collection_posts")
      .select("collectionId")
      .eq("postId", postId);

    if (error) throw new Error(error.message);
    return (data || []).map((item: any) => item.collectionId);
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
      await onSave({
        caption: caption.trim(),
        styleId: selectedStyleIds[0], // Use first selected style as primary
        collectionIds: selectedCollectionIds,
      });
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

  const content = (
    <View className="flex-1" style={{ backgroundColor: "transparent" }}>
      {/* Header - only show if not bottom sheet */}
      {!isBottomSheet && (
        <View
          className="flex-row items-center justify-between px-4 pb-4"
          style={{ paddingTop: s(48) }}
        >
          <TouchableOpacity onPress={onClose}>
            <View
              className="rounded-full bg-white/10"
              style={{
                width: s(35),
                height: s(35),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SVGIcons.Close width={s(20)} height={s(20)} />
            </View>
          </TouchableOpacity>
          <ScaledText
            variant="lg"
            className="text-white font-neueMedium"
            style={{ fontSize: s(16) }}
          >
            Edit tattoo details
          </ScaledText>
          <View style={{ width: s(35) }} />
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <View className="px-4 mb-4">
          <ScaledText
            variant="sm"
            className="mb-2 text-gray font-montserratSemibold"
            style={{ fontSize: s(12) }}
          >
            Description
          </ScaledText>
          <View
            className="bg-[#100C0C] border border-gray rounded-lg"
            style={{
              minHeight: mvs(164),
              padding: s(10),
            }}
          >
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="A quick and short description for this tattoo. Probably it should go to two rows |"
              placeholderTextColor="#A49A99"
              multiline
              className="text-white font-montserratSemibold"
              style={{
                fontSize: s(12),
                lineHeight: s(23),
                textAlignVertical: "top",
              }}
            />
          </View>
        </View>

        {/* Styles Selection */}
        <View className="px-4 mb-4">
          <ScaledText
            variant="sm"
            className="mb-2 text-gray font-montserratSemibold"
            style={{ fontSize: s(12) }}
          >
            Assign styles{" "}
            <ScaledText
              variant="sm"
              className="text-gray font-montserratLight"
              style={{ fontSize: s(11) }}
            >
              (at least 1 needs to be selected)
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
                style={{ fontSize: s(12) }}
              >
                {`${selectedStyles.length} style${selectedStyles.length !== 1 ? "s" : ""} selected`}
              </ScaledText>
            </View>
            <SVGIcons.ChevronDown
              width={s(8)}
              height={s(8)}
              style={{
                transform: [{ rotate: showStylesDropdown ? "180deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>

          {showStylesDropdown && (
            <View className="bg-[#100C0C] border border-gray rounded-lg mt-2 max-h-64">
              <ScrollView>
                {styles.map((style) => {
                  const isSelected = selectedStyleIds.includes(style.id);
                  const isDisabled =
                    !isSelected && selectedStyleIds.length >= 3;
                  return (
                    <TouchableOpacity
                      key={style.id}
                      onPress={() => toggleStyle(style.id)}
                      disabled={isDisabled}
                      className="flex-row items-center px-4 py-3"
                      style={{
                        opacity: isDisabled ? 0.5 : 1,
                      }}
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
                      {style.imageUrl && (
                        <Image
                          source={{ uri: style.imageUrl }}
                          style={{
                            width: s(40),
                            height: s(40),
                            borderRadius: s(4),
                            marginLeft: s(12),
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
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Collections Selection */}
        <View className="px-4 mb-4">
          <ScaledText
            variant="sm"
            className="mb-2 text-gray font-montserratSemibold"
            style={{ fontSize: s(12) }}
          >
            Assign one or collections{" "}
            <ScaledText
              variant="sm"
              className="text-gray font-montserratLight"
              style={{ fontSize: s(11) }}
            >
              (at least 1 needs to be selected)
            </ScaledText>
          </ScaledText>
          <TouchableOpacity
            onPress={() => setShowCollectionsDropdown(!showCollectionsDropdown)}
            className="bg-[#100C0C] border border-gray rounded-lg flex-row items-center justify-between"
            style={{
              height: mvs(48),
              paddingHorizontal: s(13),
            }}
          >
            <ScaledText
              variant="sm"
              className="text-white font-montserratSemibold"
              style={{ fontSize: s(12) }}
            >
              {`${selectedCollections.length} collection${selectedCollections.length !== 1 ? "s" : ""} selected`}
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
            <View className="bg-[#100C0C] border border-gray rounded-lg mt-2 max-h-64">
              <ScrollView>
                {collections.map((collection) => {
                  const isSelected = selectedCollectionIds.includes(
                    collection.id
                  );
                  return (
                    <TouchableOpacity
                      key={collection.id}
                      onPress={() => toggleCollection(collection.id)}
                      className="flex-row items-center px-4 py-3"
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
                      <ScaledText
                        variant="sm"
                        className="ml-3 text-white font-neueMedium"
                      >
                        {collection.name}
                      </ScaledText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="px-4 pb-8">
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
            height: mvs(48),
            opacity:
              saving ||
              !hasChanges ||
              selectedStyleIds.length === 0 ||
              selectedCollectionIds.length === 0
                ? 0.5
                : 1,
          }}
        >
          <ScaledText
            variant="md"
            className="text-white font-neueMedium"
            style={{ fontSize: s(14) }}
          >
            {saving ? "Saving..." : "Save changes"}
          </ScaledText>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isBottomSheet) {
    return content;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {content}
    </Modal>
  );
}
