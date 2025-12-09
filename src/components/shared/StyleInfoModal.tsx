import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { TattooStyleItem } from "@/services/style.service";
import { mvs, s } from "@/utils/scale";
import React from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

interface StyleInfoModalProps {
  visible: boolean;
  style: TattooStyleItem | null;
  onClose: () => void;
}

export default function StyleInfoModal({
  visible,
  style,
  onClose,
}: StyleInfoModalProps) {
  if (!style) return null;

  const resolveImageUrl = (url?: string | null) => {
    if (!url) return undefined;
    try {
      if (url.includes("imgres") && url.includes("imgurl=")) {
        const u = new URL(url);
        const real = u.searchParams.get("imgurl");
        return real || url;
      }
      return url;
    } catch {
      return url;
    }
  };

  const imageUrl = resolveImageUrl(style.imageUrl);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onPress={onClose}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: "flex-end",
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            className="bg-background rounded-t-3xl"
            style={{
              maxHeight: "60%",
              paddingBottom: mvs(32),
              borderTopWidth: 1,
              borderTopColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Drag handle */}
            <View
              style={{
                alignItems: "center",
                paddingTop: mvs(8),
                paddingBottom: mvs(4),
              }}
            >
              <View
                style={{
                  width: s(40),
                  height: s(4),
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  borderRadius: s(2),
                }}
              />
            </View>

            {/* Header with close button */}
            <View
              className="relative flex-row items-center justify-center"
              style={{
                paddingHorizontal: s(20),
                paddingTop: mvs(12),
                paddingBottom: mvs(16),
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="absolute left-4 items-center justify-center rounded-full bg-foreground/20"
                style={{
                  width: s(30),
                  height: s(30),
                }}
              >
                <SVGIcons.Close width={s(12)} height={s(12)} />
              </TouchableOpacity>
              <ScaledText
                allowScaling={false}
                variant="lg"
                className="text-foreground font-neueSemibold"
              >
                {style.name}
              </ScaledText>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: s(20) }}
            >

              {/* Image */}
              {imageUrl && (
                <Image
                  source={{ uri: imageUrl }}
                  style={{
                    width: "100%",
                    height: mvs(200),
                    resizeMode: "cover",
                    marginTop: mvs(16),
                    marginBottom: mvs(16),
                    borderRadius: s(12),
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                />
              )}

              {/* Description */}
              {style.description ? (
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-foreground/80 font-montserratRegular"
                  style={{
                    lineHeight: s(24),
                    marginBottom: mvs(20),
                  }}
                >
                  {style.description}
                </ScaledText>
              ) : (
                <ScaledText
                  allowScaling={false}
                  variant="md"
                  className="text-gray font-montserratRegular"
                  style={{
                    lineHeight: s(24),
                    marginBottom: mvs(20),
                    fontStyle: "italic",
                  }}
                >
                  Nessuna descrizione disponibile.
                </ScaledText>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
