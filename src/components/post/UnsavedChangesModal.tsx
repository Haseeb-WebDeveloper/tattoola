import { ScaledText } from "@/components/ui/ScaledText";
import { SVGIcons } from "@/constants/svg";
import { mvs, s } from "@/utils/scale";
import React from "react";
import { Modal, TouchableOpacity, View } from "react-native";

interface UnsavedChangesModalProps {
  visible: boolean;
  onContinueEditing: () => void;
  onDiscardChanges: () => void;
}

export function UnsavedChangesModal({
  visible,
  onContinueEditing,
  onDiscardChanges,
}: UnsavedChangesModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinueEditing}
    >
      <View
        className="items-center justify-center flex-1"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          paddingHorizontal: s(20),
        }}
      >
        <View
          className="bg-[#fff] rounded-xl"
          style={{
            width: "100%",
            maxWidth: s(342),
            paddingHorizontal: s(24),
            paddingVertical: mvs(32),
          }}
        >
          {/* Warning Icon */}
          <View className="items-center" style={{ marginBottom: mvs(20) }}>
            <SVGIcons.WarningYellow width={s(32)} height={s(32)} />
          </View>

          {/* Title */}
          <ScaledText
            allowScaling={false}
            variant="lg"
            className="text-center text-background font-neueBold"
            style={{ marginBottom: mvs(4) }}
          >
            You have unsaved changes in the Tattoo details
          </ScaledText>

          {/* Subtitle */}
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-center text-background font-montserratMedium"
            style={{ marginBottom: mvs(32) }}
          >
            Do you want to discard them
          </ScaledText>

          {/* Action Buttons */}
          <View style={{ gap: mvs(12) }} className="flex-col">
            {/* Continue Editing Button */}
            <TouchableOpacity
              onPress={onContinueEditing}
              className="flex-row items-center justify-center border-2 rounded-full"
              style={{
                borderColor: "#AD2E2E",
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
                gap: s(8),
                width: "100%",
              }}
            >
              <SVGIcons.PenRed
                style={{ width: s(14), height: s(14) }}
                fill="#AD2E2E"
              />
              <ScaledText
                allowScaling={false}
                variant="md"
                className="font-montserratMedium"
                style={{ color: "#AD2E2E" }}
              >
                Continue Editing
              </ScaledText>
            </TouchableOpacity>

            {/* Discard Changes Button */}
            <TouchableOpacity
              onPress={onDiscardChanges}
              className="items-center justify-center rounded-full"
              style={{
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
                width: "100%",
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="md"
                className="text-gray font-montserratMedium"
              >
                Discard changes
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
