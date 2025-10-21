import type { ArtistSelfProfile } from "@/services/profile.service";
import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize SQLite database and create tables
 */
export async function initDatabase(): Promise<void> {
  try {
    console.log("🗄️ Initializing SQLite database...");
    
    // Open or create database
    db = await SQLite.openDatabaseAsync("tattoola.db");
    
    // Create cached_profiles table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_profiles (
        user_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        last_synced INTEGER NOT NULL,
        version INTEGER DEFAULT 1
      );
    `);
    
    console.log("✅ SQLite database initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}

/**
 * Get database instance
 */
function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

/**
 * Save profile to cache
 */
export async function saveProfileToCache(
  userId: string,
  profileData: ArtistSelfProfile
): Promise<void> {
  try {
    const database = getDatabase();
    const dataJson = JSON.stringify(profileData);
    const timestamp = Date.now();
    
    // Insert or replace profile data
    await database.runAsync(
      `INSERT OR REPLACE INTO cached_profiles (user_id, data, last_synced, version)
       VALUES (?, ?, ?, 1)`,
      [userId, dataJson, timestamp]
    );
    
    console.log("💾 Profile cached successfully for user:", userId);
  } catch (error) {
    console.error("❌ Error saving profile to cache:", error);
    // Don't throw - caching failure shouldn't break the app
  }
}

/**
 * Get profile from cache
 */
export async function getProfileFromCache(
  userId: string
): Promise<ArtistSelfProfile | null> {
  try {
    const database = getDatabase();
    
    const result = await database.getFirstAsync<{
      data: string;
      last_synced: number;
    }>(
      `SELECT data, last_synced FROM cached_profiles WHERE user_id = ?`,
      [userId]
    );
    
    if (!result) {
      console.log("📭 No cached profile found for user:", userId);
      return null;
    }
    
    const profile = JSON.parse(result.data) as ArtistSelfProfile;
    console.log("📦 Profile loaded from cache for user:", userId);
    
    return profile;
  } catch (error) {
    console.error("❌ Error getting profile from cache:", error);
    return null;
  }
}

/**
 * Clear profile cache for a specific user
 */
export async function clearProfileCache(userId: string): Promise<void> {
  try {
    const database = getDatabase();
    
    await database.runAsync(
      `DELETE FROM cached_profiles WHERE user_id = ?`,
      [userId]
    );
    
    console.log("🗑️ Profile cache cleared for user:", userId);
  } catch (error) {
    console.error("❌ Error clearing profile cache:", error);
    // Don't throw - cache clearing failure shouldn't break the app
  }
}

/**
 * Get last sync time for a user's profile
 */
export async function getLastSyncTime(userId: string): Promise<number | null> {
  try {
    const database = getDatabase();
    
    const result = await database.getFirstAsync<{ last_synced: number }>(
      `SELECT last_synced FROM cached_profiles WHERE user_id = ?`,
      [userId]
    );
    
    return result?.last_synced || null;
  } catch (error) {
    console.error("❌ Error getting last sync time:", error);
    return null;
  }
}

/**
 * Check if cache should be refreshed (older than 24 hours)
 */
export async function shouldRefreshCache(userId: string): Promise<boolean> {
  try {
    const lastSync = await getLastSyncTime(userId);
    if (!lastSync) return true;
    
    // Refresh if older than 24 hours
    const hoursSinceSync = (Date.now() - lastSync) / (1000 * 60 * 60);
    return hoursSinceSync > 24;
  } catch (error) {
    console.error("❌ Error checking cache freshness:", error);
    return true; // Refresh on error to be safe
  }
}

/**
 * Clear all cached profiles (useful for logout or debugging)
 */
export async function clearAllProfileCache(): Promise<void> {
  try {
    const database = getDatabase();
    
    await database.runAsync(`DELETE FROM cached_profiles`);
    
    console.log("🗑️ All profile cache cleared");
  } catch (error) {
    console.error("❌ Error clearing all profile cache:", error);
  }
}

/**
 * Get cache statistics (for debugging)
 */
export async function getCacheStats(): Promise<{
  totalProfiles: number;
  oldestSync: number | null;
  newestSync: number | null;
}> {
  try {
    const database = getDatabase();
    
    const result = await database.getFirstAsync<{
      total: number;
      oldest: number | null;
      newest: number | null;
    }>(
      `SELECT 
        COUNT(*) as total,
        MIN(last_synced) as oldest,
        MAX(last_synced) as newest
       FROM cached_profiles`
    );
    
    return {
      totalProfiles: result?.total || 0,
      oldestSync: result?.oldest || null,
      newestSync: result?.newest || null,
    };
  } catch (error) {
    console.error("❌ Error getting cache stats:", error);
    return { totalProfiles: 0, oldestSync: null, newestSync: null };
  }
}

