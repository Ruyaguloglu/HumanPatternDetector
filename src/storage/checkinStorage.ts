// src/storage/checkinStorage.ts
//
// ─── WHAT IS THE STORAGE LAYER? ──────────────────────────────────────────────
//
// This file is the ONLY place in the entire app that talks to AsyncStorage.
// No screen, no component, no hook imports AsyncStorage directly.
// They all go through this file.
//
// Why this rule?
//
// Imagine AsyncStorage is a contractor you hired.
// You don't give every employee in your company the contractor's phone number.
// You have one project manager who talks to the contractor.
// If the contractor changes (AsyncStorage → SQLite), you update ONE file.
// Everyone else keeps working — they never knew who the contractor was.
//
// ─── ASYNCSTORAGE EXPLAINED ──────────────────────────────────────────────────
//
// AsyncStorage is React Native's built-in key-value storage.
// Think of it as a dictionary that persists on the phone:
//
//   Key (string)  →  Value (string)
//   "hpd_checkins" → "[{...}, {...}, {...}]"
//
// Important: AsyncStorage only stores STRINGS.
// So we use JSON.stringify() to convert our objects to strings when saving,
// and JSON.parse() to convert strings back to objects when loading.
//
// All AsyncStorage operations are ASYNC — they return Promises.
// We use async/await to handle them cleanly.
//
// ─────────────────────────────────────────────────────────────────────────────

import { CheckIn } from "@/domain/CheckIn";
import AsyncStorage from "@react-native-async-storage/async-storage";

// The key under which ALL check-ins are stored.
// Prefixed with 'hpd_' to avoid conflicts with other apps or libraries
// that might use AsyncStorage with generic key names.
const STORAGE_KEY = "hpd_checkins";

// ─── SAVE ─────────────────────────────────────────────────────────────────────
//
// Saves the complete array of check-ins to storage.
// We always save the ENTIRE array, not individual entries.
//
// Why? Because AsyncStorage is a simple key-value store.
// The simplest approach: one key holds the entire dataset as JSON.
// This works well for our scale (365 entries/year × a few years = small data).
//
// Returns: true if successful, false if it failed
// We return a boolean instead of throwing errors because
// the UI needs to know if saving worked to show the right feedback.

export async function saveCheckins(checkins: CheckIn[]): Promise<boolean> {
  try {
    const json = JSON.stringify(checkins);
    await AsyncStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch (error) {
    console.error("HPD Storage: Failed to save checkins:", error);
    return false;
  }
}

// ─── LOAD ─────────────────────────────────────────────────────────────────────
//
// Loads all check-ins from storage.
// Returns an empty array if nothing is stored yet (first launch).
//
// The try/catch handles two failure cases:
//   1. Storage read fails (device storage full, permissions, etc.)
//   2. JSON.parse fails (data corrupted somehow)
// In both cases we return [] — the app starts fresh rather than crashing.

export async function loadCheckins(): Promise<CheckIn[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);

    // getItem returns null if the key doesn't exist yet (first launch).
    // null means no data → return empty array, not an error.
    if (json === null) {
      return [];
    }

    const parsed = JSON.parse(json);

    // Extra safety: verify we got an array back.
    // If data was corrupted and parsed to something unexpected,
    // return [] rather than crashing downstream.
    if (!Array.isArray(parsed)) {
      console.warn("HPD Storage: Stored data was not an array, resetting.");
      return [];
    }

    return parsed as CheckIn[];
  } catch (error) {
    console.error("HPD Storage: Failed to load checkins:", error);
    return [];
  }
}

// ─── ADD SINGLE ENTRY ─────────────────────────────────────────────────────────
//
// Adds one new check-in to the existing list.
// This is the most common operation — called every time user submits.
//
// Process:
//   1. Load existing entries
//   2. Append the new entry
//   3. Save the complete updated array
//
// Why load-then-save instead of just appending?
// AsyncStorage has no "append" operation. We must read-modify-write.

export async function addCheckin(checkin: CheckIn): Promise<boolean> {
  try {
    const existing = await loadCheckins();
    const updated = [...existing, checkin];
    return await saveCheckins(updated);
  } catch (error) {
    console.error("HPD Storage: Failed to add checkin:", error);
    return false;
  }
}

// ─── DELETE SINGLE ENTRY ──────────────────────────────────────────────────────
//
// Removes one check-in by its ID.
// Uses Array.filter() to create a new array without the deleted entry.
//
// Why filter by ID and not by index?
// IDs are stable. Array indices shift when you delete items.
// Deleting by index could delete the wrong entry if the array changed.

export async function deleteCheckin(id: string): Promise<boolean> {
  try {
    const existing = await loadCheckins();
    const updated = existing.filter((entry) => entry.id !== id);
    return await saveCheckins(updated);
  } catch (error) {
    console.error("HPD Storage: Failed to delete checkin:", error);
    return false;
  }
}

// ─── CLEAR ALL ────────────────────────────────────────────────────────────────
//
// Deletes ALL check-ins. Used in Settings screen for "Reset Data".
// We use AsyncStorage.removeItem() which completely removes the key —
// cleaner than saving an empty array.

export async function clearAllCheckins(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("HPD Storage: Failed to clear checkins:", error);
    return false;
  }
}
