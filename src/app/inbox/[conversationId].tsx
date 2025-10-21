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
import { ms, mvs, s } from "@/utils/scale";
import { TrimText } from "@/utils/text-trim";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
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
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const listRef = useRef<FlatList>(null);
  const rawMessages = messagesByConv[conversationId || ""] || [];

  // Memoize peer username for modal
  const peerUsername = React.useMemo(() => {
    return peer?.username || `${peer?.name || ""}`.trim() || "User";
  }, [peer?.username, peer?.name]);

  // Deduplicate messages by ID (safety check)
  // Reverse array for inverted FlatList (newest at index 0 = bottom of screen)
  const messages = React.useMemo(() => {
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
  }, [rawMessages]);

  const insets = useSafeAreaInsets();
  const prevMessageCountRef = useRef<number>(0);

  useEffect(() => {
    if (!conversationId || !user?.id) return;
    console.log("ui: mount thread", conversationId);

    // Load messages first, THEN subscribe to prevent race condition
    (async () => {
      try {
        await loadLatest(conversationId, user.id);
        console.log("ui: messages loaded, now subscribing");
        subscribe(conversationId, user.id);
      } catch (e) {
        console.log("ui: load/subscribe error", e);
      }
    })();

    return () => {
      console.log("ui: unmount thread", conversationId);
      try {
        unsubscribe(conversationId);
      } catch (e) {
        console.log("ui: unsubscribe error", e);
      }
    };
  }, [conversationId, user?.id]);

  useEffect(() => {
    (async () => {
      if (!conversationId || !user?.id) return;
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
      } catch {}
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

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length === 0) return;

    // Check if we have a new message (message count increased)
    const hasNewMessage = messages.length > prevMessageCountRef.current;

    if (hasNewMessage && prevMessageCountRef.current > 0) {
      // Auto-scroll to newest message (bottom of chat)
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

    // Update the ref with current message count
    prevMessageCountRef.current = messages.length;
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
      toast.error("Failed to send message");
    } finally {
      if (hasFile) {
        setUploading(false);
      }
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      // Check file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size && file.size > maxSize) {
        toast.error("File Too Large");
        return;
      }

      setSelectedFile(file);
    } catch (error) {
      console.error("Error picking file:", error);
      toast.error("Failed to pick file");
    }
  };

  const handleReport = React.useCallback(async (reason: string) => {
    if (!user?.id || !peer?.id || !conversationId) return;
    try {
      await reportUser(user.id, peer.id, conversationId, reason);
      toast.success("Report Submitted");
    } catch (error) {
      console.error("Error reporting user:", error);
      toast.error("Failed to submit report");
    }
  }, [user?.id, peer?.id, conversationId]);

  const handleBlock = React.useCallback(async () => {
    if (!user?.id || !peer?.id || !conversationId) return;
    try {
      console.log("ui: blocking user", user.id, peer.id, conversationId);
      await blockUser(user.id, peer.id, conversationId);
      toast.success("User Blocked");
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to block user");
    }
  }, [user?.id, peer?.id, conversationId]);

  const handleDelete = React.useCallback(async () => {
    if (!user?.id || !conversationId) return;
    try {
      await deleteConversation(conversationId, user.id);
      toast.success("Chat Deleted");
      // Reload messages to apply deletedAt filter (will hide old messages)
      await loadLatest(conversationId, user.id);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  }, [user?.id, conversationId, loadLatest]);

  const handleMenuClose = React.useCallback(() => {
    setMenuModalVisible(false);
  }, []);

  const renderItem = ({ item, index }: any) => (
    <MessageItem
      item={item}
      index={index}
      messages={messages}
      currentUserId={user?.id}
      peerAvatar={peer?.avatar}
    />
  );

  return (
    <LinearGradient
      colors={["#000000", "#0F0202"]}
      start={{ x: 0.4, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      className="flex-1"
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
          <View
            className="flex-row items-center"
            style={{
              gap: s(12),
            }}
          >
            <Image
              source={{
                uri:
                  peer?.avatar ||
                  `https://api.dicebear.com/7.x/initials/png?seed=${peer?.name?.split(" ")[0]}`,
              }}
              className="rounded-full"
              style={{
                width: s(36),
                height: s(36),
              }}
            />
            <ScaledText
              variant="md"
              className="text-foreground font-montserratMedium"
            >
              {TrimText(peer?.name || "", 18)}
            </ScaledText>
          </View>
          <TouchableOpacity onPress={() => setMenuModalVisible(true)} className="rounded-full  items-end justify-center"
            style={{
              width: s(32),
              height: s(32),
            }}
            >
            <SVGIcons.CircleMenu width={s(20)} height={s(20)} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
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
              Chat history deleted.{'\n'}New messages will appear here.
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
          onEndReached={() =>
            conversationId && user?.id && loadOlder(conversationId, user.id)
          }
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ 
            paddingVertical: mvs(1),
          }}
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
                  You have received a private request. Accept to start chatting.
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
                      Accept
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
                      Reject
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
            paddingBottom:
              Platform.OS === "ios"
                ? Math.max(insets?.bottom || 0, mvs(8))
                : mvs(8),
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
              disabled={
                uploading ||
                (conv?.status === "REQUESTED" && user?.id !== conv?.artistId)
              }
              style={{
                marginRight: s(4),
                paddingBottom: mvs(10),
                opacity:
                  uploading ||
                  (conv?.status === "REQUESTED" && user?.id !== conv?.artistId)
                    ? 0.4
                    : 1,
              }}
            >
              <SVGIcons.Attachment width={s(20)} height={s(20)} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <ScaledTextInput
                value={text}
                onChangeText={setText}
                placeholder="Hello I'm looking for sketch tattoo"
                placeholderTextColor="#A49A99"
                className="text-foreground"
                containerClassName="bg-transparent"
                multiline={true}
                textAlignVertical="top"
                containerStyle={{
                  width: "100%",
                }}
                style={{
                  fontSize: ms(14),
                  lineHeight: mvs(20),
                  fontWeight: "600",
                  paddingHorizontal: s(8),
                  paddingTop: mvs(10),
                  paddingBottom: mvs(10),
                  maxHeight: mvs(110),
                  minHeight: mvs(40),
                  backgroundColor: "#140404",
                }}
                editable={
                  !uploading &&
                  !(conv?.status === "REQUESTED" && user?.id !== conv?.artistId)
                }
                scrollEnabled={true}
              />
            </View>
            <TouchableOpacity
              disabled={
                uploading ||
                (conv?.status === "REQUESTED" && user?.id !== conv?.artistId)
              }
              onPress={handleSend}
              className="items-center justify-center rounded-full"
              style={{
                paddingBottom: mvs(4),
              }}
            >
              {uploading ? (
                <SVGIcons.Loading
                  width={s(20)}
                  height={s(20)}
                  color="animate-spin"
                  style={{
                    paddingBottom: mvs(4),
                  }}
                />
              ) : (
                <SVGIcons.Send width={s(32)} height={s(32)} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Menu Modals */}
      <ConversationMenuModals
        visible={menuModalVisible}
        onClose={handleMenuClose}
        peerUsername={peerUsername}
        onReport={handleReport}
        onBlock={handleBlock}
        onDelete={handleDelete}
      />
    </LinearGradient>
  );
}
