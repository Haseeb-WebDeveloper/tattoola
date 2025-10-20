import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { ms, mvs, s } from "@/utils/scale";
import React, { useEffect, useRef } from "react";
import { Animated, Image, View } from "react-native";
import { isIntakeMessage } from "../../utils/utils";

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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const isMine = item.senderId === currentUserId;
  const prev = index > 0 ? messages[index - 1] : null;
  const showAvatar =
    !isMine && (index === 0 || (prev && prev.senderId === currentUserId));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderBubble = () => {
    if (item.mediaUrl) {
      return (
        <View
          className="rounded-2xl overflow-hidden"
          style={{
            maxWidth: "75%",
            borderRadius: s(16),
          }}
        >
          <Image
            source={{ uri: item.mediaUrl }}
            resizeMode="cover"
            style={{
              width: s(280),
              height: s(280),
            }}
          />
        </View>
      );
    }
    
    return (
      <View
        style={{
          backgroundColor: isMine ? "#5C1F1F" : "#404040",
          paddingHorizontal: s(20),
          paddingVertical: mvs(16),
          borderRadius: s(20),
          maxWidth: "75%",
        }}
        className="w-full"
      >
        <ScaledText
          variant="md"
          style={{
            color: "#FFFFFF",
            fontSize: ms(15),
            lineHeight: mvs(22),
            flexWrap: "wrap",
          }}
          className="w-full"
        >
          {item.content}
        </ScaledText>
      </View>
    );
  };

  const isStrictSystem =
    isIntakeMessage(item) && !item.mediaUrl && !item.contentBubble;

  return (
    <View
      style={{
        marginVertical: mvs(6),
      }}
    >
      {isStrictSystem ? (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            flexDirection: "row",
            justifyContent: isMine ? "flex-end" : "flex-start",
            paddingHorizontal: s(16),
          }}
        >
          {renderBubble()}
        </Animated.View>
      ) : (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: isMine ? "flex-end" : "flex-start",
              paddingHorizontal: s(16),
              alignItems: "flex-end",
            }}
          >
            {/* Avatar for received messages */}
            {!isMine && showAvatar && (
              <Image
                source={{ uri: peerAvatar || "https://via.placeholder.com/36" }}
                style={{
                  width: s(36),
                  height: s(36),
                  borderRadius: s(18),
                  marginRight: s(8),
                }}
              />
            )}
            {!isMine && !showAvatar && (
              <View style={{ width: s(44) }} />
            )}

            <View
              style={{
                maxWidth: "75%",
              }}
            >
              {renderBubble()}
              
              {/* Timestamp */}
              {!!item.createdAt && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: mvs(6),
                    gap: s(4),
                    alignSelf: isMine ? "flex-end" : "flex-start",
                  }}
                >
                  <ScaledText
                    variant="sm"
                    style={{
                      color: "#9CA3AF",
                      fontSize: ms(12),
                    }}
                  >
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </ScaledText>
                  
                  {/* Read receipts for sent messages */}
                  {isMine && (
                    <View
                      style={{
                        width: s(12),
                        height: s(12),
                      }}
                    >
                      {item.receiptStatus === "READ" ? (
                        <SVGIcons.Seen width={s(12)} height={s(12)} />
                      ) : (
                        <SVGIcons.Unseen width={s(12)} height={s(12)} />
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}