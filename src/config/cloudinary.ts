// Cloudinary Configuration
// Replace these with your actual Cloudinary credentials

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset',
};

// Default upload presets for different file types
export const UPLOAD_PRESETS = {
  AVATAR: 'tattoola_avatar',
  CERTIFICATE: 'tattoola_certificate',
  PORTFOLIO_IMAGE: 'tattoola_portfolio_image',
  PORTFOLIO_VIDEO: 'tattoola_portfolio_video',
};

// File size limits (in bytes)
export const FILE_LIMITS = {
  AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  CERTIFICATE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  PORTFOLIO_IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  PORTFOLIO_VIDEO_MAX_SIZE: 100 * 1024 * 1024, // 100MB
};

// Allowed file types
export const ALLOWED_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  VIDEO: ['video/mp4', 'video/webm'],
  DOCUMENT: ['application/pdf', 'image/jpeg', 'image/png'],
};


