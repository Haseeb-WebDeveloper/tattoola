// Debug configuration for React Native/Expo
// This file helps ensure console logs are properly displayed

// Enable all console methods
if (typeof console !== 'undefined') {
  // Ensure console.log is available
  if (!console.log) {
    console.log = () => {};
  }
  
  // Ensure console.error is available
  if (!console.error) {
    console.error = console.log;
  }
  
  // Ensure console.warn is available
  if (!console.warn) {
    console.warn = console.log;
  }
  
  // Ensure console.info is available
  if (!console.info) {
    console.info = console.log;
  }
}

// Override console methods to ensure they work in all environments
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  originalLog('[LOG]', ...args);
};

console.error = (...args) => {
  originalError('[ERROR]', ...args);
};

console.warn = (...args) => {
  originalWarn('[WARN]', ...args);
};

console.info = (...args) => {
  originalLog('[INFO]', ...args);
};

// Export for use in other files
module.exports = {
  enableDebugLogging: true
};
