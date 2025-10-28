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
      // Transformations will be applied when retrieving the image
    };
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
