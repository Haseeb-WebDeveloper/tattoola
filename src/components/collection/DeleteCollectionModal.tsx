import ScaledText from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { Modal, TouchableOpacity, View } from "react-native";

type DeleteCollectionModalProps = {
  visible: boolean;
  collectionName?: string;
  onCancel: () => void;
  onConfirm: () => void;
  deleting?: boolean;
};

export default function DeleteCollectionModal({
  visible,
  collectionName,
  onCancel,
  onConfirm,
  deleting = false,
}: DeleteCollectionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !deleting && onCancel()}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => !deleting && onCancel()}
        className="flex-1 justify-center items-center"
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
            className="text-background font-neueBold text-center"
            style={{ marginBottom: mvs(6) }}
          >
            Eliminare la collezione?
          </ScaledText>
          {!!collectionName && (
            <ScaledText
              allowScaling={false}
              variant="sm"
              className="text-background text-center font-montserratSemibold"
              style={{ marginBottom: mvs(10) }}
            >
              "{collectionName}"
            </ScaledText>
          )}
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-background text-center font-montserratSemibold"
            style={{ marginBottom: mvs(20) }}
          >
            Questa collezione verrà eliminata definitivamente. Questa azione non può essere annullata.
          </ScaledText>
          <View
            className="flex-row justify-center"
            style={{ columnGap: s(10) }}
          >
            <TouchableOpacity
              onPress={onConfirm}
              disabled={deleting}
              className="rounded-full items-center justify-center flex-row border-primary"
              style={{
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
                borderWidth: s(1),
                opacity: deleting ? 0.6 : 1,
                gap: s(4),
              }}
            >
              <SVGIcons.DeletePrimary width={s(16)} height={s(16)} />
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-primary font-montserratSemibold"
              >
                {deleting ? "Eliminazione..." : "Elimina"}
              </ScaledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => !deleting && onCancel()}
              disabled={deleting}
              className="rounded-full items-center justify-center flex-row"
              style={{
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
                opacity: deleting ? 0.6 : 1,
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

