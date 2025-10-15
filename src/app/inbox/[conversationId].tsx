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
  const messagesByConv = useChatThreadStore((s) => s.messagesByConv);

  const [text, setText] = useState("");
  const [peer, setPeer] = useState<{ name?: string; avatar?: string } | null>(null);
  const [conv, setConv] = useState<any>(null);
  const listRef = useRef<FlatList>(null);
  const messages = messagesByConv[conversationId || ""] || [];
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (!conversationId) return;
    console.log("ui: mount thread", conversationId);
    loadLatest(conversationId);
    try {
      subscribe(conversationId);
    } catch (e) {
      console.log("ui: subscribe error", e);
    }
    return () => {
      console.log("ui: unmount thread", conversationId);
      try {
        unsubscribe(conversationId);
      } catch (e) {
        console.log("ui: unsubscribe error", e);
      }
    };
  }, [conversationId]);

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

  useEffect(() => {
    if (!conversationId || !user?.id) return;
    markRead(conversationId, user.id);
  }, [conversationId, messages.length]);

  const handleSend = async () => {
    if (!text.trim() || !conversationId || !user?.id) return;
    console.log("ui: send", { text, conversationId, sender: user.id });
    await optimisticSend({
      conversationId,
      senderId: user.id,
      type: "TEXT",
      text: text.trim(),
    });
    setText("");
    listRef.current?.scrollToEnd({ animated: true });
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

  useEffect(() => {
    // Auto-scroll when new messages arrive
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  return (
    <View style={{ flex: 1, backgroundColor: "#1F2124" }}>
      {/* Header - avatar + name + actions */}
      <View
        className="px-4 pt-8 pb-4 bg-tat-darkMaroon border-b border-foreground/10"
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-foreground/20 items-center justify-center">
            <SVGIcons.ChevronLeft className="w-5 h-5" />
          </TouchableOpacity>
          <View className="flex-row items-center gap-3">
            <Image
              source={{ uri: peer?.avatar || "https://via.placeholder.com/40" }}
              className="w-10 h-10 rounded-full"
            />
            <Text className="text-foreground tat-body-1 font-neueBold">{peer?.name || ""}</Text>
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
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          onEndReached={() => conversationId && loadOlder(conversationId)}
          onEndReachedThreshold={0.1}
          contentContainerStyle={{ paddingTop: 12, flexGrow: 1 }}
          ListHeaderComponent={() => (
            conv?.status === "REQUESTED" && user?.id === conv?.artistId ? (
              <View className="px-4 py-3 bg-[#2A0F10] border-b border-foreground/10">
                <Text className="text-foreground tat-body-2-med mb-3">
                  You have received a private request. Accept to start chatting.
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        const { acceptConversation } = await import("@/services/chat.service");
                        await acceptConversation(user!.id, conversationId!);
                        const c = await fetchConversationByIdWithPeer(user!.id, conversationId!);
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
                        const { rejectConversation } = await import("@/services/chat.service");
                        await rejectConversation(user!.id, conversationId!);
                        const c = await fetchConversationByIdWithPeer(user!.id, conversationId!);
                        setConv(c);
                      } catch {}
                    }}
                    className="flex-1 h-11 rounded-full border border-foreground/30 items-center justify-center"
                  >
                    <Text className="text-foreground font-neueBold">Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          )}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
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
            <SVGIcons.Attachment className={`w-5 h-5 mr-2 ${conv?.status === "REQUESTED" && user?.id !== conv?.artistId ? "opacity-40" : ""}`} />
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Hello I’m looking for sketch tattoo"
              placeholderTextColor="#A49A99"
              className="flex-1 text-foreground"
              editable={!(conv?.status === "REQUESTED" && user?.id !== conv?.artistId)}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              returnKeyType="send"
            />
            <TouchableOpacity
              disabled={conv?.status === "REQUESTED" && user?.id !== conv?.artistId}
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
