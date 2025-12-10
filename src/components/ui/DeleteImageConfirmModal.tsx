import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { Modal, TouchableOpacity, View } from "react-native";

type DeleteImageConfirmModalProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteImageConfirmModal({
  visible,
  onCancel,
  onConfirm,
}: DeleteImageConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onCancel}
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          className="bg-[#fff] rounded-xl max-w-[90vw]"
          style={{
            width: s(342),
            paddingHorizontal: s(24),
            paddingVertical: mvs(28),
          }}
        >
          <View className="items-center" style={{ marginBottom: mvs(16) }}>
            <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
          </View>
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-background font-neueBold text-center"
            style={{ marginBottom: mvs(6) }}
          >
            Rimuovere l'immagine?
          </ScaledText>
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-background text-center font-montserratSemibold"
            style={{ marginBottom: mvs(20) }}
          >
            Sei sicuro di voler eliminare questa immagine? Questa azione non può essere annullata.
          </ScaledText>
          <View
            className="flex-row justify-center"
            style={{ columnGap: s(10) }}
          >
            <TouchableOpacity
              onPress={onConfirm}
              className="rounded-full items-center justify-center flex-row border-primary"
              style={{
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
                borderWidth: s(1),
                gap: s(4),
              }}
            >
              <SVGIcons.DeletePrimary width={s(16)} height={s(16)} />
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-primary font-montserratSemibold"
              >
                Elimina
              </ScaledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancel}
              className="rounded-full items-center justify-center flex-row"
              style={{
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-gray font-montserratSemibold"
              >
                Annulla
              </ScaledText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

