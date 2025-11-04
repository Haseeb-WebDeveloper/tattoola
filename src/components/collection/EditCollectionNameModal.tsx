import React from "react";
import { Modal, TextInput, TouchableOpacity, View } from "react-native";
import ScaledText from "@/components/ui/ScaledText";
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
          className="bg-tat-darkMaroon w-full"
          style={{
            paddingHorizontal: s(24),
            paddingVertical: mvs(32),
          }}
        >
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-foreground font-neueLight"
            style={{ marginBottom: mvs(8) }}
          >
            Edit collection name
          </ScaledText>

          <TextInput
            value={value}
            onChangeText={onChangeValue}
            placeholder="Collection name"
            placeholderTextColor="#A49A99"
            className="text-foreground bg-tat-foreground rounded-lg border border-gray"
            style={{
              paddingHorizontal: s(16),
              paddingVertical: mvs(12),
              marginBottom: mvs(24),
              fontSize: s(14),
              fontFamily: "NeueHaasDisplay-Medium",
            }}
            autoFocus
          />

          <View className="flex-row" style={{ gap: mvs(12),  }}>
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 rounded-full border border-foreground items-center justify-center"
              style={{ paddingVertical: mvs(10.5) }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueSemibold"
              >
                Cancel
              </ScaledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              className="flex-1 rounded-full items-center justify-center"
              style={{ backgroundColor: "#AD2E2E", paddingVertical: mvs(10.5) }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-foreground font-neueMedium"
              >
                Save
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
