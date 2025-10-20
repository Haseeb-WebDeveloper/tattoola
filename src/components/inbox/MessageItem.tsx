import { SVGIcons } from "@/constants/svg";
import React from "react";
import { Image, Text, View } from "react-native";
import {
  formatDividerLabel,
  isIntakeMessage,
  shouldShowDivider,
} from "../../utils/utils";

type Props = {
  item: any;
  index: number;
  messages: any[];
  currentUserId?: string;
  peerAvatar?: string;
};

export default function MessageItem({
  item,
  index,
  messages,
  currentUserId,
  peerAvatar,
}: Props) {
  const isMine = item.senderId === currentUserId;
  const prev = index > 0 ? messages[index - 1] : null;
  const showDivider = shouldShowDivider(
    prev?.createdAt,
    item?.createdAt,
    index
  );
  const showAvatar =
    !isMine && (index === 0 || (prev && prev.senderId === currentUserId));

  // Intake messages should use same UI as normal messages; we'll only center text if truly system-only without bubble
  const renderBubble = () => {
    if (item.mediaUrl) {
      {console.log("item.mediaUrl", item)}
      return (
        <View
          className="rounded-2xl overflow-hidden border border-foreground/10 "
          style={{ maxWidth: "80%" }}
        >
          <Image
            source={{ uri: item.mediaUrl }}
            resizeMode="cover"
            className="w-full h-fit aspect-square"
          />
        </View>
      );
    }
    return (
      <View
        className={`${isMine ? "bg-primary" : "bg-gray-foreground"} px-5 py-4 rounded-2xl max-w-[82%]`}
      >
        <Text className={`${isMine ? "text-white" : "text-foreground"}`}>
          {item.content}
        </Text>
      </View>
    );
  };

  // If a strict system message with no media and no content for bubble, center it
  const isStrictSystem =
    isIntakeMessage(item) && !item.mediaUrl && !item.contentBubble;


  return (
    <View className="px-4">
      {showDivider && (
        <View className="items-center my-2">
          <Text className="text-foreground/70 text-[12px]">
            {formatDividerLabel(item.createdAt)}
          </Text>
        </View>
      )}
      {isStrictSystem ? (
        <View
          className={`px-4 my-2 w-full ${isMine ? "items-end" : "items-start"}`}
        >
          {renderBubble()}
          {!!item.createdAt && (
            <Text className="text-foreground/70 text-[12px] mt-2">
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </View>
      ) : (
        <View
          className={`px-4 my-2 w-full ${isMine ? "items-end" : "items-start"}`}
        >
          {renderBubble()}
          {!!item.createdAt && (
            <View className="flex-row items-center gap-1 mt-2">
              <Text className="text-foreground/70 text-[12px]">
                {new Date(item.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {/* Only show read/unread icon for messages sent by current user */}
              {isMine && (
                <View className="w-3 h-3">
                  {item.receiptStatus === 'READ' ? (
                    <SVGIcons.Seen className="w-3 h-3" />
                  ) : (
                    <SVGIcons.Unseen className="w-3 h-3" />
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      )}
      {!isMine && showAvatar && !!peerAvatar && (
        <Image
          source={{ uri: peerAvatar }}
          className="w-6 h-6 rounded-full ml-3 -mt-2"
        />
      )}
    </View>
  );
}
