/**
 * Safe logger that works in both development and production
 * In production, console methods might be stripped or cause errors
 */

const isDevelopment = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

// For critical errors that should always be logged
export const criticalError = (message: string, error?: any) => {
  try {
    console.error(`[CRITICAL] ${message}`, error);
  } catch (e) {
    // Silently fail if console.error doesn't work
  }
};

