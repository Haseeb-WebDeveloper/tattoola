import { CLOUDINARY_CONFIG } from '@/config/cloudinary';
import { Cloudinary } from '@cloudinary/url-gen';
import { UPLOAD_MAX_IMAGE_SIZE, UPLOAD_MAX_VIDEO_SIZE } from '@/constants/limits';

// Cloudinary configuration
const cloudinary = new Cloudinary({
  cloud: {
    cloudName: CLOUDINARY_CONFIG.cloudName,
  },
});

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface UploadOptions {
  folder?: string;
  transformation?: any;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  quality?: 'auto' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'mp4' | 'webm';
  maxFileSize?: number; // Maximum file size in bytes (server-side safeguard)
}

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;

  constructor() {
    this.cloudName = CLOUDINARY_CONFIG.cloudName;
    this.uploadPreset = CLOUDINARY_CONFIG.uploadPreset;
  }

  /**
   * Upload a file to Cloudinary
   */
  async uploadFile(
    file: any, // File object from image picker
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.fileName || 'upload',
      } as any);
      formData.append('upload_preset', this.uploadPreset);
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.resourceType) {
        formData.append('resource_type', options.resourceType);
      }
      
      // Add max_file_size as server-side safeguard (Cloudinary will reject if exceeded)
      if (options.maxFileSize) {
        formData.append('max_file_size', options.maxFileSize.toString());
      }
      
      // Note: For unsigned uploads, we can only use basic parameters
      // Transformations will be applied when retrieving the image

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`,
        {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header - let FormData set it automatically
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Upload failed: ${response.status} - ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          // Check if error is due to file size limit
          if (errorData.error?.message?.includes('exceeds') || 
              errorData.error?.message?.includes('size') ||
              errorData.error?.message?.includes('too large')) {
            errorMessage = `File size exceeds the allowed limit. Images: max 5MB, Videos: max 10MB.`;
          } else if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // If parsing fails, use the original error text
          if (errorText.includes('exceeds') || errorText.includes('size') || errorText.includes('too large')) {
            errorMessage = `File size exceeds the allowed limit. Images: max 5MB, Videos: max 10MB.`;
          }
        }
        
        console.error('Cloudinary upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(errorMessage);
      }

      const result = await response.json();
      // console.log('Cloudinary upload successful:', {
      //   publicId: result.public_id,
      //   secureUrl: result.secure_url,
      // });
      
      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload file to Cloudinary');
    }
  }

  /**
   * Upload multiple files to Cloudinary
   */
  async uploadMultipleFiles(
    files: any[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, options));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Cloudinary multiple upload error:', error);
      throw new Error('Failed to upload files to Cloudinary');
    }
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string, resourceType: string = 'image'): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            upload_preset: this.uploadPreset,
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  getOptimizedImageUrl(
    publicId: string,
    transformations: any = {}
  ): string {
    const cloudName = this.cloudName;
    const base = `https://res.cloudinary.com/${cloudName}/image/upload`;
    const parts: string[] = [];
    if (transformations.crop) parts.push(`c_${transformations.crop}`);
    if (transformations.gravity) parts.push(`g_${transformations.gravity}`);
    if (transformations.width) parts.push(`w_${transformations.width}`);
    if (transformations.height) parts.push(`h_${transformations.height}`);
    if (transformations.quality) parts.push(`q_${transformations.quality}`);
    if (transformations.format) parts.push(`f_${transformations.format}`);
    const transformation = parts.length ? `${parts.join(',')}` : 'q_auto,f_auto';
    return `${base}/${transformation}/${publicId}`;
  }

  /**
   * Get video thumbnail URL
   */
  getVideoThumbnailUrl(publicId: string, time: number = 1): string {
    const cloudName = this.cloudName;
    const base = `https://res.cloudinary.com/${cloudName}/video/upload`;
    // Use so_ (start offset) and generate a JPG thumbnail at that frame
    const transformation = `so_${time},c_fill,w_300,h_200`;
    return `${base}/${transformation}/${publicId}.jpg`;
  }

  /**
   * Convert a Cloudinary video URL to a thumbnail URL
   * Inserts thumbnail transformation and changes extension to .jpg
   * @param videoUrl - Cloudinary video URL
   * @param time - Frame time in seconds (default: 1)
   * @param width - Thumbnail width (default: 800)
   * @param height - Thumbnail height (default: 1200)
   * @returns Thumbnail URL or original URL if not a Cloudinary video URL
   */
  getVideoThumbnailFromUrl(
    videoUrl: string,
    time: number = 1,
    width: number = 800,
    height: number = 1200
  ): string {
    if (!videoUrl || !videoUrl.includes('cloudinary.com')) {
      // Not a Cloudinary URL, return as-is
      return videoUrl;
    }

    // Cloudinary video URL format: 
    // https://res.cloudinary.com/{cloud}/video/upload/{transformations}/{publicId}.{format}
    const uploadIndex = videoUrl.indexOf('/video/upload/');
    if (uploadIndex === -1) {
      return videoUrl; // Invalid Cloudinary video URL format
    }

    // Split URL into base and path parts
    const baseUrl = videoUrl.substring(0, uploadIndex + '/video/upload/'.length);
    const restOfUrl = videoUrl.substring(uploadIndex + '/video/upload/'.length);
    
    // Remove query parameters if any
    const [pathPart, queryPart] = restOfUrl.split('?');
    
    // Replace video file extension with .jpg
    const pathWithJpg = pathPart.replace(/\.(mp4|webm|mov|avi|mkv)$/i, '.jpg');
    
    // Insert thumbnail transformation right after /video/upload/
    // Format: so_{time},c_fill,w_{width},h_{height},q_auto
    const transformation = `so_${time},c_fill,w_${width},h_${height},q_auto`;
    
    // Build the thumbnail URL by inserting transformation
    // If there are existing transformations, they'll be preserved in the path
    // and our transformation will be applied first
    const thumbnailUrl = `${baseUrl}${transformation}/${pathWithJpg}${queryPart ? `?${queryPart}` : ''}`;
    
    return thumbnailUrl;
  }

  /**
   * Transform Cloudinary video URL to MP4 with H.264 codec and AAC audio
   * This ensures iOS compatibility (iOS doesn't support WebM)
   * @param videoUrl - Original Cloudinary video URL
   * @returns Transformed URL with MP4/H.264/AAC format
   */
  getIOSCompatibleVideoUrl(videoUrl: string): string {
    if (!videoUrl || !videoUrl.includes('cloudinary.com')) {
      // Not a Cloudinary URL, return as-is
      return videoUrl;
    }

    // Cloudinary URL format: https://res.cloudinary.com/{cloud}/video/upload/{transformations}/{publicId}.{format}
    // We need to insert /f_mp4/vc_h264/ac_aac/ after /video/upload/
    
    const uploadIndex = videoUrl.indexOf('/video/upload/');
    if (uploadIndex === -1) {
      return videoUrl; // Invalid Cloudinary URL format
    }

    const baseUrl = videoUrl.substring(0, uploadIndex + '/video/upload/'.length);
    const restOfUrl = videoUrl.substring(uploadIndex + '/video/upload/'.length);

    // Check if f_mp4/vc_h264/ac_aac transformations already exist
    if (restOfUrl.includes('f_mp4/vc_h264/ac_aac')) {
      return videoUrl; // Already transformed
    }

    // Insert the transformations right after /video/upload/
    // Format: /f_mp4/vc_h264/ac_aac/
    return `${baseUrl}f_mp4/vc_h264/ac_aac/${restOfUrl}`;
  }

  /**
   * Get transformed avatar URL with optimizations
   */
  getAvatarUrl(publicId: string): string {
    // Build URL manually to avoid SDK object placeholders in the path
    // Example: https://res.cloudinary.com/<cloud>/image/upload/c_fill,g_face,w_300,h_300,q_auto,f_auto/<publicId>
    const cloudName = this.cloudName;
    const base = `https://res.cloudinary.com/${cloudName}/image/upload`;
    const transformation = `c_fill,g_face,w_300,h_300,q_auto,f_auto`;
    return `${base}/${transformation}/${publicId}`;
  }

  /**
   * Get transformed portfolio image URL
   */
  getPortfolioImageUrl(publicId: string, width: number = 800, height: number = 600): string {
    const cloudName = this.cloudName;
    const base = `https://res.cloudinary.com/${cloudName}/image/upload`;
    const transformation = `c_limit,w_${width},h_${height},q_auto,f_auto`;
    return `${base}/${transformation}/${publicId}`;
  }

  /**
   * Generate avatar upload options
   */
  getAvatarUploadOptions(): UploadOptions {
    return {
      folder: 'tattoola/avatars',
      // Transformations will be applied when retrieving the image
    };
  }

  /**
   * Generate certificate upload options
   */
  getCertificateUploadOptions(): UploadOptions {
    return {
      folder: 'tattoola/certificates',
      resourceType: 'raw',
    };
  }

  /**
   * Generate portfolio media upload options
   */
  getPortfolioUploadOptions(type: 'image' | 'video'): UploadOptions {
    return {
      folder: 'tattoola/portfolio',
      resourceType: type === 'video' ? 'video' : 'image',
      // Server-side safeguard: Cloudinary will reject files exceeding these limits
      maxFileSize: type === 'video' ? UPLOAD_MAX_VIDEO_SIZE : UPLOAD_MAX_IMAGE_SIZE,
      // Transformations will be applied when retrieving the image
    };
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
