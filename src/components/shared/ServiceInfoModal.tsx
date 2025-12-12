import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import DraggableBottomSheet from "@/components/DraggableBottomSheet";
import { ServiceItem } from "@/services/services.service";
import { mvs, s } from "@/utils/scale";
import React from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";

interface ServiceInfoModalProps {
  visible: boolean;
  service: ServiceItem | null;
  onClose: () => void;
}

export default function ServiceInfoModal({
  visible,
  service,
  onClose,
}: ServiceInfoModalProps) {
  if (!service) return null;

  const screenHeight = Dimensions.get("window").height;

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

  const imageUrl = resolveImageUrl(service.imageUrl);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* BACKDROP */}
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onClose}
      />

      {/* DRAGGABLE BOTTOM SHEET */}
      <DraggableBottomSheet onClose={onClose} maxHeight={screenHeight * 0.75}>
        
        {/* DRAG HANDLE */}
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
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
              backgroundColor: "rgba(255,255,255,0.3)",
              borderRadius: s(2),
            }}
          />
        </TouchableOpacity>

        {/* HEADER */}
        <View
          className="relative flex-row items-center justify-center"
          style={{
            paddingHorizontal: s(20),
            paddingTop: mvs(12),
            paddingBottom: mvs(16),
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.1)",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="absolute left-4 items-center justify-center rounded-full bg-foreground/20"
            style={{ width: s(30), height: s(30) }}
          >
            <SVGIcons.Close width={s(12)} height={s(12)} />
          </TouchableOpacity>

          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-foreground font-neueSemibold"
          >
            {service.name}
          </ScaledText>
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator
          nestedScrollEnabled
          contentContainerStyle={{
            paddingHorizontal: s(20),
            paddingBottom: mvs(32),
          }}
          style={{ flexGrow: 1 }}
        >
          {/* IMAGE */}
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
                borderColor: "rgba(255,255,255,0.1)",
              }}
            />
          )}

          {/* DESCRIPTION */}
          {service.description ? (
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-foreground/80 font-montserratRegular"
              style={{
                lineHeight: s(24),
                marginBottom: mvs(20),
              }}
            >
              {service.description}
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

      </DraggableBottomSheet>
    </Modal>
  );
}
