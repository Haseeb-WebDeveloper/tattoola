import { ChatImageViewer } from "@/components/inbox/ChatImageViewer";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { formatMessageTimestamp } from "@/utils/formatMessageTimestamp";
import { ms, mvs, s } from "@/utils/scale";
import { TrimText } from "@/utils/text-trim";
import React, { useEffect, useState } from "react";
import { Clipboard, Image, Linking, Modal, TouchableOpacity, View } from "react-native";
import { isIntakeMessage } from "../../utils/utils";
import { toast } from "sonner-native";

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
  const [showMenu, setShowMenu] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);


  // Helper to get file name from URL
  const getFileName = (url: string): string => {
    try {
      const urlParts = url.split("/");
      const fileName = urlParts[urlParts.length - 1].split("?")[0];
      return decodeURIComponent(fileName);
    } catch {
      return "file";
    }
  };

  // Helper to get file extension
  const getFileExtension = (url: string): string => {
    try {
      const fileName = getFileName(url);
      const parts = fileName.split(".");
      return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
    } catch {
      return "";
    }
  };

  // Handle copy text
  const handleCopyText = async () => {
    try {
      if (item.content) {
        await Clipboard.setString(item.content);
      }
    } catch (error) {
      toast.error("Failed to copy message");
    } finally {
      setShowMenu(false);
    }
  };

  // Handle download file
  const handleDownload = async () => {
    try {
      if (!item.mediaUrl) return;

      // Open the file URL - the browser/OS will handle the download
      const canOpen = await Linking.canOpenURL(item.mediaUrl);
      
      if (canOpen) {
        await Linking.openURL(item.mediaUrl);
      } else {
        toast.error("Cannot open this file");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Impossibile scaricare il file");
    } finally {
      setShowMenu(false);
    }
  };

  const renderMediaContent = () => {
    if (!item.mediaUrl) return null;

    const fileExt = getFileExtension(item.mediaUrl);
    const fileName = getFileName(item.mediaUrl);

    // Image types
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
    // Video types
    const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "m4v"];
    // Audio types
    const audioExts = ["mp3", "wav", "ogg", "m4a", "aac", "flac"];
    // Document types
    const docExts = [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "csv",
    ];

    const isImage = item.type === "IMAGE" || imageExts.includes(fileExt);
    const isVideo = item.type === "VIDEO" || videoExts.includes(fileExt);
    const isAudio = item.type === "AUDIO" || audioExts.includes(fileExt);
    const isDocument = docExts.includes(fileExt);

    // Render Image
    if (isImage) {
      return (
        <TouchableOpacity
          onPress={() => setShowImageViewer(true)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: item.mediaUrl }}
            resizeMode="cover"
            style={{
              width: s(280),
              height: s(280),
            }}
          />
        </TouchableOpacity>
      );
    }

    // Render Video thumbnail/preview
    if (isVideo) {
      return (
        <TouchableOpacity
          onPress={() => Linking.openURL(item.mediaUrl)}
          style={{
            width: s(280),
            height: s(200),
            backgroundColor: "#390505",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              width: s(60),
              height: s(60),
              borderRadius: s(30),
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <SVGIcons.Play width={s(24)} height={s(24)} />
          </View>
          <View
            style={{
              position: "absolute",
              bottom: s(12),
              left: s(12),
              right: s(12),
            }}
          >
            <ScaledText
              variant="sm"
              className="flex-row items-center gap-2"
              numberOfLines={1}
              style={{
                color: "#FFF",
                fontSize: ms(13),
              }}
            >
              {TrimText(fileName, 10)}
            </ScaledText>
          </View>
        </TouchableOpacity>
      );
    }

    // Render Audio player
    if (isAudio) {
      return (
        <TouchableOpacity
          onPress={() => Linking.openURL(item.mediaUrl)}
          style={{
            width: s(280),
            paddingHorizontal: s(16),
            paddingVertical: mvs(16),
            backgroundColor: isMine ? "#390505" : "#1A1A1A",
            flexDirection: "row",
            alignItems: "center",
            gap: s(12),
          }}
        >
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <SVGIcons.Audio width={s(24)} height={s(24)} />
          </View>
          <View style={{ flex: 1 }}>
            <ScaledText
              variant="md"
              numberOfLines={1}
              style={{
                color: "#FFF",
                fontSize: ms(14),
                fontWeight: "600",
              }}
            >
              Voice message
            </ScaledText>
            <ScaledText
              variant="sm"
              style={{
                color: "#9CA3AF",
                fontSize: ms(12),
              }}
            >
              Tap to play
            </ScaledText>
          </View>
        </TouchableOpacity>
      );
    }

    // Render Document/File
    if (isDocument || item.type === "FILE") {
      return (
        <TouchableOpacity
          onPress={() => Linking.openURL(item.mediaUrl)}
          style={{
            width: s(280),
            paddingHorizontal: s(16),
            paddingVertical: mvs(16),
            backgroundColor: isMine ? "#390505" : "#1A1A1A",
            flexDirection: "row",
            alignItems: "center",
            gap: s(12),
          }}
        >
          <View
            style={{
              borderRadius: s(8),
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <SVGIcons.Docs width={s(24)} height={s(24)} />
          </View>
          <View style={{ flex: 1 }}>
            <ScaledText
              variant="md"
              numberOfLines={2}
              style={{
                color: "#FFF",
                fontSize: ms(14),
                fontWeight: "600",
              }}
            >
              {fileName}
            </ScaledText>
            <ScaledText
              variant="sm"
              style={{
                color: "#9CA3AF",
                fontSize: ms(12),
                marginTop: mvs(2),
              }}
            >
              {fileExt.toUpperCase()} • Tap to open
            </ScaledText>
          </View>
        </TouchableOpacity>
      );
    }

    // Default fallback for unknown file types
    return (
      <TouchableOpacity
        onPress={() => Linking.openURL(item.mediaUrl)}
        style={{
          width: s(280),
          paddingHorizontal: s(16),
          paddingVertical: mvs(16),
          backgroundColor: isMine ? "#390505" : "#1A1A1A",
          flexDirection: "row",
          alignItems: "center",
          gap: s(12),
        }}
      >
        <View
          style={{
            width: s(48),
            height: s(48),
            borderRadius: s(8),
            backgroundColor: "#4B5563",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ScaledText style={{ fontSize: ms(24) }}>📎</ScaledText>
        </View>
        <View style={{ flex: 1 }}>
          <ScaledText
            variant="md"
            numberOfLines={2}
            style={{
              color: "#FFF",
              fontSize: ms(14),
              fontWeight: "600",
            }}
          >
            {fileName}
          </ScaledText>
          <ScaledText
            variant="sm"
            style={{
              color: "#9CA3AF",
              fontSize: ms(12),
            }}
          >
            Tap to open
          </ScaledText>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBubble = () => {
    if (item.mediaUrl) {
      return (
        <View
          className="rounded-2xl overflow-hidden relative border border-gray/30"
          style={{
            maxWidth: "90%",
            borderRadius: s(16),
          }}
        >
          {renderMediaContent()}

          {/* Text content below media if it exists */}
          {item.content && (
            <View
              style={{
                backgroundColor: isMine ? "#390505" : "#262626",
                paddingHorizontal: s(16),
                paddingVertical: mvs(12),
                borderBottomLeftRadius: s(16),
                borderBottomRightRadius: s(16),
              }}
            >
              <ScaledText
                variant="md"
                style={{
                  color: "#FFFFFF",
                  fontSize: ms(15),
                  lineHeight: mvs(22),
                  flexShrink: 1,
                }}
                className="font-[600]"
              >
                {item.content}
              </ScaledText>
            </View>
          )}

          {/* Bubble tail for media messages */}
          {isMine ? (
            <SVGIcons.BubbleMe
              width={s(24)}
              height={s(24)}
              style={{
                position: "absolute",
                bottom: s(-2),
                right: s(-2),
              }}
            />
          ) : (
            <SVGIcons.BubbleYou
              width={s(24)}
              height={s(24)}
              style={{
                position: "absolute",
                bottom: s(-2),
                left: s(-2),
              }}
            />
          )}
        </View>
      );
    }

    return (
      <View
        style={{
          backgroundColor: isMine ? "#390505" : "#262626",
          paddingHorizontal: s(20),
          paddingVertical: mvs(16),
          borderRadius: s(20),
          position: "relative",
          alignSelf: "flex-start",
        }}
        className="max-w-[80vw]"
      >
        <ScaledText
          variant="md"
          style={{
            color: "#FFFFFF",
            fontSize: ms(15),
            lineHeight: mvs(22),
            flexShrink: 1,
          }}
          className="font-[600]"
        >
          {item.content}
        </ScaledText>

        {/* Bubble tail for text messages */}
        {isMine ? (
          <SVGIcons.BubbleMe
            width={s(24)}
            height={s(24)}
            style={{
              position: "absolute",
              bottom: s(0 - 5),
              right: s(-5),
            }}
          />
        ) : (
          <SVGIcons.BubbleYou
            width={s(24)}
            height={s(24)}
            style={{
              position: "absolute",
              bottom: s(-5),
              left: s(-5),
            }}
          />
        )}
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: isMine ? "flex-end" : "flex-start",
            paddingHorizontal: s(16),
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onLongPress={() => setShowMenu(true)}
            delayLongPress={500}
          >
            {renderBubble()}
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            justifyContent: isMine ? "flex-end" : "flex-start",
            paddingHorizontal: s(16),
            alignItems: "flex-end",
          }}
        >
          {/* Avatar for received messages - show on every message */}
          {!isMine && (
            <Image
              source={{ uri: peerAvatar || "https://via.placeholder.com/36" }}
              style={{
                width: s(22),
                height: s(22),
                borderRadius: s(18),
                marginRight: s(8),
              }}
            />
          )}

          <View>
            <TouchableOpacity
              activeOpacity={1}
              onLongPress={() => setShowMenu(true)}
              delayLongPress={500}
            >
              {renderBubble()}
            </TouchableOpacity>

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
                  variant="11"
                  className="font-[400] text-gray"
                  style={{
                    color: "#9CA3AF",
                    fontSize: ms(12),
                  }}
                >
                  {formatMessageTimestamp(item.createdAt)}
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
      )}

      {/* Context Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View
            style={{
              backgroundColor: "#1F1F1F",
              borderRadius: s(12),
              padding: s(8),
              minWidth: s(160),
              borderWidth: 1,
              borderColor: "#333",
            }}
          >
            {/* Show Copy option for text messages */}
            {item.content && (
              <TouchableOpacity
                onPress={handleCopyText}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: mvs(12),
                  paddingHorizontal: s(16),
                  gap: s(12),
                }}
              >
                <ScaledText
                  variant="md"
                  style={{
                    color: "#FFFFFF",
                    fontSize: ms(15),
                    fontWeight: "600",
                  }}
                >
                  Copy
                </ScaledText>
              </TouchableOpacity>
            )}

            {/* Show Download option for media files */}
            {item.mediaUrl && (
              <TouchableOpacity
                onPress={handleDownload}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: mvs(12),
                  paddingHorizontal: s(16),
                  gap: s(12),
                  borderTopWidth: item.content ? 1 : 0,
                  borderTopColor: "#333",
                }}
              >
                <ScaledText
                  variant="md"
                  style={{
                    color: "#FFFFFF",
                    fontSize: ms(15),
                    fontWeight: "600",
                  }}
                >
                  Download
                </ScaledText>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Viewer Modal */}
      {item.mediaUrl && (item.type === "IMAGE" || item.messageType === "IMAGE") && (
        <ChatImageViewer
          visible={showImageViewer}
          imageUrl={item.mediaUrl}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </View>
  );
}