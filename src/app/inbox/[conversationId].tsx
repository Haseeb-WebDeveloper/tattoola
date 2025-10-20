import MessageItem from "@/components/inbox/MessageItem";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { fetchConversationByIdWithPeer } from "@/services/chat.service";
import { useChatThreadStore } from "@/stores/chatThreadStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
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
    if (!text.trim() || !conversationId || !user?.id) return;
    await optimisticSend({
      conversationId,
      senderId: user.id,
      type: "TEXT",
      text: text.trim(),
    });
    setText("");
    // Inverted list: scroll to index 0 for newest message
    setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
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
        className="px-4 pt-8 pb-4 bg-tat-darkMaroon border-b border-foreground/10"
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-foreground/20 items-center justify-center"
          >
            <SVGIcons.ChevronLeft className="w-5 h-5" />
          </TouchableOpacity>
          <View className="flex-row items-center gap-3">
            <Image
              source={{ uri: peer?.avatar || "https://via.placeholder.com/40" }}
              className="w-10 h-10 rounded-full"
            />
            <Text className="text-foreground tat-body-1 font-neueBold">
              {peer?.name || ""}
            </Text>
          </View>
          <View className="w-9 h-9" />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={(insets?.top || 0) + headerHeight}
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
          contentContainerStyle={{ paddingVertical: 12 }}
          ListFooterComponent={() =>
            conv?.status === "REQUESTED" && user?.id === conv?.artistId ? (
              <View className="px-4 py-3 bg-[#2A0F10] border-b border-foreground/10">
                <Text className="text-foreground tat-body-2-med mb-3">
                  You have received a private request. Accept to start chatting.
                </Text>
                <View className="flex-row gap-3">
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
                    className="flex-1 h-11 rounded-full bg-primary items-center justify-center"
                  >
                    <Text className="text-white font-neueBold">Accept</Text>
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
                    className="flex-1 h-11 rounded-full border border-foreground/30 items-center justify-center"
                  >
                    <Text className="text-foreground font-neueBold">
                      Reject
                    </Text>
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
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: "#1F2124",
          }}
        >
          <View className="flex-row items-center rounded-full border border-foreground/20 px-4 py-3">
            <SVGIcons.Attachment
              className={`w-5 h-5 mr-2 ${conv?.status === "REQUESTED" && user?.id !== conv?.artistId ? "opacity-40" : ""}`}
            />
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Hello I’m looking for sketch tattoo"
              placeholderTextColor="#A49A99"
              className="flex-1 text-foreground"
              editable={
                !(conv?.status === "REQUESTED" && user?.id !== conv?.artistId)
              }
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              returnKeyType="send"
            />
            <TouchableOpacity
              disabled={
                conv?.status === "REQUESTED" && user?.id !== conv?.artistId
              }
              onPress={handleSend}
              className="w-10 h-10 items-center justify-center"
            >
              <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
                <SVGIcons.Send className="w-5 h-5" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
