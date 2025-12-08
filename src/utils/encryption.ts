import AsyncStorage from "@react-native-async-storage/async-storage";

const ENCRYPTION_KEY_STORAGE_KEY = "@tattoola:encryption_key";
const KEY_DERIVATION_SALT = "tattoola-app-salt-v1"; // App-specific salt

// Lazy load expo-crypto with error handling for Expo Go compatibility
let Crypto: typeof import("expo-crypto") | null = null;

async function loadCryptoModule() {
  if (Crypto !== null) return Crypto;

  try {
    Crypto = await import("expo-crypto");
    return Crypto;
  } catch (error) {
    console.warn("expo-crypto not available (likely Expo Go), using fallback");
    return null;
  }
}

/**
 * Get or generate encryption key
 * Uses device-specific identifier combined with app salt for key derivation
 * Falls back to a simple key generation if expo-crypto is not available (Expo Go)
 */
async function getEncryptionKey(): Promise<string> {
  try {
    // Try to get existing key from storage
    const existingKey = await AsyncStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
    if (existingKey) {
      return existingKey;
    }

    // Try to use expo-crypto if available
    const cryptoModule = await loadCryptoModule();

    if (cryptoModule) {
      // Generate a new key using device ID and app salt
      const deviceId = await cryptoModule.getRandomBytesAsync(32);
      const deviceIdHex = Array.from(deviceId)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Derive key using SHA-256 hash of device ID + salt
      const keyMaterial = `${deviceIdHex}${KEY_DERIVATION_SALT}`;
      const keyHash = await cryptoModule.digestStringAsync(
        cryptoModule.CryptoDigestAlgorithm.SHA256,
        keyMaterial
      );

      // Store the key for future use
      await AsyncStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, keyHash);
      return keyHash;
    } else {
      // Fallback for Expo Go: use a deterministic key based on storage
      // This is less secure but allows the app to work in Expo Go
      // Create a simple hash-like string from the salt and timestamp
      const fallbackKey = `${KEY_DERIVATION_SALT}-${Date.now()}`;
      // Convert to hex-like string manually (works in React Native)
      const simpleHash = Array.from(new TextEncoder().encode(fallbackKey))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 64)
        .padEnd(64, "0"); // Ensure it's always 64 chars
      await AsyncStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, simpleHash);
      return simpleHash;
    }
  } catch (error) {
    console.error("Error getting encryption key:", error);
    // Fallback to a default key (less secure but prevents app crash)
    return KEY_DERIVATION_SALT;
  }
}

/**
 * Simple XOR encryption/decryption (lightweight for mobile)
 * Note: For production, consider using AES-GCM via expo-crypto or react-native-quick-crypto
 */
function xorEncryptDecrypt(data: string, key: string): string {
  const dataBytes = new TextEncoder().encode(data);
  const keyBytes = new TextEncoder().encode(key);
  const encrypted = new Uint8Array(dataBytes.length);

  for (let i = 0; i < dataBytes.length; i++) {
    encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return Array.from(encrypted)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function xorDecrypt(encryptedHex: string, key: string): string {
  const encrypted = new Uint8Array(
    encryptedHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );
  const keyBytes = new TextEncoder().encode(key);
  const decrypted = new Uint8Array(encrypted.length);

  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
  }

  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypt data using device-specific key
 */
export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const encrypted = xorEncryptDecrypt(data, key);
    return encrypted;
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw error;
  }
}

/**
 * Decrypt data using device-specific key
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const decrypted = xorDecrypt(encryptedData, key);
    return decrypted;
  } catch (error) {
    console.error("Error decrypting data:", error);
    throw error;
  }
}

/**
 * Encrypt JSON object
 */
export async function encryptJSON<T>(data: T): Promise<string> {
  const jsonString = JSON.stringify(data);
  return encryptData(jsonString);
}

/**
 * Decrypt JSON object
 */
export async function decryptJSON<T>(encryptedData: string): Promise<T | null> {
  try {
    const decrypted = await decryptData(encryptedData);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error("Error decrypting JSON:", error);
    return null;
  }
}
