import React from "react";
import { Modal, TouchableOpacity, View } from "react-native";
import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";

type DeleteConfirmModalProps = {
  visible: boolean;
  caption?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({
  visible,
  caption,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      >
        <View
          className="bg-tat-darkMaroon  w-full"
          style={{
            paddingHorizontal: s(24),
            paddingVertical: mvs(40),
          }}
        >
          <View className="items-center" style={{ marginBottom: mvs(12) }}>
            <SVGIcons.Trash width={s(16)} height={s(16)} />
          </View>

          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-foreground font-neueSemibold text-center"
            style={{ marginBottom: mvs(8) }}
          >
            Remove from collection?
          </ScaledText>

          {!!caption && (
            <ScaledText
              allowScaling={false}
              variant="md"
              className="text-gray text-center font-neueLight"
              style={{ marginBottom: mvs(20) }}
            >
              "{caption}"
            </ScaledText>
          )}

          <View className="flex-row justify-center" style={{ gap: s(8), marginTop: mvs(16) }}>
            <TouchableOpacity
              onPress={onCancel}
              className="rounded-full border items-center justify-center flex-row"
              style={{
                borderColor: "#AD2E2E",
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
                gap: s(8),
              }}
            >
              <SVGIcons.ChevronLeft width={s(13)} height={s(13)} />
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueSemibold"
              >
                Cancel
              </ScaledText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className="rounded-full items-center justify-center flex-row"
              style={{
                backgroundColor: "#AD2E2E",
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
                gap: s(8),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueSemibold"
              >
                Remove
              </ScaledText>
              <SVGIcons.ChevronRight width={s(13)} height={s(13)} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
