import React from "react";
import { Image, Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import { LinearGradient } from "expo-linear-gradient";

type SimplePost = { id: string; caption?: string; thumbnailUrl?: string | null };

type AddPostsModalProps = {
  visible: boolean;
  items: SimplePost[];
  selectedIds: Set<string>;
  onToggle: (postId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AddPostsModal({ visible, items, selectedIds, onToggle, onClose, onConfirm }: AddPostsModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 bg-black rounded-t-3xl" style={{ marginTop: "auto" }}>
          {/* Header */}
          <View
            className="border-b border-gray flex-row items-center justify-between relative bg-primary/30"
            style={{ paddingBottom: mvs(15), paddingTop: mvs(50), paddingHorizontal: s(20) }}
          >
            <TouchableOpacity onPress={onClose} className="rounded-full bg-foreground/20 items-center justify-center" style={{ width: s(30), height: s(30) }}>
              <SVGIcons.Close width={s(12)} height={s(12)} />
            </TouchableOpacity>
            <View className="flex-row items-center justify-center">
              <ScaledText allowScaling={false} variant="lg" className="text-foreground font-neueSemibold">
                Select tattoos
              </ScaledText>
            </View>
            <View style={{ height: mvs(30), width: mvs(30) }} />
          </View>

          {/* Content */}
          <ScrollView
            className="flex-1"
            style={{ paddingHorizontal: s(20), paddingTop: mvs(20), paddingBottom: mvs(100) + Math.max(insets.bottom, mvs(20)) }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ gap: mvs(16) }}>
              {items.map((p) => {
                const checked = selectedIds.has(p.id);
                return (
                  <TouchableOpacity key={p.id} onPress={() => onToggle(p.id)} style={{ width: "100%" }}>
                    <View
                      className="relative w-full rounded-lg overflow-hidden"
                      style={{ height: mvs(253), borderWidth: checked ? s(2) : s(0), borderColor: checked ? "#AD2E2E" : "transparent" }}
                    >
                      <Image
                        source={{ uri: p.thumbnailUrl || "https://via.placeholder.com/200" }}
                        className="w-full h-full"
                        style={{ height: mvs(253) }}
                        resizeMode="cover"
                      />
                      <LinearGradient colors={["transparent", "rgba(0,0,0,1)"]} className="absolute bottom-0 left-0 right-0 rounded-b-lg" style={{ padding: s(12) }}>
                        <ScaledText allowScaling={false} variant="sm" className="text-foreground font-neueMedium" numberOfLines={1}>
                          {p.caption || "Untitled"}
                        </ScaledText>
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            className="flex-row justify-between absolute left-0 right-0 bg-background border-t border-gray/20"
            style={{ paddingHorizontal: s(20), paddingTop: mvs(16), paddingBottom: Math.max(insets.bottom, mvs(20)), bottom: 0 }}
          >
            <TouchableOpacity onPress={onClose} className="rounded-full border border-foreground items-center flex-row gap-3" style={{ paddingVertical: mvs(10.5), paddingLeft: s(18), paddingRight: s(20) }}>
              <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
              <ScaledText allowScaling={false} variant="md" className="text-foreground font-neueSemibold">
                Cancel
              </ScaledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              className={`rounded-full items-center flex-row gap-3 ${selectedIds.size > 0 ? "bg-primary" : "bg-gray/40"}`}
              style={{ paddingVertical: mvs(10.5), paddingLeft: s(18), paddingRight: s(20) }}
              disabled={selectedIds.size === 0}
            >
              <ScaledText allowScaling={false} variant="md" className="text-foreground font-neueSemibold">
                Add to collection
              </ScaledText>
              <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


