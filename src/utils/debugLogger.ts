// Debug logger utility to ensure console logs are working
// Use this instead of console.log for critical debugging

export class DebugLogger {
  private static isEnabled = __DEV__;

  static log(message: string, ...args: any[]) {
    if (this.isEnabled) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  static error(message: string, ...args: any[]) {
    if (this.isEnabled) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  static warn(message: string, ...args: any[]) {
    if (this.isEnabled) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  static info(message: string, ...args: any[]) {
    if (this.isEnabled) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  static test() {
    this.log("DebugLogger test - this should be visible in console");
    this.error("DebugLogger error test - this should be visible in console");
    this.warn("DebugLogger warn test - this should be visible in console");
    this.info("DebugLogger info test - this should be visible in console");
  }
}

// Test logging on import
if (__DEV__) {
  DebugLogger.test();
}
