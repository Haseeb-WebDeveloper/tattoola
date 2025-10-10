/**
 * Utility functions for social media URL generation and validation
 */

export const createInstagramUrl = (username: string): string => {
  if (!username) return '';
  const cleanUsername = username.replace(/^@/, '').trim();
  return `https://instagram.com/${cleanUsername}`;
};

export const createTiktokUrl = (username: string): string => {
  if (!username) return '';
  const cleanUsername = username.replace(/^@/, '').trim();
  return `https://tiktok.com/@${cleanUsername}`;
};

export const createWebsiteUrl = (url: string): string => {
  if (!url) return '';
  // Add https:// if no protocol is specified
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

export const validateSocialMediaUsername = (username: string, platform: 'instagram' | 'tiktok'): boolean => {
  if (!username) return false;
  const cleanUsername = username.replace(/^@/, '').trim();
  
  // Basic validation - alphanumeric, underscores, periods, hyphens
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  return validPattern.test(cleanUsername) && cleanUsername.length >= 1;
};

export const formatSocialMediaUsername = (username: string): string => {
  if (!username) return '';
  return username.replace(/^@/, '').trim();
};
