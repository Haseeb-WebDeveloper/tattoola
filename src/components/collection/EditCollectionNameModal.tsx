import React from "react";
import { Modal, TouchableOpacity, View } from "react-native";
import ScaledText from "@/components/ui/ScaledText";
import ScaledTextInput from "@/components/ui/ScaledTextInput";
import { mvs, s } from "@/utils/scale";

type EditCollectionNameModalProps = {
  visible: boolean;
  value: string;
  onChangeValue: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export default function EditCollectionNameModal({
  visible,
  value,
  onChangeValue,
  onCancel,
  onSave,
}: EditCollectionNameModalProps) {
  const isSaveDisabled = !value.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
      >
        <View className="w-11/12 rounded-2xl bg-tat-foreground p-5 border border-gray flex-col justify-between">
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-foreground font-neueBold"
            style={{ marginBottom: mvs(8) }}
          >
            Modifica nome collection
          </ScaledText>
          <ScaledTextInput
            containerClassName="rounded-xl border border-gray"
            className="text-foreground rounded-xl font-montserratSemibold"
            style={{ fontSize: s(12) }}
            placeholder="Nome collection"
            value={value}
            onChangeText={onChangeValue}
            autoFocus
          />
          <View
            className="flex-row gap-3"
            style={{
              marginTop: mvs(16),
            }}
          >
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.7}
              className="rounded-full border items-center flex-1 flex-row justify-center text-center border-foreground"
              style={{
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
                gap: s(15),
                backgroundColor: "transparent",
                opacity: 1,
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-foreground font-neueSemibold text-center"
              >
                Annulla
              </ScaledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={isSaveDisabled ? undefined : onSave}
              activeOpacity={0.7}
              disabled={isSaveDisabled}
              className="rounded-full items-center flex-1 flex-row justify-center text-center bg-primary"
              style={{
                paddingVertical: mvs(10.5),
                paddingLeft: s(25),
                paddingRight: s(20),
                gap: s(15),
                opacity: isSaveDisabled ? 0.5 : 1,
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-foreground font-neueSemibold text-center"
              >
                Salva
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
