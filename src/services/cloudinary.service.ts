import { CLOUDINARY_CONFIG } from '@/config/cloudinary';
import { Cloudinary } from '@cloudinary/url-gen';

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
        console.error('Cloudinary upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(`Upload failed: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Cloudinary upload successful:', {
        publicId: result.public_id,
        secureUrl: result.secure_url,
      });
      
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
    const image = cloudinary.image(publicId);
    
    // Apply transformations
    if (transformations.width) {
      image.resize({ width: transformations.width });
    }
    if (transformations.height) {
      image.resize({ height: transformations.height });
    }
    if (transformations.quality) {
      image.quality(transformations.quality);
    }
    if (transformations.format) {
      image.format(transformations.format);
    }
    if (transformations.crop) {
      image.resize({ crop: transformations.crop });
    }

    return image.toURL();
  }

  /**
   * Get video thumbnail URL
   */
  getVideoThumbnailUrl(publicId: string, time: number = 1): string {
    const video = cloudinary.video(publicId);
    video.videoEdit({ startOffset: time });
    video.resize({ width: 300, height: 200, crop: 'fill' });
    return video.toURL();
  }

  /**
   * Get transformed avatar URL with optimizations
   */
  getAvatarUrl(publicId: string): string {
    const image = cloudinary.image(publicId);
    image.resize({ width: 300, height: 300, crop: 'fill', gravity: 'face' });
    image.quality('auto');
    image.format('auto');
    return image.toURL();
  }

  /**
   * Get transformed portfolio image URL
   */
  getPortfolioImageUrl(publicId: string, width: number = 800, height: number = 600): string {
    const image = cloudinary.image(publicId);
    image.resize({ width, height, crop: 'limit' });
    image.quality('auto');
    image.format('auto');
    return image.toURL();
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
      // Transformations will be applied when retrieving the image
    };
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
