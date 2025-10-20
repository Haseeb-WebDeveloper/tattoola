import MessageItem from "@/components/inbox/MessageItem";
import ScaledText from "@/components/ui/ScaledText";
import { ScaledTextInput } from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { fetchConversationByIdWithPeer } from "@/services/chat.service";
import cloudinaryService from "@/services/cloudinary.service";
import { useChatThreadStore } from "@/stores/chatThreadStore";
import { ms, mvs, s } from "@/utils/scale";
import { TrimText } from "@/utils/text-trim";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [peer, setPeer] = useState<{ name?: string; avatar?: string } | null>(
    null
  );
  const [conv, setConv] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const listRef = useRef<FlatList>(null);
  const rawMessages = messagesByConv[conversationId || ""] || [];

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
  const [headerHeight, setHeaderHeight] = useState(0);

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
          setPeer({ name: c.peerName, avatar: c.peerAvatar });
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

  const handleSend = async () => {
    if ((!text.trim() && !selectedFile) || !conversationId || !user?.id) return;
    
    setUploading(true);
    try {
      let mediaUrl = undefined;
      
      // Upload file first if selected
      if (selectedFile) {
        const uploadResult = await cloudinaryService.uploadFile(selectedFile, {
          folder: 'tattoola/chat',
          resourceType: 'auto', // Auto-detect file type
        });
        mediaUrl = uploadResult.secureUrl;
      }
      
      setText("");
      setSelectedFile(null);
      
      await optimisticSend({
        conversationId,
        senderId: user.id,
        type: selectedFile ? (selectedFile.mimeType?.startsWith('image/') ? 'IMAGE' : 'FILE') : 'TEXT',
        text: text.trim() || undefined,
        mediaUrl,
      });
     
      // Inverted list: scroll to index 0 for newest message
      listRef.current?.scrollToOffset({ offset: 0, animated: true })
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) return;
      
      const file = result.assets[0];
      
      // Check file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size && file.size > maxSize) {
        alert('File size exceeds 100MB limit. Please choose a smaller file.');
        return;
      }
      
      setSelectedFile(file);
    } catch (error) {
      console.error('Error picking file:', error);
      alert('Failed to pick file. Please try again.');
    }
  };

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
    <View style={{ flex: 1, backgroundColor: "#1F2124" }}>
      {/* Header - avatar + name + actions */}
      <View
        className="bg-tat-darkMaroon border-gray"
        style={{
          paddingHorizontal: s(16),
          paddingTop: mvs(16),
          paddingBottom: mvs(16),
          borderBottomWidth: mvs(0.5),
        }}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
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
              source={{ uri: peer?.avatar || "https://via.placeholder.com/36" }}
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
          <View>
            <SVGIcons.CircleMenu width={s(20)} height={s(20)} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
      >
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
          contentContainerStyle={{ paddingVertical: mvs(12) }}
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
                  className="text-foreground font-neueMedium"
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
                      height: mvs(44),
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
                      height: mvs(44),
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
            paddingTop: mvs(12),
            paddingBottom: Platform.OS === "ios" 
              ? Math.max(insets?.bottom || 0, mvs(12)) 
              : mvs(12),
            backgroundColor: "#1F2124",
          }}
        >
          {/* File Preview */}
          {selectedFile && (
            <View
              className="flex-row items-center rounded-lg border border-foreground/20 mb-2"
              style={{
                paddingHorizontal: s(12),
                paddingVertical: mvs(8),
                backgroundColor: "#2A2A2A",
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
            className="flex-row items-center rounded-full border border-foreground/20"
            style={{
              paddingVertical: mvs(8),
              paddingHorizontal: s(8),
            }}
          >
            <TouchableOpacity
              onPress={handlePickFile}
              disabled={uploading || (conv?.status === "REQUESTED" && user?.id !== conv?.artistId)}
              style={{
                marginRight: s(4),
                opacity:
                  uploading || (conv?.status === "REQUESTED" && user?.id !== conv?.artistId)
                    ? 0.4
                    : 1,
              }}
            >
              <SVGIcons.Attachment width={s(20)} height={s(20)} />
            </TouchableOpacity>
            <ScaledTextInput
              value={text}
              onChangeText={setText}
              placeholder="Hello I'm looking for sketch tattoo"
              placeholderTextColor="#A49A99"
              className="flex-1 text-foreground"
              containerClassName="bg-transparent"
              containerStyle={{
                flex: 1,
              }}
              style={{
                fontSize: ms(14),
                lineHeight: mvs(17),
                paddingHorizontal: s(8),
                paddingVertical: mvs(10),
              }}
              editable={
                !uploading && !(conv?.status === "REQUESTED" && user?.id !== conv?.artistId)
              }
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              returnKeyType="send"
            />
            <TouchableOpacity
              disabled={
                uploading || (conv?.status === "REQUESTED" && user?.id !== conv?.artistId)
              }
              onPress={handleSend}
              className="items-center justify-center rounded-full p-0"
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <SVGIcons.Send width={s(36)} height={s(36)} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
