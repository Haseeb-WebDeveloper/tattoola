import { PermissionsService } from "@/services/permissions.service";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity, View } from "react-native";

type PermissionAwareDocumentPickerProps = {
  onDocumentSelected: (document: DocumentPicker.DocumentPickerAsset) => void;
  onPermissionDenied?: () => void;
  acceptedTypes?: string[];
  children: React.ReactNode;
  disabled?: boolean;
  multiple?: boolean;
};

export default function PermissionAwareDocumentPicker({
  onDocumentSelected,
  onPermissionDenied,
  acceptedTypes = ["application/pdf", "image/*"],
  children,
  disabled = false,
  multiple = false,
}: PermissionAwareDocumentPickerProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handlePress = async () => {
    if (disabled || isRequesting) return;

    setIsRequesting(true);

    try {
      // DocumentPicker handles permissions internally
      // Will ONLY show permission dialog if needed (first time)
      const result = await PermissionsService.pickDocument({
        type: acceptedTypes,
        multiple,
      });

      if (
        result &&
        !result.canceled &&
        result.assets &&
        result.assets.length > 0
      ) {
        if (multiple) {
          // Handle multiple documents
          result.assets.forEach((asset) => {
            onDocumentSelected(asset);
          });
        } else {
          // Handle single document
          onDocumentSelected(result.assets[0]);
        }
      }
      // If result is null or result.canceled is true, user cancelled - no action needed
      // Don't show error for cancellation
    } catch (error) {
      console.error("Error picking document:", error);

      // Check if it's a permission error
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.toLowerCase().includes("permission") ||
        errorMessage.toLowerCase().includes("denied")
      ) {
        const message = PermissionsService.getPermissionDeniedMessage(
          "files",
          true
        );

        Alert.alert(message.title, message.message, [
          {
            text: "Annulla",
            style: "cancel",
            onPress: () => onPermissionDenied?.(),
          },
          {
            text: "Apri Impostazioni",
            onPress: () => {
              PermissionsService.openSettings();
              onPermissionDenied?.();
            },
          },
        ]);
      } else {
        Alert.alert(
          "Errore",
          "Si è verificato un errore durante la selezione del documento."
        );
      }
    } finally {
      setIsRequesting(false);
    }
  };

  if (isRequesting) {
    return (
      <View style={{ opacity: 0.5 }}>
        {children}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="small" color="#AE0E0E" />
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isRequesting}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
}
