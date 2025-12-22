import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthRequiredStore } from "@/stores/authRequiredStore";
import { useChatInboxStore } from "@/stores/chatInboxStore";
import { usePresenceStore } from "@/stores/presenceStore";
import { formatMessageTime } from "@/utils/formatMessageTime";
import { mvs, s } from "@/utils/scale";
import { TrimText } from "@/utils/text-trim";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
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
  // Search is temporarily disabled in the UI, but the state is kept
  // so it can be re-enabled easily in the future.
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const conversationsById = useChatInboxStore((s) => s.conversationsById);
  const order = useChatInboxStore((s) => s.order);
  const loadFirstPage = useChatInboxStore((s) => s.loadFirstPage);
  const loadMore = useChatInboxStore((s) => s.loadMore);
  const startRealtime = useChatInboxStore((s) => s.startRealtime);
  const stopRealtime = useChatInboxStore((s) => s.stopRealtime);

  // Show auth modal for anonymous users only when this tab is focused
  useFocusEffect(
    useCallback(() => {
      if (!user) {
        useAuthRequiredStore.getState().show("Sign in to access your messages");
      }
      // Cleanup not needed as modal will be dismissed by user action
    }, [user])
  );

  // Do not early-return; keep hooks consistent across renders
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);

  // Debounce search query for better performance
  // NOTE: Even though the search bar is hidden, we keep this logic
  // so that re-enabling it is trivial.
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

  useEffect(() => {
    if (!user?.id) return;
    startRealtime(user.id);
    return () => stopRealtime();
  }, [user?.id]);

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

  // Memoized conversation item component for better performance
  const ConversationItem = memo(
    ({ item, onlineUserIds, router }: any) => {
      const showPresence = item.status !== "BLOCKED";
      const isOnline = showPresence ? onlineUserIds?.[item.peerId] : false;

      return (
        <TouchableOpacity
          onPress={() => router.push(`/inbox/${item.id}` as any)}
          className=" border-gray"
          style={{
            paddingHorizontal: s(16),
            paddingVertical: mvs(16),
            borderBottomWidth: mvs(0.5),
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
                  uri:
                    item.peerAvatar ||
                    `https://api.dicebear.com/7.x/initials/png?seed=${item.peerName?.split(" ")[0]}`,
                }}
                className="rounded-full"
                style={{
                  width: s(40),
                  height: s(40),
                }}
              />
              {showPresence && (
                <View
                  className={`rounded-full absolute right-0 top-0 ${isOnline ? "bg-success" : "bg-error"}`}
                  style={{
                    width: s(10),
                    height: s(10),
                    borderWidth: s(1),
                    borderColor: "#0F0202",
                  }}
                />
              )}
              {/* Lock icon overlay for blocked conversations */}
              {item.status === "BLOCKED" && (
                <View
                  className="absolute top-0 left-0 items-center justify-center rounded-full bg-black/50"
                  style={{
                    width: s(40),
                    height: s(40),
                  }}
                >
                  <SVGIcons.Locked width={s(16)} height={s(16)} />
                </View>
              )}
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
                  {TrimText(item.peerName || "Sconosciuto", 23)}
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
              <View className="flex-row items-center justify-between">
                <ScaledText
                  variant="md"
                  numberOfLines={1}
                  className="flex-1 text-gray font-neueMedium"
                  style={{
                    marginRight: s(8),
                  }}
                >
                  {TrimText(item.lastMessageText || "Nuova conversazione", 50)}
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
      );
    },
    (prevProps, nextProps) => {
      // Custom comparison: only re-render if relevant props changed
      return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.peerName === nextProps.item.peerName &&
        prevProps.item.peerAvatar === nextProps.item.peerAvatar &&
        prevProps.item.lastMessageText === nextProps.item.lastMessageText &&
        prevProps.item.lastMessageTime === nextProps.item.lastMessageTime &&
        prevProps.item.lastMessageIsRead === nextProps.item.lastMessageIsRead &&
        prevProps.item.unreadCount === nextProps.item.unreadCount &&
        prevProps.item.status === nextProps.item.status &&
        prevProps.onlineUserIds?.[prevProps.item.peerId] ===
          nextProps.onlineUserIds?.[nextProps.item.peerId]
      );
    }
  );

  ConversationItem.displayName = "ConversationItem";

  const renderConversationItem = useCallback(
    ({ item }: any) => (
      <ConversationItem
        item={item}
        onlineUserIds={onlineUserIds}
        router={router}
      />
    ),
    [onlineUserIds, router]
  );

  // Memoized empty component
  const renderEmptyComponent = useCallback(() => {
    const hasSearchQuery = debouncedQuery.trim().length > 0;

    return (
      <View
        className="items-center justify-center flex-1"
        style={{
          paddingVertical: mvs(80),
          paddingHorizontal: s(24),
        }}
      >
        <ScaledText
          variant="md"
          className="text-center text-gray font-montserratMedium"
        >
          {hasSearchQuery
            ? `Nessuna conversazione trovata per "${debouncedQuery.trim()}"`
            : "Nessuna conversazione ancora.\nInvia una richiesta per iniziare!"}
        </ScaledText>
        {hasSearchQuery && (
          <ScaledText
            variant="md"
            className="text-center text-foreground/50"
            style={{
              marginTop: mvs(8),
            }}
          >
            Prova a cercare un nome o un messaggio diverso
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
      style={{
        flex: 1,
      }}
    >
      {/* Header */}
      <View
        className="flex-row items-center justify-between"
        style={{
          paddingTop: mvs(8),
          paddingHorizontal: s(16),
          paddingBottom: mvs(28),
        }}
      >
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: s(20),
            height: s(20),
          }}
        >
          {/* <SVGIcons.Flash width={s(20)} height={s(20)} /> */}
        </View>
        <SVGIcons.LogoLight />
        <View className="items-center justify-center rounded-full">
          <View style={{ width: s(20), height: s(20) }} />
          {/* <SVGIcons.Menu width={s(20)} height={s(20)} /> */}
        </View>
      </View>

      {/* Search bar temporarily disabled */}
      {/*
      <View
        style={{
          paddingHorizontal: s(16),
          paddingBottom: mvs(24),
        }}
      >
        <View
          className="relative flex-row items-center rounded-full bg-gray-foreground"
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
            placeholder="Cerca conversazioni..."
            className="w-full text-foreground"
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
              className="absolute opacity-50 bg-gray-foreground"
              style={{
                right: s(12),
              }}
            >
              <SVGIcons.Close width={s(14)} height={s(14)} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      */}

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
        initialNumToRender={15}
      />
    </LinearGradient>
  );
}
