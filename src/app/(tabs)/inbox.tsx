import ScaledText from "@/components/ui/ScaledText";
import { ScaledTextInput } from "@/components/ui/ScaledTextInput";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { useChatInboxStore } from "@/stores/chatInboxStore";
import { usePresenceStore } from "@/stores/presenceStore";
import { formatMessageTime } from "@/utils/formatMessageTime";
import { ms, mvs, s } from "@/utils/scale";
import { TrimText } from "@/utils/text-trim";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Image, TouchableOpacity, View } from "react-native";


// Normalize search query: trim whitespace and convert to lowercase
const normalizeSearchTerm = (text: string): string => {
  return text.trim().toLowerCase();
};

// Search function: checks multiple fields for matches
const matchesSearch = (conversation: any, searchTerm: string): boolean => {
  if (!searchTerm) return true; // No search term = show all

  const normalizedSearch = normalizeSearchTerm(searchTerm);

  // Search in peer name
  const peerName = normalizeSearchTerm(conversation.peerName || "");
  if (peerName.includes(normalizedSearch)) return true;

  // Search in last message text
  const lastMessageText = normalizeSearchTerm(
    conversation.lastMessageText || ""
  );
  if (lastMessageText.includes(normalizedSearch)) return true;

  return false;
};

export default function InboxScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const conversationsById = useChatInboxStore((s) => s.conversationsById);
  const order = useChatInboxStore((s) => s.order);
  const loadFirstPage = useChatInboxStore((s) => s.loadFirstPage);
  const loadMore = useChatInboxStore((s) => s.loadMore);
  const startRealtime = useChatInboxStore((s) => s.startRealtime);
  const stopRealtime = useChatInboxStore((s) => s.stopRealtime);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!user?.id) return;
    loadFirstPage(user.id);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return () => {};
      loadFirstPage(user.id);
      startRealtime(user.id);
      return () => stopRealtime();
    }, [user?.id])
  );

  // Memoized filtered data - only recalculates when dependencies change
  const filteredData = useMemo(() => {
    const allConversations = order
      .map((id) => conversationsById[id])
      .filter(Boolean);

    // If no search query, return all conversations
    if (!debouncedQuery.trim()) return allConversations;

    // Filter based on search
    return allConversations.filter((c: any) =>
      matchesSearch(c, debouncedQuery)
    );
  }, [order, conversationsById, debouncedQuery]);

  // Memoized render item for better FlatList performance
  const renderConversationItem = useCallback(
    ({ item }: any) => (
      <TouchableOpacity
        onPress={() => router.push(`/inbox/${item.id}` as any)}
        className=" border-gray"
        style={{
          paddingHorizontal: s(16),
          paddingVertical: mvs(16),
          borderBottomWidth: mvs(1),
        }}
      >
        <View className="flex-row items-center">
          {/* Avatar */}
          <View
            className="relative"
            style={{
              marginRight: s(12),
            }}
          >
            <Image
              source={{
                uri: item.peerAvatar || "https://via.placeholder.com/40",
              }}
              className="rounded-full"
              style={{
                width: s(40),
                height: s(40),
              }}
            />
            <View
              className={`rounded-full absolute right-0 top-0 ${onlineUserIds?.[item.peerId] ? "bg-success" : "bg-error"}`}
              style={{
                width: s(10),
                height: s(10),
                borderWidth: s(1),
                borderColor: "#0F0202",
              }}
            />
          </View>
          <View className="flex-1">
            {/* name and unread badge */}
            <View
              className="flex-row items-center justify-between"
              style={{
                marginBottom: mvs(1),
              }}
            >
              <ScaledText
                variant="md"
                className="text-foreground font-montserratMedium"
              >
                {TrimText(item.peerName || "Unknown", 23)}
              </ScaledText>
              <View className="flex-row items-center">
                {item.unreadCount > 0 && (
                  <View
                    className="rounded-full bg-[#590707] items-center justify-center"
                    style={{
                      width: s(24),
                      height: s(24),
                    }}
                  >
                    <ScaledText
                      variant="11"
                      className="text-[#fff] font-neueMedium"
                    >
                      {item.unreadCount}
                    </ScaledText>
                  </View>
                )}
              </View>
            </View>
            {/* last message text and time */}
            <View className="flex-row justify-between items-center">
              <ScaledText
                variant="md"
                numberOfLines={1}
                className="text-gray flex-1 font-neueMedium"
                style={{
                  marginRight: s(8),
                }}
              >
                  {TrimText(item.lastMessageText || "New conversation", 50)}
              </ScaledText>
              {item.lastMessageTime && (
                <View
                  className="flex-row items-center"
                  style={{
                    gap: s(4),
                  }}
                >
                  <View
                    style={{
                      width: s(16),
                      height: s(16),
                    }}
                  >
                    {item.lastMessageIsRead ? (
                      <SVGIcons.Seen width={s(16)} height={s(16)} />
                    ) : (
                      <SVGIcons.Unseen width={s(16)} height={s(16)} />
                    )}
                  </View>
                  <ScaledText
                    numberOfLines={1}
                    variant="sm"
                    className="text-gray"
                  >
                    {formatMessageTime(item.lastMessageTime)}
                  </ScaledText>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [router, onlineUserIds]
  );

  // Memoized empty component
  const renderEmptyComponent = useCallback(() => {
    const hasSearchQuery = debouncedQuery.trim().length > 0;

    return (
      <View
        className="flex-1 items-center justify-center"
        style={{
          paddingVertical: mvs(80),
          paddingHorizontal: s(24),
        }}
      >
        <ScaledText variant="lg" className="text-foreground/70 text-center">
          {hasSearchQuery
            ? `No conversations found for "${debouncedQuery.trim()}"`
            : "No conversations yet"}
        </ScaledText>
        {hasSearchQuery && (
          <ScaledText
            variant="md"
            className="text-foreground/50 text-center"
            style={{
              marginTop: mvs(8),
            }}
          >
            Try searching for a different name or message
          </ScaledText>
        )}
      </View>
    );
  }, [debouncedQuery]);

  return (
    <LinearGradient
      colors={["#000000", "#0F0202"]}
      start={{ x: 0.4, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      className="flex-1"
    >
      {/* Header */}
      <View
        className="flex-row items-center justify-between"
        style={{
          paddingHorizontal: s(20),
          paddingTop: mvs(16),
          paddingBottom: mvs(24),
        }}
      >
        <View className="rounded-full items-center justify-center">
          <SVGIcons.Flash width={s(20)} height={s(20)} />
        </View>
        <SVGIcons.LogoLight />
        <View className="rounded-full items-center justify-center">
          <SVGIcons.Menu width={s(20)} height={s(20)} />
        </View>
      </View>

      {/* Search */}
      <View
        style={{
          paddingHorizontal: s(16),
          paddingBottom: mvs(24),
        }}
      >
        <View
          className="flex-row items-center rounded-full relative"
          style={{
            paddingHorizontal: s(12),
            paddingVertical: mvs(0),
            borderWidth: 1,
            borderColor: "#A49A99",
            borderRadius: s(62),
          }}
        >
          <SVGIcons.Search width={s(18)} height={s(18)} />
          <ScaledTextInput
            placeholder="Search conversations..."
            placeholderTextColor="#A49A99"
            className="text-foreground"
            value={query}
            onChangeText={setQuery}
            style={{
              fontSize: ms(14),
              lineHeight: mvs(17),
              fontWeight: "400",
            }}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              className="absolute opacity-50"
              style={{
                right: s(12),
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <SVGIcons.Close width={s(14)} height={s(14)} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item: any) => item.id}
        renderItem={renderConversationItem}
        onEndReached={() =>
          !debouncedQuery.trim() && user?.id && loadMore(user.id)
        }
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmptyComponent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
      />
    </LinearGradient>
  );
}
