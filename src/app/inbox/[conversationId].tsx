import ConversationMenuModals from "@/components/inbox/ConversationMenuModals";
import MessageItem from "@/components/inbox/MessageItem";
import ScaledText from "@/components/ui/ScaledText";
import { ScaledTextInput } from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import {
  blockUser,
  deleteConversation,
  fetchConversationByIdWithPeer,
  reportUser,
} from "@/services/chat.service";
import cloudinaryService from "@/services/cloudinary.service";
import { useChatThreadStore } from "@/stores/chatThreadStore";
import { usePresenceStore } from "@/stores/presenceStore";
import { mvs, s } from "@/utils/scale";
import { TrimText } from "@/utils/text-trim";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function ChatThreadScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const loadLatest = useChatThreadStore((s) => s.loadLatest);
  const loadOlder = useChatThreadStore((s) => s.loadOlder);
  const subscribe = useChatThreadStore((s) => s.subscribe);
  const unsubscribe = useChatThreadStore((s) => s.unsubscribe);
  const optimisticSend = useChatThreadStore((s) => s.optimisticSend);
  const markRead = useChatThreadStore((s) => s.markRead);
  const refreshReceipts = useChatThreadStore((s) => s.refreshReceipts);
  const messagesByConv = useChatThreadStore((s) => s.messagesByConv);

  const [text, setText] = useState("");
  const [peer, setPeer] = useState<{
    name?: string;
    avatar?: string;
    username?: string;
    id?: string;
  } | null>(null);
  const [conv, setConv] = useState<any>(null);
  const [loadingPeer, setLoadingPeer] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [showMessageRestrictionModal, setShowMessageRestrictionModal] =
    useState(false);
  const listRef = useRef<FlatList>(null);
  const newestMessageIdRef = useRef<string | null>(null);
  const isLoadingOlderRef = useRef<boolean>(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const rotationAnim = useRef(new Animated.Value(0)).current;

  // Get online status from presence store
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);

  useEffect(() => {
    if (isLoadingOlder) {
      rotationAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isLoadingOlder, rotationAnim]);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Memoize peer username for modal
  const peerUsername = React.useMemo(() => {
    return peer?.username || `${peer?.name || ""}`.trim() || "User";
  }, [peer?.username, peer?.name]);

  // Check if conversation is blocked
  const isConversationBlocked = React.useMemo(() => {
    return conv?.status === "BLOCKED";
  }, [conv?.status]);

  // Check if input should be disabled
  const isInputDisabled = React.useMemo(() => {
    return (
      uploading ||
      isConversationBlocked ||
      (conv?.status === "REQUESTED" && user?.id !== conv?.artistId)
    );
  }, [
    uploading,
    isConversationBlocked,
    conv?.status,
    conv?.artistId,
    user?.id,
  ]);

  // Deduplicate messages by ID (safety check)
  // Reverse array for inverted FlatList (newest at index 0 = bottom of screen)
  const messages = React.useMemo(() => {
    const rawMessages = messagesByConv[conversationId || ""] || [];
    const seen = new Set();
    const unique = rawMessages.filter((m: any) => {
      if (seen.has(m.id)) {
        return false;
      }
      seen.add(m.id);
      return true;
    });
    // Reverse for inverted list - newest first
    return unique.slice().reverse();
  }, [messagesByConv, conversationId]);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    // Load messages first, THEN subscribe to prevent race condition
    (async () => {
      try {
        await loadLatest(conversationId, user.id);
        subscribe(conversationId, user.id);
        // Refresh receipts after subscriptions are active to ensure we have latest status
        // This fixes the issue where inbox shows green tick but thread shows grey tick
        setTimeout(async () => {
          await refreshReceipts(conversationId, user.id);
        }, 1000);
      } catch (e) {
        console.error("Error loading conversation:", e);
      }
    })();

    return () => {
      try {
        unsubscribe(conversationId);
      } catch (e) {}
    };
  }, [conversationId, user?.id]);

  useEffect(() => {
    (async () => {
      if (!conversationId || !user?.id) return;
      setLoadingPeer(true);
      try {
        const c = await fetchConversationByIdWithPeer(user.id, conversationId);
        if (c) {
          // Extract peer info from conversation
          const peerUser = c.artist?.id === user.id ? c.lover : c.artist;
          setPeer({
            name: c.peerName,
            avatar: c.peerAvatar,
            username: peerUser?.username,
            id: c.peerId,
          });
          setConv(c);
        }
      } catch {
      } finally {
        setLoadingPeer(false);
      }
    })();
  }, [conversationId, user?.id]);

  // Mark messages as read when conversation is viewed or new messages arrive
  useEffect(() => {
    if (!conversationId || !user?.id || messages.length === 0) return;

    const timer = setTimeout(async () => {
      await markRead(conversationId, user.id);
    }, 300); // Reduced delay for faster marking

    return () => clearTimeout(timer);
  }, [conversationId, user?.id, messages.length]);

  // Safety net: Only refresh receipts if realtime subscription might have missed updates
  // This is a fallback for network issues or reconnection scenarios (very infrequent)
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    // Only refresh every 30 seconds as a safety net - realtime should handle most updates
    const interval = setInterval(() => {
      refreshReceipts(conversationId, user.id).catch(console.error);
    }, 30000); // 30 seconds - just a safety net

    return () => clearInterval(interval);
  }, [conversationId, user?.id, refreshReceipts]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length === 0) return;

    // Don't auto-scroll if we're loading older messages
    if (isLoadingOlderRef.current) return;

    const newestMessageId = messages[0]?.id;
    const isNewMessage =
      newestMessageId && newestMessageId !== newestMessageIdRef.current;

    if (isNewMessage && newestMessageIdRef.current !== null) {
      // Only scroll if we were already viewing messages and a NEW one arrived
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            listRef.current?.scrollToIndex({ index: 0, animated: true });
          } catch {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        }, 100);
      });
    }

    // Update ref with current newest message ID
    newestMessageIdRef.current = newestMessageId || null;
  }, [messages.length]);

  const handleSend = async () => {
    if ((!text.trim() && !selectedFile) || !conversationId || !user?.id) return;

    const hasFile = !!selectedFile;
    if (hasFile) {
      setUploading(true);
    }

    try {
      let mediaUrl = undefined;

      // Upload file first if selected
      if (selectedFile) {
        const uploadResult = await cloudinaryService.uploadFile(selectedFile, {
          folder: "tattoola/chat",
          resourceType: "auto", // Auto-detect file type
        });
        mediaUrl = uploadResult.secureUrl;
      }

      const messageType = selectedFile
        ? selectedFile.mimeType?.startsWith("image/")
          ? "IMAGE"
          : "FILE"
        : "TEXT";
      const messageText = text.trim() || undefined;

      setText("");
      setSelectedFile(null);

      await optimisticSend({
        conversationId,
        senderId: user.id,
        type: messageType,
        text: messageText,
        mediaUrl,
      });

      // Inverted list: scroll to index 0 for newest message (bottom of chat)
      // Use requestAnimationFrame + setTimeout to ensure FlatList has rendered
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            listRef.current?.scrollToIndex({ index: 0, animated: true });
          } catch {
            // Fallback to scrollToOffset if scrollToIndex fails
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        }, 100);
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Invio del messaggio non riuscito");
    } finally {
      if (hasFile) {
        setUploading(false);
      }
    }
  };

  const handlePickFile = async () => {
    try {
      // Request permission to access media library
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        toast.error("Autorizzazione negata per accedere alla galleria");
        return;
      }

      // Launch image picker to select from gallery
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      // Check file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (asset.fileSize && asset.fileSize > maxSize) {
        toast.error("File troppo grande");
        return;
      }

      // Transform ImagePicker asset to match DocumentPicker format
      const file = {
        uri: asset.uri,
        name:
          asset.fileName ||
          `media_${Date.now()}.${asset.type === "video" ? "mp4" : "jpg"}`,
        size: asset.fileSize,
        mimeType: asset.type === "video" ? "video/mp4" : "image/jpeg",
      };

      setSelectedFile(file);
    } catch (error) {
      console.error("Error picking file:", error);
      toast.error("Selezione del file non riuscita");
    }
  };

  const handleReport = React.useCallback(
    async (reason: string) => {
      if (!user?.id || !peer?.id || !conversationId) return;
      try {
        await reportUser(user.id, peer.id, conversationId, reason);
        toast.success("Segnalazione inviata");
      } catch (error) {
        console.error("Error reporting user:", error);
        toast.error("Invio della segnalazione non riuscito");
      }
    },
    [user?.id, peer?.id, conversationId]
  );

  const handleBlock = React.useCallback(async () => {
    if (!user?.id || !peer?.id || !conversationId) return;

    // Optimistically update UI
    setConv((prev: any) => ({ ...prev, status: "BLOCKED" }));

    try {
      await blockUser(user.id, peer.id, conversationId);
      toast.success("Utente bloccato");

      // Reload conversation to ensure we have the latest server state
      // This also updates blockedAt, blockedBy fields
      const updatedConv = await fetchConversationByIdWithPeer(
        user.id,
        conversationId
      );
      if (updatedConv) {
        setConv(updatedConv);
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Blocco dell'utente non riuscito");

      // Revert optimistic update on error
      const originalConv = await fetchConversationByIdWithPeer(
        user.id,
        conversationId
      );
      if (originalConv) {
        setConv(originalConv);
      }
    }
  }, [user?.id, peer?.id, conversationId]);

  const handleDelete = React.useCallback(async () => {
    if (!user?.id || !conversationId) return;
    try {
      await deleteConversation(conversationId, user.id);
      toast.success("Chat eliminata");
      // Reload messages to apply deletedAt filter (will hide old messages)
      await loadLatest(conversationId, user.id);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Eliminazione della conversazione non riuscita");
    }
  }, [user?.id, conversationId, loadLatest]);

  const handleMenuClose = React.useCallback(() => {
    setMenuModalVisible(false);
  }, []);

  const handleInputPress = React.useCallback(() => {
    // Check if conversation is blocked
    if (isConversationBlocked) {
      setShowMessageRestrictionModal(true);
      return;
    }
    // Check if conversation is in requested status and user is not the artist
    if (conv?.status === "REQUESTED" && user?.id !== conv?.artistId) {
      setShowMessageRestrictionModal(true);
      return;
    }
  }, [isConversationBlocked, conv?.status, conv?.artistId, user?.id]);

  const handleCloseRestrictionModal = React.useCallback(() => {
    setShowMessageRestrictionModal(false);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: any) => (
      <MessageItem
        item={item}
        index={index}
        currentUserId={user?.id}
        peerAvatar={peer?.avatar}
      />
    ),
    [user?.id, peer?.avatar]
  );

  return (
    <LinearGradient
      colors={["#000000", "#0F0202"]}
      start={{ x: 0.4, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={{
        flex: 1,
      }}
    >
      {/* Header - avatar + name + actions */}
      <View
        className="bg-tat-darkMaroon border-gray"
        style={{
          paddingHorizontal: s(16),
          paddingTop: mvs(20),
          paddingBottom: mvs(16),
          borderBottomWidth: mvs(0.5),
        }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-full bg-foreground/20 items-center justify-center"
          >
            <SVGIcons.CircleChevronRIght width={s(34)} height={s(34)} />
          </TouchableOpacity>
          {loadingPeer ? (
            <View
              className="flex-row items-center"
              style={{
                gap: s(12),
              }}
            >
              {/* Avatar Skeleton */}
              <View
                className="rounded-full bg-gray/20"
                style={{
                  width: s(36),
                  height: s(36),
                }}
              />
              {/* Name Skeleton */}
              <View
                className="bg-gray/20 rounded"
                style={{
                  width: s(120),
                  height: mvs(16),
                }}
              />
            </View>
          ) : (
            <TouchableOpacity
              className="flex-row items-center"
              style={{
                gap: s(12),
              }}
              onPress={() => {
                if (peer?.id) {
                  router.push(`/user/${peer.id}` as any);
                }
              }}
            >
              <View className="relative">
                <Image
                  source={{
                    uri:
                      peer?.avatar ||
                      `https://api.dicebear.com/7.x/initials/png?seed=${peer?.name?.split(" ")[0] || "User"}`,
                  }}
                  className="rounded-full"
                  style={{
                    width: s(36),
                    height: s(36),
                  }}
                />
                {/* Online status indicator */}
                {peer?.id && (
                  <View
                    className={`rounded-full absolute right-0 top-0 ${onlineUserIds?.[peer.id] ? "bg-success" : "bg-error"}`}
                    style={{
                      width: s(10),
                      height: s(10),
                      borderWidth: s(1),
                      borderColor: "#0F0202",
                    }}
                  />
                )}
                {isConversationBlocked && (
                  <View
                    className="absolute top-0 left-0 rounded-full bg-black/50 items-center justify-center"
                    style={{
                      width: s(36),
                      height: s(36),
                    }}
                  >
                    <SVGIcons.Locked width={s(16)} height={s(16)} />
                  </View>
                )}
              </View>

              <ScaledText
                variant="md"
                className="text-foreground font-montserratMedium"
              >
                {TrimText(peer?.name || "Utente", 18)}
              </ScaledText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setMenuModalVisible(true)}
            className="rounded-full  items-end justify-center"
            style={{
              width: s(32),
              height: s(32),
            }}
          >
            <SVGIcons.CircleMenu width={s(20)} height={s(20)} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={
          Platform.OS === "ios"
            ? insets.top // header height
            : insets.top
        }
      >
        <View style={{ flex: 1 }}>
          {isLoadingOlder && (
            <View
              style={{
                paddingVertical: mvs(12),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <SVGIcons.Loading width={s(20)} height={s(20)} />
              </Animated.View>
            </View>
          )}
          {messages.length === 0 && (
            <View
              className="absolute inset-0 items-center justify-center z-10 w-full h-full"
              style={{
                paddingHorizontal: s(24),
              }}
              pointerEvents="none"
            >
              <ScaledText
                variant="md"
                className="text-gray text-center font-montserratMedium"
              >
                Cronologia della chat eliminata.{"\n"}I nuovi messaggi verranno
                mostrati qui.
              </ScaledText>
            </View>
          )}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item: any) => item.id}
            renderItem={renderItem}
            inverted={true}
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            onEndReached={() => {
              if (conversationId && user?.id && !isLoadingOlder) {
                setIsLoadingOlder(true);
                isLoadingOlderRef.current = true;
                loadOlder(conversationId, user.id).finally(() => {
                  isLoadingOlderRef.current = false;
                  setIsLoadingOlder(false);
                });
              }
            }}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{
              paddingVertical: mvs(1),
            }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={10}
            initialNumToRender={15}
            ListFooterComponent={() =>
              conv?.status === "REQUESTED" && user?.id === conv?.artistId ? (
                <View
                  className="bg-[#2A0F10] border-b border-foreground/10"
                  style={{
                    paddingHorizontal: s(16),
                    paddingVertical: mvs(12),
                  }}
                >
                  <ScaledText
                    variant="md"
                    className="text-foreground font-montserratMedium"
                    style={{
                      marginBottom: mvs(12),
                    }}
                  >
                    Hai ricevuto una richiesta privata. Accetta per iniziare a
                    chattare.
                  </ScaledText>
                  <View
                    className="flex-row"
                    style={{
                      gap: s(12),
                    }}
                  >
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          const { acceptConversation } = await import(
                            "@/services/chat.service"
                          );
                          await acceptConversation(user!.id, conversationId!);
                          const c = await fetchConversationByIdWithPeer(
                            user!.id,
                            conversationId!
                          );
                          setConv(c);
                        } catch {}
                      }}
                      className="flex-1 rounded-full bg-primary items-center justify-center"
                      style={{
                        paddingVertical: mvs(10.5),
                      }}
                    >
                      <ScaledText
                        variant="md"
                        className="text-white font-neueBold"
                      >
                        Accetta
                      </ScaledText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          const { rejectConversation } = await import(
                            "@/services/chat.service"
                          );
                          await rejectConversation(user!.id, conversationId!);
                          const c = await fetchConversationByIdWithPeer(
                            user!.id,
                            conversationId!
                          );
                          setConv(c);
                        } catch {}
                      }}
                      className="flex-1 rounded-full border border-foreground/30 items-center justify-center"
                      style={{
                        paddingVertical: mvs(10.5),
                      }}
                    >
                      <ScaledText
                        variant="md"
                        className="text-foreground font-neueBold"
                      >
                        Rifiuta
                      </ScaledText>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null
            }
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
          />

          {/* Composer pill (disabled until accepted for the lover) */}
          <View
            style={{
              paddingHorizontal: s(16),
              paddingTop: mvs(8),
            }}
          >
            {/* File Preview */}
            {selectedFile && (
              <View
                className="flex-row items-center rounded-full border border-gray/40 mb-2"
                style={{
                  paddingHorizontal: s(12),
                  paddingVertical: mvs(8),
                }}
              >
                <View
                  className="bg-primary/20 rounded items-center justify-center"
                  style={{
                    width: s(40),
                    height: s(40),
                    marginRight: s(12),
                  }}
                >
                  <ScaledText variant="lg" className="text-primary">
                    📎
                  </ScaledText>
                </View>
                <View className="flex-1">
                  <ScaledText
                    variant="md"
                    numberOfLines={1}
                    className="text-foreground font-neueMedium"
                  >
                    {selectedFile.name}
                  </ScaledText>
                  <ScaledText variant="sm" className="text-foreground/60">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </ScaledText>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedFile(null)}
                  style={{
                    padding: s(8),
                  }}
                >
                  <SVGIcons.Close width={s(16)} height={s(16)} />
                </TouchableOpacity>
              </View>
            )}

            <View
              className="flex-row items-end border border-gray/40 mb-2"
              style={{
                paddingVertical: mvs(2),
                paddingHorizontal: s(8),
                borderRadius: s(24),
              }}
            >
              <TouchableOpacity
                onPress={handlePickFile}
                disabled={isInputDisabled}
                style={{
                  marginRight: s(4),
                  paddingBottom: mvs(10),
                  opacity: isInputDisabled ? 0.4 : 1,
                }}
              >
                <SVGIcons.Attachment width={s(20)} height={s(20)} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={handleInputPress}
                disabled={!isInputDisabled}
              >
                <View pointerEvents={isInputDisabled ? "none" : "auto"}>
                  <ScaledTextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="Scrivi il tuo messaggio qui..."
                    className="text-foreground"
                    containerClassName="bg-transparent"
                    multiline={true}
                    textAlignVertical="top"
                    containerStyle={{
                      width: "100%",
                    }}
                    style={{
                      maxHeight: mvs(110),
                      minHeight: mvs(20),
                      backgroundColor: "#140404",
                    }}
                    editable={!isInputDisabled}
                    scrollEnabled={true}
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isInputDisabled}
                onPress={handleSend}
                className="items-center justify-center rounded-full"
                style={{
                  paddingBottom: mvs(4),
                  width: s(32),
                  height: s(32),
                }}
              >
                {uploading ? (
                  <View
                    className="items-center justify-center"
                    style={{
                      width: s(20),
                      height: s(20),
                    }}
                  >
                    <SVGIcons.Loading
                      width={s(20)}
                      height={s(20)}
                      color="animate-spin"
                    />
                  </View>
                ) : (
                  <SVGIcons.Send width={s(32)} height={s(32)} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Menu Modals */}
      <ConversationMenuModals
        visible={menuModalVisible}
        onClose={handleMenuClose}
        peerUsername={peerUsername}
        onReport={handleReport}
        onBlock={handleBlock}
        onDelete={handleDelete}
      />

      {/* Message Restriction Modal */}
      <Modal
        visible={showMessageRestrictionModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseRestrictionModal}
      >
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <View
            className="bg-[#fff] rounded-xl"
            style={{
              width: s(342),
              paddingHorizontal: s(24),
              paddingVertical: mvs(32),
            }}
          >
            {/* Warning Icon */}
            <View className="items-center" style={{ marginBottom: mvs(16) }}>
              <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
            </View>

            {/* Title */}
            <ScaledText
              allowScaling={false}
              variant="lg"
              className="text-background font-neueBold text-center"
              style={{ marginBottom: mvs(4) }}
            >
              {isConversationBlocked
                ? "La conversazione è bloccata"
                : "Richiesta in sospeso"}
            </ScaledText>

            {/* Subtitle */}
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-background font-montserratMedium text-center"
              style={{ marginBottom: mvs(18) }}
            >
              {isConversationBlocked
                ? "Non puoi inviare messaggi in una conversazione bloccata."
                : "Non puoi inviare messaggi finché l'artista non accetta la tua richiesta."}
            </ScaledText>

            {/* Action Button */}
            <View className="flex-row justify-center">
              <TouchableOpacity
                onPress={handleCloseRestrictionModal}
                className="rounded-full items-center justify-center bg-primary"
                style={{
                  paddingVertical: mvs(8),
                  paddingLeft: s(24),
                  paddingRight: s(24),
                }}
              >
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground font-montserratSemibold"
                >
                  OK
                </ScaledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
