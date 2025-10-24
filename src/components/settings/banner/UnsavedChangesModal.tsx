import ScaledText from "@/components/ui/ScaledText";
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
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      >
        <View
          className="bg-[#fff] rounded-xl"
          style={{
            width: s(342),
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
            className="text-background font-neueBold text-center"
            style={{ marginBottom: mvs(4) }}
          >
            You have unsaved changes in banner
          </ScaledText>

          {/* Subtitle */}
          <ScaledText
            allowScaling={false}
            variant="md"
            className="text-background font-montserratMedium text-center"
            style={{ marginBottom: mvs(32) }}
          >
            Do you want to discard them?
          </ScaledText>

          {/* Action Buttons */}
          <View style={{ gap: mvs(4) }} className="flex-row justify-center">
            {/* Continue Editing Button */}
            <TouchableOpacity
              onPress={onContinueEditing}
              className="rounded-full border-2 items-center justify-center flex-row"
              style={{
                borderColor: "#AD2E2E",
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
                gap: s(8),
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
              className="rounded-full items-center justify-center"
              style={{
                paddingVertical: mvs(10.5),
                paddingLeft: s(18),
                paddingRight: s(20),
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

