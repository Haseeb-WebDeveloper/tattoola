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
            paddingHorizontal: s(16),
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
            variant="md"
            className="text-center text-background font-neueBold"
            style={{ marginBottom: mvs(4), fontSize: s(14) }}
          >
            Hai modifiche non salvate nei dettagli del Tatuaggio
          </ScaledText>

          {/* Subtitle */}
          <ScaledText
            allowScaling={false}
            variant="sm"
            className="text-center text-background font-montserratMedium"
            style={{ marginBottom: mvs(32), fontSize: s(12) }}
          >
            Vuoi scartarle?
          </ScaledText>

          {/* Action Buttons */}
          <View
            style={{
                flexDirection: "column",
              gap: s(12),
              width: "100%",
            }}
          >
            {/* Continue Editing Button */}
            <TouchableOpacity
              onPress={onContinueEditing}
              style={{
                  width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#AD2E2E",
                borderRadius: s(999),
                paddingVertical: mvs(14),
                paddingHorizontal: s(18),
                gap: s(6),
              }}
            >
              <SVGIcons.PenRed
                style={{ width: s(14), height: s(14) }}
                fill="#AD2E2E"
              />
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="font-montserratMedium"
                style={{ color: "#AD2E2E", fontSize: s(12) }}
                numberOfLines={1}
              >
                Continua a modificare
              </ScaledText>
            </TouchableOpacity>

            {/* Discard Changes Button */}
            <TouchableOpacity
              onPress={onDiscardChanges}
              style={{
                  width: "100%",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: s(999),
                paddingVertical: mvs(14),
                paddingHorizontal: s(18),
              }}
            >
              <ScaledText
                allowScaling={false}
                variant="sm"
                className="text-gray font-montserratMedium"
                style={{ fontSize: s(12) }}
                numberOfLines={1}
              >
                Scarta modifiche
              </ScaledText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
