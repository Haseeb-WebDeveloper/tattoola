import { mmkv } from "@/stores/mmkv";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Linking, Platform } from "react-native";

export type PermissionType = "gallery" | "files";

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  status: "granted" | "denied" | "undetermined";
}

// Cache keys
const PERMISSION_CACHE_KEYS = {
  gallery: "permission_gallery_checked",
} as const;

export class PermissionsService {
  private static galleryPermissionGranted: boolean | null = null;

  /**
   * Check and request gallery permission (only asks if needed)
   */
  static async ensureGalleryPermission(): Promise<PermissionResult> {
    try {
      // First check in-memory cache
      if (this.galleryPermissionGranted !== null) {
        return {
          granted: this.galleryPermissionGranted,
          canAskAgain: true,
          status: this.galleryPermissionGranted ? "granted" : "denied",
        };
      }

      // Check actual permission status from OS
      const { status, canAskAgain } =
        await ImagePicker.getMediaLibraryPermissionsAsync();

      if (status === "granted") {
        // Permission already granted, cache it
        this.galleryPermissionGranted = true;
        mmkv.set(PERMISSION_CACHE_KEYS.gallery, "true");
        return {
          granted: true,
          canAskAgain,
          status: "granted",
        };
      }

      // Need to request permission (will only show dialog if not asked before)
      const requestResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      this.galleryPermissionGranted = requestResult.status === "granted";
      if (this.galleryPermissionGranted) {
        mmkv.set(PERMISSION_CACHE_KEYS.gallery, "true");
      }

      return {
        granted: requestResult.status === "granted",
        canAskAgain: requestResult.canAskAgain,
        status: requestResult.status as "granted" | "denied" | "undetermined",
      };
    } catch (error) {
      console.error("Error ensuring gallery permission:", error);
      return {
        granted: false,
        canAskAgain: false,
        status: "denied",
      };
    }
  }

  /**
   * Pick image from gallery (handles permission automatically)
   * Will ONLY show permission dialog ONCE if not already granted
   */
  static async pickImageFromGallery(options?: {
    allowsMultipleSelection?: boolean;
    quality?: number;
    allowsEditing?: boolean;
  }): Promise<ImagePicker.ImagePickerResult | null> {
    // This will only show permission dialog ONCE if not granted
    const permission = await this.ensureGalleryPermission();

    if (!permission.granted) {
      return null;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Supports both images and videos
        allowsMultipleSelection: options?.allowsMultipleSelection ?? false,
        quality: options?.quality ?? 0.8,
        allowsEditing: options?.allowsEditing ?? false,
      });

      return result;
    } catch (error) {
      console.error("Error picking image:", error);
      return null;
    }
  }

  /**
   * Pick video from gallery (handles permission automatically)
   */
  static async pickVideoFromGallery(options?: {
    quality?: number;
    allowsEditing?: boolean;
  }): Promise<ImagePicker.ImagePickerResult | null> {
    const permission = await this.ensureGalleryPermission();

    if (!permission.granted) {
      return null;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: options?.quality ?? 0.8,
        allowsEditing: options?.allowsEditing ?? false,
      });

      return result;
    } catch (error) {
      console.error("Error picking video:", error);
      return null;
    }
  }

  /**
   * Pick images or videos from gallery
   */
  static async pickMediaFromGallery(options?: {
    allowsMultipleSelection?: boolean;
    quality?: number;
    allowsEditing?: boolean;
  }): Promise<ImagePicker.ImagePickerResult | null> {
    const permission = await this.ensureGalleryPermission();

    if (!permission.granted) {
      return null;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: options?.allowsMultipleSelection ?? false,
        quality: options?.quality ?? 0.8,
        allowsEditing: options?.allowsEditing ?? false,
      });

      return result;
    } catch (error) {
      console.error("Error picking media:", error);
      return null;
    }
  }

  /**
   * Pick document/file (handles permission internally via DocumentPicker)
   * Note: DocumentPicker handles file permissions natively - no explicit request needed
   * Will ONLY show permission dialog if needed (first time or if denied before)
   */
  static async pickDocument(options?: {
    type?: string[];
    multiple?: boolean;
  }): Promise<DocumentPicker.DocumentPickerResult | null> {
    try {
      // DocumentPicker handles permissions internally on both platforms
      // It will show native permission dialog ONLY if needed
      const result = await DocumentPicker.getDocumentAsync({
        type: options?.type ?? ["application/pdf", "image/*"],
        multiple: options?.multiple ?? false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return null;
      }

      return result;
    } catch (error) {
      console.error("Error picking document:", error);
      return null;
    }
  }

  /**
   * Check if gallery permission is granted (from cache or OS)
   */
  static async isGalleryPermissionGranted(): Promise<boolean> {
    if (this.galleryPermissionGranted !== null) {
      return this.galleryPermissionGranted;
    }

    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      const granted = status === "granted";
      this.galleryPermissionGranted = granted;
      return granted;
    } catch {
      return false;
    }
  }

  /**
   * Open device settings (when user permanently denies permission)
   */
  static async openSettings(): Promise<void> {
    try {
      if (Platform.OS === "ios") {
        await Linking.openURL("app-settings:");
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error("Error opening settings:", error);
    }
  }

  /**
   * Clear permission cache (useful for testing)
   * NOTE: This only clears our app's cache. The OS permission is still granted.
   * To truly reset, user must revoke permission in device settings.
   */
  static clearCache(): void {
    this.galleryPermissionGranted = null;
    mmkv.set(PERMISSION_CACHE_KEYS.gallery, "");
  }

  /**
   * Show appropriate permission denied message
   */
  static getPermissionDeniedMessage(
    type: PermissionType,
    canAskAgain: boolean
  ): {
    title: string;
    message: string;
    showSettings: boolean;
  } {
    const messages = {
      gallery: {
        title: "Permesso Galleria Richiesto",
        messageAskAgain:
          "Per caricare foto o video, è necessario concedere l'accesso alla galleria.",
        messagePermanent:
          "Per caricare foto o video, è necessario abilitare l'accesso alla galleria nelle impostazioni del dispositivo.",
      },
      files: {
        title: "Permesso File Richiesto",
        messageAskAgain:
          "Per caricare documenti, è necessario concedere l'accesso ai file.",
        messagePermanent:
          "Per caricare documenti, è necessario abilitare l'accesso ai file nelle impostazioni del dispositivo.",
      },
    };

    const config = messages[type];
    return {
      title: config.title,
      message: canAskAgain ? config.messageAskAgain : config.messagePermanent,
      showSettings: !canAskAgain,
    };
  }
}
