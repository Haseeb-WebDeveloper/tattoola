import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { Modal, TouchableOpacity, View } from "react-native";

type DiscardPostConfirmModalProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export default function DiscardPostConfirmModal({
  visible,
  onCancel,
  onConfirm,
  loading = false,
}: DiscardPostConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !loading && onCancel()}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => !loading && onCancel()}
        className="items-center justify-center flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      >
        <View
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
            className="text-center text-background font-neueBold"
            style={{ marginBottom: mvs(6) }}
          >
            Abbandonare la creazione del tatuaggio?
          </ScaledText>
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-center text-background font-montserratSemibold"
            style={{ marginBottom: mvs(20) }}
          >
            Se esci ora, perderai tutti i dettagli inseriti per questo
            tatuaggio.
          </ScaledText>
          <View
            className="flex-row justify-center"
            style={{ columnGap: s(10) }}
          >
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className="flex-row items-center justify-center rounded-full border-primary"
              style={{
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
                borderWidth: s(1),
                opacity: loading ? 0.6 : 1,
                gap: s(4),
              }}
            >
              <SVGIcons.DeletePrimary width={s(16)} height={s(16)} />
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-primary font-montserratSemibold"
              >
                Sì, non pubblicare
              </ScaledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => !loading && onCancel()}
              disabled={loading}
              className="flex-row items-center justify-center rounded-full"
              style={{
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
                opacity: loading ? 0.6 : 1,
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
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
