import { cloudinaryService, UploadOptions, UploadResult } from '@/services/cloudinary.service';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform } from 'react-native';
import { toast } from 'sonner-native';  

export interface FileUploadOptions {
  mediaType?: 'image' | 'video' | 'all';
  allowsMultipleSelection?: boolean;
  quality?: number;
  maxFiles?: number;
  cloudinaryOptions?: UploadOptions;
}

export interface UploadedFile {
  id: string;
  uri: string;
  type: 'image' | 'video';
  fileName: string;
  fileSize: number;
  cloudinaryResult?: UploadResult;
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  /**
   * Request media library permissions
   */
  const requestPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          toast.error('Permission Required');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  /**
   * Pick files from media library
   */
  const pickFiles = async (options: FileUploadOptions = {}): Promise<UploadedFile[]> => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return [];

      const {
        mediaType = 'image',
        allowsMultipleSelection = false,
        quality = 0.8,
        maxFiles = 5,
      } = options;

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: mediaType === 'all' 
          ? ImagePicker.MediaTypeOptions.All 
          : mediaType === 'video' 
            ? ImagePicker.MediaTypeOptions.Videos 
            : ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection,
        quality,
        exif: false,
      };


      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled) {
        return [];
      }

      const files = Array.isArray(result.assets) ? result.assets : [result.assets];
      
      if (files.length > maxFiles) {
        toast.error(`You can only select up to ${maxFiles} files.`);
        return [];
      }

      const uploadedFiles: UploadedFile[] = files.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        uri: file.uri,
        type: file.type === 'video' ? 'video' : 'image',
        fileName: file.fileName || `file-${index}`,
        fileSize: file.fileSize || 0,
      }));

      setUploadedFiles(prev => [...prev, ...uploadedFiles]);
      return uploadedFiles;
    } catch (error) {
      console.error('File picker error:', error);
      toast.error('Failed to pick files. Please try again.');
      return [];
    }
  };

  /**
   * Take a photo with camera
   */
  const takePhoto = async (options: FileUploadOptions = {}): Promise<UploadedFile[]> => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return [];

      const { quality = 0.8 } = options;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality,
        exif: false,
      });

      if (result.canceled) {
        return [];
      }

      const file = result.assets[0];
      const uploadedFile: UploadedFile = {
        id: `${Date.now()}`,
        uri: file.uri,
        type: 'image',
        fileName: file.fileName || 'photo',
        fileSize: file.fileSize || 0,
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      return [uploadedFile];
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to take photo. Please try again.');
      return [];
    }
  };

  /**
   * Upload files to Cloudinary
   */
  const uploadToCloudinary = async (
    files: UploadedFile[],
    cloudinaryOptions?: UploadOptions
  ): Promise<UploadedFile[]> => {
    if (files.length === 0) return [];

    setUploading(true);
    try {
      // console.log('Starting Cloudinary upload for files:', files.length);
      // console.log('Cloudinary options:', cloudinaryOptions);
      
      const uploadPromises = files.map(async (file) => {
        try {
          const fileObj = {
            uri: file.uri,
            type: file.type === 'video' ? 'video/mp4' : 'image/jpeg',
            fileName: file.fileName,
          };

          console.log('Uploading file:', fileObj);
          const result = await cloudinaryService.uploadFile(fileObj, cloudinaryOptions);
          
          return {
            ...file,
            cloudinaryResult: result,
          };
        } catch (error) {
          console.error(`Upload error for file ${file.id}:`, error);
          return file; // Return original file if upload fails
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Update state with Cloudinary results
      setUploadedFiles(prev => 
        prev.map(file => {
          const uploaded = uploadedFiles.find(uf => uf.id === file.id);
          return uploaded || file;
        })
      );

      return uploadedFiles;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      toast.error('Failed to upload files. Please try again.');
      return files;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Remove a file from the list
   */
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  /**
   * Clear all files
   */
  const clearFiles = () => {
    setUploadedFiles([]);
  };

  /**
   * Get file count by type
   */
  const getFileCounts = () => {
    const images = uploadedFiles.filter(f => f.type === 'image').length;
    const videos = uploadedFiles.filter(f => f.type === 'video').length;
    return { images, videos, total: uploadedFiles.length };
  };

  /**
   * Check if files are ready for upload
   */
  const areFilesReady = (files: UploadedFile[]): boolean => {
    return files.every(file => file.cloudinaryResult !== undefined);
  };

  return {
    uploading,
    uploadedFiles,
    pickFiles,
    takePhoto,
    uploadToCloudinary,
    removeFile,
    clearFiles,
    getFileCounts,
    areFilesReady,
  };
};
