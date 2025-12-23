import { PermissionsService } from "@/services/permissions.service";
import { useState } from "react";

interface UploadResult {
  uri: string;
  name?: string;
  size?: number;
  type: "image" | "video" | "document";
}

/**
 * Hook to handle permission requests and file picking during signup
 * Ensures permissions are only asked once and provides proper error handling
 */
export const useSignupPermissions = () => {
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  /**
   * Pick a profile image with permission handling
   * Only asks for permission once (native behavior)
   */
  const pickProfileImage = async (): Promise<UploadResult | null> => {
    try {
      setIsLoadingGallery(true);

      const result = await PermissionsService.pickImageFromGallery({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result || result.canceled) {
        return null;
      }

      const asset = result.assets?.[0];
      if (!asset) {
        return null;
      }

      return {
        uri: asset.uri,
        name: asset.uri.split("/").pop() || "profile-image.jpg",
        size: asset.fileSize,
        type: "image",
      };
    } catch (error) {
      console.error("Profile image pick error:", error);
      return null;
    } finally {
      setIsLoadingGallery(false);
    }
  };

  /**
   * Pick banner images or videos with permission handling
   * Supports multiple selections
   */
  const pickBannerMedia = async (
    allowMultiple: boolean = true
  ): Promise<UploadResult[] | null> => {
    try {
      setIsLoadingGallery(true);

      const result = await PermissionsService.pickMediaFromGallery({
        allowsMultipleSelection: allowMultiple,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result || result.canceled) {
        return null;
      }

      const assets = result.assets || [];
      if (assets.length === 0) {
        return null;
      }

      return assets.map((asset) => ({
        uri: asset.uri,
        name: asset.uri.split("/").pop() || `media-${Date.now()}`,
        size: asset.fileSize,
        type: asset.type === "image" ? "image" : "video",
      }));
    } catch (error) {
      console.error("Banner media pick error:", error);
      return null;
    } finally {
      setIsLoadingGallery(false);
    }
  };

  /**
   * Pick a certificate file with permission handling
   * Supports PDF and images
   */
  const pickCertificateFile = async (): Promise<UploadResult | null> => {
    try {
      setIsLoadingFile(true);

      const result = await PermissionsService.pickDocument({
        type: ["application/pdf", "image/*"],
        multiple: false,
      });

      if (!result) {
        return null;
      }

      const file = result.assets?.[0];
      if (!file) {
        return null;
      }

      return {
        uri: file.uri,
        name: file.name,
        size: file.size,
        type: "document",
      };
    } catch (error) {
      console.error("Certificate file pick error:", error);
      return null;
    } finally {
      setIsLoadingFile(false);
    }
  };

  /**
   * Check gallery permission status
   */
  const checkGalleryPermission = async (): Promise<boolean> => {
    return await PermissionsService.isGalleryPermissionGranted();
  };

  /**
   * Open device settings when permission is permanently denied
   */
  const openAppSettings = async (): Promise<void> => {
    await PermissionsService.openSettings();
  };

  return {
    pickProfileImage,
    pickBannerMedia,
    pickCertificateFile,
    checkGalleryPermission,
    openAppSettings,
    isLoadingGallery,
    isLoadingFile,
  };
};
