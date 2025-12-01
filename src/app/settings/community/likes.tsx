import { CustomToast } from "@/components/ui/CustomToast";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  fetchLikedPosts,
  LikedPost,
  togglePostLike,
} from "@/services/post.service";
import { fetchTattooStyles, TattooStyleItem } from "@/services/style.service";
import { mvs, s } from "@/utils/scale";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const COLUMN_WIDTH = (SCREEN_WIDTH - s(48)) / 2; // Account for padding and gap

// Skeleton Card Component
const SkeletonPostCard: React.FC<{ height: number }> = ({ height }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={{
        width: COLUMN_WIDTH,
        height,
        borderRadius: s(12),
        backgroundColor: "#2A2A2A",
        opacity,
        marginBottom: mvs(16),
      }}
    />
  );
};

interface PostCardProps {
  post: LikedPost;
  onUnlike: (postId: string) => void;
  isRemoving: boolean;
  onPress: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onUnlike,
  isRemoving,
  onPress,
}) => {
  const firstMedia = post.media[0];
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRemoving) {
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isRemoving]);

  return (
    <Animated.View
      style={{
        width: COLUMN_WIDTH,
        marginBottom: mvs(16),
        opacity: fadeAnim,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(post.id)}
        style={{
          borderRadius: s(12),
          overflow: "hidden",
        }}
      >
        {/* Post Image */}
        <View
          style={{
            width: "100%",
            // aspectRatio: 0.75,
            height: mvs(253),
            backgroundColor: "#2A2A2A",
          }}
        >
          {firstMedia && (
            <Image
              source={{ uri: firstMedia.mediaUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          )}

          {/* Heart Icon */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onUnlike(post.id);
            }}
            style={{
              position: "absolute",
              top: s(12),
              right: s(12),
              width: s(24),
              height: s(24),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isRemoving ? (
              <SVGIcons.LikeOutline width={s(24)} height={s(24)} />
            ) : (
              <SVGIcons.LikeFilledOutline width={s(24)} height={s(24)} />
            )}
          </TouchableOpacity>

          {/* Gradient Overlay */}
          <LinearGradient
            colors={["rgba(17,17,17,0)", "rgba(17,17,17,0.8)"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: s(80),
              paddingHorizontal: s(8),
              paddingBottom: s(8),
              justifyContent: "flex-end",
            }}
          >
            {post.caption && (
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-foreground font-neueMedium"
                numberOfLines={2}
              >
                {post.caption}
              </ScaledText>
            )}
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function LikesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<LikedPost[]>([]);
  const [removingPostIds, setRemovingPostIds] = useState<Set<string>>(
    new Set()
  );
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [tattooStyles, setTattooStyles] = useState<TattooStyleItem[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [tempSelectedStyleId, setTempSelectedStyleId] = useState<string | null>(
    null
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Load tattoo styles on mount
  useEffect(() => {
    const loadStyles = async () => {
      try {
        const styles = await fetchTattooStyles();
        setTattooStyles(styles);
      } catch (error) {
        console.error("Error fetching tattoo styles:", error);
      }
    };
    loadStyles();
  }, []);

  // Load liked posts when user or filter changes
  useEffect(() => {
    if (!user?.id) return;

    const loadLikedPosts = async () => {
      try {
        setLoading(true);
        const data = await fetchLikedPosts(user.id, selectedStyleId);
        setPosts(data);
      } catch (error) {
        console.error("Error fetching liked posts:", error);
        toast.error("Failed to load liked posts");
      } finally {
        setLoading(false);
      }
    };

    loadLikedPosts();
  }, [user?.id, selectedStyleId]);

  const handleBack = () => {
    router.back();
  };

  const handlePostPress = (postId: string) => {
    router.push(`/post/${postId}` as any);
  };

  const handleFilterPress = () => {
    setTempSelectedStyleId(selectedStyleId);
    setDropdownOpen(false);
    setFilterModalVisible(true);
    // Snap to first index (50%) when opening to show more content by default
    setTimeout(() => {
      bottomSheetRef.current?.snapToIndex(0);
    }, 100);
  };

  const handleCloseFilter = useCallback(() => {
    bottomSheetRef.current?.close();
    setFilterModalVisible(false);
    setDropdownOpen(false);
  }, []);

  const handleResetFilter = useCallback(() => {
    setTempSelectedStyleId(null);
    setDropdownOpen(false);
  }, []);

  const handleApplyFilter = useCallback(() => {
    setSelectedStyleId(tempSelectedStyleId);
    handleCloseFilter();
  }, [tempSelectedStyleId, handleCloseFilter]);

  const handleToggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const handleSelectStyle = useCallback((styleId: string | null) => {
    setTempSelectedStyleId(styleId);
    setDropdownOpen(false);
  }, []);

  // Update BottomSheet snap when dropdown state changes
  useEffect(() => {
    if (filterModalVisible && bottomSheetRef.current) {
      // Snap to index 1 (85%) when dropdown opens, index 0 (35%) when it closes
      const targetIndex = dropdownOpen ? 1 : 0;
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(targetIndex);
      }, 100);
    }
  }, [dropdownOpen, filterModalVisible]);

  const handleUnlike = async (postId: string) => {
    if (!user?.id) return;

    // Clear any existing undo timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // Optimistically mark as removing
    setRemovingPostIds((prev) => new Set(prev).add(postId));

    // Show toast with undo
    let toastId: string | number = "";
    toastId = toast.custom(
      <CustomToast
        message="Post removed from your likes. "
        actionText="Undo?"
        iconType="success"
        onAction={() => {
          // Undo the unlike
          if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
          }
          setRemovingPostIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
          toast.dismiss(toastId);
        }}
        onClose={() => {
          toast.dismiss(toastId);
        }}
      />,
      { duration: 5000 }
    );

    // Set timeout to actually unlike after 5 seconds
    undoTimeoutRef.current = setTimeout(async () => {
      try {
        await togglePostLike(postId, user.id);
        // Remove from list
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setRemovingPostIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } catch (error) {
        console.error("Error unliking post:", error);
        toast.error("Failed to unlike post");
        // Revert optimistic update
        setRemovingPostIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    }, 5000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  // Split posts into two columns for masonry layout
  const leftColumn: LikedPost[] = [];
  const rightColumn: LikedPost[] = [];

  posts.forEach((post, index) => {
    if (index % 2 === 0) {
      leftColumn.push(post);
    } else {
      rightColumn.push(post);
    }
  });

  // BottomSheet configuration - provide both snap points upfront
  // First snap point (collapsed) set higher to show more content by default
  const snapPoints = useMemo(() => ["50%", "85%"], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
        pressBehavior="close"
        enableTouchThrough={false}
      />
    ),
    []
  );

  const selectedStyleName = useMemo(() => {
    if (!selectedStyleId) return null;
    const style = tattooStyles.find((s) => s.id === selectedStyleId);
    return style?.name || null;
  }, [selectedStyleId, tattooStyles]);

  const tempSelectedStyleName = useMemo(() => {
    if (!tempSelectedStyleId) return "All";
    const style = tattooStyles.find((s) => s.id === tempSelectedStyleId);
    return style?.name || "All";
  }, [tempSelectedStyleId, tattooStyles]);

  return (
    <View
      className="bg-background min-h-screen"
      style={{
        flex: 1,
      }}
    >
      <LinearGradient
        colors={["#000000", "#0F0202"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-center relative"
          style={{
            paddingHorizontal: s(16),
            paddingVertical: mvs(16),
            marginBottom: mvs(24),
          }}
        >
          <TouchableOpacity
            onPress={handleBack}
            className="absolute rounded-full bg-foreground/20 items-center justify-center"
            style={{
              width: s(34),
              height: s(34),
              left: s(16),
              padding: s(8),
            }}
          >
            <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
          </TouchableOpacity>
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-white font-neueSemibold"
          >
            Cosa ti piace
          </ScaledText>
          <TouchableOpacity
            onPress={handleFilterPress}
            className="absolute rounded-full items-center justify-center"
            style={{
              width: s(34),
              height: s(34),
              right: s(16),
              padding: s(4),
            }}
          >
            <SVGIcons.Menu width={s(20)} height={s(20)} />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View
          style={{
            height: s(1),
            backgroundColor: "#A49A99",
            marginHorizontal: s(32),
            marginBottom: mvs(16),
          }}
        />

        {/* Active Filter Indicator */}
        {/* {selectedStyleName && (
          <View
            style={{
              paddingHorizontal: s(16),
              marginBottom: mvs(16),
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(164, 154, 153, 0.2)",
                paddingHorizontal: s(12),
                paddingVertical: mvs(8),
                borderRadius: s(8),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-white"
              >
                Filtra per stile:{" "}
                <ScaledText variant="sm" className="text-white font-neueSemibold">
                  {selectedStyleName}
                </ScaledText>
              </ScaledText>
              <TouchableOpacity
                onPress={() => setSelectedStyleId(null)}
                style={{ padding: s(4) }}
              >
                <SVGIcons.CloseGray width={s(12)} height={s(12)} />
              </TouchableOpacity>
            </View>
          </View>
        )} */}
        {/* Content */}
        <ScrollView
          className="h-full"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: s(16),
            paddingBottom: mvs(32),
          }}
        >
          {/* Info Text */}
          <View style={{ paddingHorizontal: s(16), marginBottom: mvs(24) }}>
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-white text-center font-neueLight"
              style={{ lineHeight: mvs(23) }}
            >
              Here you'll find the works you've liked.{"\n"}
              (To remove it, simply open the work and click the heart icon
              again.)
            </ScaledText>
          </View>

          {loading ? (
            <View style={{ flexDirection: "row", gap: s(16) }}>
              <View style={{ flex: 1 }}>
                <SkeletonPostCard height={mvs(253)} />
                <SkeletonPostCard height={mvs(253)} />
                <SkeletonPostCard height={mvs(253)} />
              </View>
              <View style={{ flex: 1 }}>
                <SkeletonPostCard height={mvs(253)} />
                <SkeletonPostCard height={mvs(253)} />
                <SkeletonPostCard height={mvs(253)} />
              </View>
            </View>
          ) : posts.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: mvs(32) }}>
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-gray font-neueLight"
              >
                Non hai ancora messo "Mi piace" a nessun post
              </ScaledText>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: s(16) }}>
              {/* Left Column */}
              <View style={{ flex: 1 }}>
                {leftColumn.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onUnlike={handleUnlike}
                    isRemoving={removingPostIds.has(post.id)}
                    onPress={handlePostPress}
                  />
                ))}
              </View>

              {/* Right Column */}
              <View style={{ flex: 1 }}>
                {rightColumn.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onUnlike={handleUnlike}
                    isRemoving={removingPostIds.has(post.id)}
                    onPress={handlePostPress}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Filter Modal */}
        <BottomSheet
          style={{
            margin: s(4),
            borderRadius: s(20),
          }}
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          enableDynamicSizing={false}
          backdropComponent={renderBackdrop}
          backgroundStyle={{
            backgroundColor: "#000000",
            borderTopLeftRadius: s(20),
            borderTopRightRadius: s(20),
            borderWidth: s(0.5),
            borderColor: "#FFFFFF",
          }}
          handleIndicatorStyle={{
            backgroundColor: "#333",
            width: s(40),
            height: mvs(4),
          }}
          onChange={(index) => {
            if (index === -1) {
              setFilterModalVisible(false);
              setDropdownOpen(false);
            }
          }}
        >
          {dropdownOpen ? (
            // Dropdown Expanded - Show all styles with scrollable list
            <>
              {/* Fixed Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: s(24),
                  paddingVertical: mvs(14),
                  gap: s(8),
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: s(8),
                  }}
                >
                  <SVGIcons.EditBrush width={s(13)} height={s(13)} />
                  <ScaledText
                    variant="md"
                    className="text-foreground font-montserratMedium"
                  >
                    Filtra per stile
                  </ScaledText>
                </View>
                <TouchableOpacity
                  onPress={handleResetFilter}
                  className="items-center justify-center"
                >
                  <ScaledText variant="md" className="font-neueLight text-gray">
                    Reset
                  </ScaledText>
                </TouchableOpacity>
              </View>

              {/* Scrollable Content */}
              <BottomSheetScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{
                  paddingHorizontal: s(24),
                  paddingBottom: mvs(24),
                }}
              >
                {/* Dropdown Selector */}
                <TouchableOpacity
                  onPress={handleToggleDropdown}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: s(16),
                    paddingVertical: mvs(14),
                    borderRadius: s(12),
                    borderWidth: s(0.5),
                    marginBottom: mvs(16),
                  }}
                  className="bg-tat-foreground border-tat"
                >
                  <ScaledText
                    variant="md"
                    className="text-foreground font-montserratMedium"
                  >
                    {tempSelectedStyleName}
                  </ScaledText>
                  <SVGIcons.ChevronLeft
                    width={s(12)}
                    height={s(12)}
                    style={{ transform: [{ rotate: "-90deg" }] }}
                  />
                </TouchableOpacity>

                {/* Styles List */}
                {/* All Option */}
                {/* <TouchableOpacity
                  onPress={() => handleSelectStyle(null)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: mvs(16),
                    borderBottomWidth: 0.5,
                    borderBottomColor: "#333",
                  }}
                >
                  <View
                    style={{
                      width: s(60),
                      height: s(60),
                      borderRadius: s(8),
                      backgroundColor: "#2A2A2A",
                      marginRight: s(12),
                    }}
                  />
                  <ScaledText
                    variant="md"
                    className="text-foreground"
                    style={{
                      flex: 1,
                      fontWeight: "600",
                    }}
                  >
                    All
                  </ScaledText>
                  <View
                    style={{
                      width: s(20),
                      height: s(20),
                      borderRadius: s(10),
                      borderWidth: tempSelectedStyleId === null ? s(6) : s(1),
                      borderColor:
                        tempSelectedStyleId === null ? "#AE0E0E" : "#666",
                    }}
                  />
                </TouchableOpacity> */}

                {/* Style Options */}
                {tattooStyles.map((style, index) => (
                  <TouchableOpacity
                    key={style.id}
                    onPress={() => handleSelectStyle(style.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: mvs(10),
                      borderBottomWidth: 0.5,
                      marginTop: index === 0 ? mvs(8) : 0,
                    }}
                    className="border-gray"
                  >
                    {/* Style Image */}
                    {style.imageUrl ? (
                      <Image
                        source={{ uri: style.imageUrl }}
                        style={{
                          width: s(43),
                          height: s(46),
                          borderRadius: s(6),
                          marginRight: s(12),
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: s(60),
                          height: s(60),
                          borderRadius: s(8),
                          backgroundColor: "#2A2A2A",
                          marginRight: s(12),
                        }}
                      />
                    )}
                    <ScaledText
                      variant="md"
                      className="text-foreground"
                      style={{
                        flex: 1,
                        fontWeight: "600",
                      }}
                    >
                      {style.name}
                    </ScaledText>
                    {tempSelectedStyleId === style.id ? (
                      <SVGIcons.CheckedCheckbox width={s(17)} height={s(17)} />
                    ) : (
                      <SVGIcons.UncheckedCheckbox
                        width={s(17)}
                        height={s(17)}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </BottomSheetScrollView>
            </>
          ) : (
            // Dropdown Collapsed - Show selector and buttons
            <BottomSheetView style={{ flex: 1 }}>
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: s(24),
                  paddingVertical: mvs(14),
                  gap: s(8),
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: s(8),
                  }}
                >
                  <SVGIcons.EditBrush width={s(13)} height={s(13)} />
                  <ScaledText
                    variant="md"
                    className="text-foreground font-montserratMedium"
                  >
                    Filtra per stile
                  </ScaledText>
                </View>
                <TouchableOpacity
                  onPress={handleResetFilter}
                  className="items-center justify-center"
                >
                  <ScaledText variant="md" className="font-neueLight text-gray">
                    Reset
                  </ScaledText>
                </TouchableOpacity>
              </View>

              {/* Dropdown Selector */}
              <View
                style={{
                  paddingHorizontal: s(24),
                  paddingBottom: mvs(24),
                }}
              >
                <TouchableOpacity
                  onPress={handleToggleDropdown}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: s(16),
                    paddingVertical: mvs(14),
                    borderRadius: s(12),
                    borderWidth: s(0.5),
                  }}
                  className="bg-tat-foreground border-tat"
                >
                  <ScaledText
                    variant="md"
                    className="text-foreground font-montserratMedium"
                  >
                    {tempSelectedStyleName}
                  </ScaledText>
                  <SVGIcons.ChevronLeft
                    width={s(12)}
                    height={s(12)}
                    style={{ transform: [{ rotate: "-90deg" }] }}
                  />
                </TouchableOpacity>
              </View>

              {/* Footer Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: s(24),
                  paddingBottom: mvs(24),
                  gap: s(12),
                  marginTop: "auto",
                }}
              >
                <TouchableOpacity
                  onPress={handleResetFilter}
                  className="rounded-full items-center"
                  style={{
                    flex: 1,
                    paddingVertical: mvs(10),
                    borderWidth: s(1),
                    borderColor: "#A49A99",
                    justifyContent: "center",
                  }}
                >
                  <ScaledText
                    variant="md"
                    className="font-neueSemibold text-foreground"
                  >
                    Reset
                  </ScaledText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleApplyFilter}
                  className="bg-primary rounded-full items-center"
                  style={{
                    flex: 1,
                    paddingVertical: mvs(10),
                    justifyContent: "center",
                  }}
                >
                  <ScaledText
                    variant="md"
                    className="font-neueSemibold text-foreground"
                  >
                    Apply Filters
                  </ScaledText>
                </TouchableOpacity>
              </View>
            </BottomSheetView>
          )}
        </BottomSheet>
      </LinearGradient>
    </View>
  );
}
