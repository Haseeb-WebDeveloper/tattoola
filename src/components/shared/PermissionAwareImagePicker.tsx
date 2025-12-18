import { PermissionsService } from "@/services/permissions.service";
import React, { useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity, View } from "react-native";

type MediaType = "image" | "video" | "all";

type PermissionAwareImagePickerProps = {
  onMediaSelected: (uri: string, type?: "image" | "video") => void;
  onPermissionDenied?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  allowsEditing?: boolean;
  quality?: number;
  allowsMultipleSelection?: boolean;
  mediaType?: MediaType;
};

export default function PermissionAwareImagePicker({
  onMediaSelected,
  onPermissionDenied,
  children,
  disabled = false,
  allowsEditing = false,
  quality = 0.8,
  allowsMultipleSelection = false,
  mediaType = "image",
}: PermissionAwareImagePickerProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handlePickFromGallery = async () => {
    if (disabled || isRequesting) return;

    setIsRequesting(true);

    try {
      let result;

      // Pick based on media type
      if (mediaType === "video") {
        result = await PermissionsService.pickVideoFromGallery({
          allowsEditing,
          quality,
        });
      } else if (mediaType === "all") {
        result = await PermissionsService.pickMediaFromGallery({
          allowsMultipleSelection,
          allowsEditing,
          quality,
        });
      } else {
        result = await PermissionsService.pickImageFromGallery({
          allowsMultipleSelection,
          allowsEditing,
          quality,
        });
      }

      if (
        result &&
        !result.canceled &&
        result.assets &&
        result.assets.length > 0
      ) {
        if (allowsMultipleSelection) {
          // Handle multiple selections
          result.assets.forEach((asset) => {
            const assetType = asset.type === "video" ? "video" : "image";
            onMediaSelected(asset.uri, assetType);
          });
        } else {
          // Handle single selection
          const asset = result.assets[0];
          const assetType = asset.type === "video" ? "video" : "image";
          onMediaSelected(asset.uri, assetType);
        }
      } else if (result === null) {
        // Permission was denied
        const permission = await PermissionsService.ensureGalleryPermission();
        const message = PermissionsService.getPermissionDeniedMessage(
          "gallery",
          permission.canAskAgain
        );

        Alert.alert(
          message.title,
          message.message,
          message.showSettings
            ? [
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
              ]
            : [{ text: "OK", onPress: () => onPermissionDenied?.() }]
        );
      }
    } catch (error) {
      console.error("Error in image picker:", error);
      Alert.alert(
        "Errore",
        "Si è verificato un errore durante la selezione del file."
      );
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
      onPress={handlePickFromGallery}
      disabled={disabled || isRequesting}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
}
