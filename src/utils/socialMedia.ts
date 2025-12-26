/**
 * Utility functions for social media URL generation and validation
 */

export const createInstagramUrl = (input: string): string => {
  if (!input) return '';
  console.log("input", input);

  const trimmed = input.trim();

  // If it's already a full URL, return normalized version
  if (trimmed.startsWith('http')) {
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
  }

  // Otherwise treat as username
  const cleanUsername = trimmed.replace(/^@/, '');
  

  return `https://www.instagram.com/${cleanUsername}/`;
};

export const createTiktokUrl = (input: string): string => {
  if (!input) return '';

  const trimmed = input.trim();

  // If already a URL → normalize and return
  if (trimmed.startsWith('http')) {
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
  }

  // Remove @ if present
  const cleanUsername = trimmed.replace(/^@/, '');

  return `https://www.tiktok.com/@${cleanUsername}`;
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
