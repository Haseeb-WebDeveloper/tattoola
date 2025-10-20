import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { useChatInboxStore } from "@/stores/chatInboxStore";
import { usePresenceStore } from "@/stores/presenceStore";
import { formatMessageTime } from "@/utils/formatMessageTime";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function InboxScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const conversationsById = useChatInboxStore((s) => s.conversationsById);
  const order = useChatInboxStore((s) => s.order);
  const loadFirstPage = useChatInboxStore((s) => s.loadFirstPage);
  const loadMore = useChatInboxStore((s) => s.loadMore);
  const startRealtime = useChatInboxStore((s) => s.startRealtime);
  const stopRealtime = useChatInboxStore((s) => s.stopRealtime);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);

  useEffect(() => {
    if (!user?.id) return;
    loadFirstPage(user.id);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return () => {};
      console.log("📱 [INBOX] Screen focused, reloading conversations...");
      loadFirstPage(user.id); // Reload conversations when screen is focused
      startRealtime(user.id);
      return () => stopRealtime();
    }, [user?.id])
  );

  const data = order
    .map((id) => conversationsById[id])
    .filter(Boolean)
    .filter((c: any) =>
      query.trim()
        ? (c.peerName || "").toLowerCase().includes(query.trim().toLowerCase())
        : true
    );

  // Debug: Log online users count
  if (Object.keys(onlineUserIds || {}).length > 0) {
    console.log("📱 [INBOX] Online users:", Object.keys(onlineUserIds || {}).length);
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-8 pb-3 flex-row items-center justify-between">
        <Text className="text-foreground tat-heading-3">tattoolà</Text>
        <View className="w-8 h-8" />
      </View>
      {/* Search */}
      <View className="px-4 pb-2">
        <View className="flex-row items-center bg-gray-foreground rounded-full px-4 py-3">
          <SVGIcons.Search className="w-5 h-5 mr-2" />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#A49A99"
            value={query}
            onChangeText={setQuery}
            className="flex-1 text-foreground"
          />
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: any) => (
          <TouchableOpacity
            onPress={() => router.push(`/inbox/${item.id}` as any)}
            className="px-4 py-4 border-b border-foreground/10"
          >
            <View className="flex-row items-center">
              <View className="mr-3 relative">
                <Image
                  source={{
                    uri: item.peerAvatar || "https://via.placeholder.com/56",
                  }}
                  className="w-14 h-14 rounded-full"
                />
                <View
                  className={`w-3 h-3 rounded-full absolute right-0 bottom-0 ${onlineUserIds?.[item.peerId] ? 'bg-success' : 'bg-gray'}`}
                  style={{ borderWidth: 2, borderColor: '#0F0202' }}
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-foreground tat-body-1 font-neueBold">
                    {item.peerName || "Unknown"}
                  </Text>
                  {item.lastMessageTime && (
                    <Text className="text-foreground/60 text-xs">
                      {formatMessageTime(item.lastMessageTime)}
                    </Text>
                  )}
                </View>
                <View className="flex-row items-center justify-between">
                  <Text numberOfLines={1} className="text-foreground/80 flex-1 mr-2">
                    {item.lastMessageText || "New conversation"}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    {/* Show read/unread icon for both users if there's a last message */}
                    {item.lastMessageTime && (
                      <View className="w-4 h-4">
                        {item.lastMessageIsRead ? (
                          <SVGIcons.Seen className="w-4 h-4" />
                        ) : (
                          <SVGIcons.Unseen className="w-4 h-4" />
                        )}
                      </View>
                    )}
                    {item.unreadCount > 0 && (
                      <View className="w-6 h-6 rounded-full bg-error items-center justify-center">
                        <Text className="text-white text-[12px]">
                          {item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        onEndReached={() => user?.id && loadMore(user.id)}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-foreground/70">No conversations yet</Text>
          </View>
        )}
      />
    </View>
  );
}
