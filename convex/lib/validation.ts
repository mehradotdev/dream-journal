import { v } from "convex/values";
import { SLEEP_QUALITY_RANGE, DATE_FORMAT_REGEX } from "./constants";

/**
 * Validation schemas for dream entries
 */
export const dreamEntryValidators = {
  description: v.string(),
  mood: v.string(),
  sleepQuality: v.number(),
  priorNightActivities: v.string(),
  dreamDate: v.string(),
  dreamTime: v.string(),
  dreamTimeTimezone: v.string(),
};

export const createDreamEntryArgs = {
  description: dreamEntryValidators.description,
  mood: dreamEntryValidators.mood,
  sleepQuality: dreamEntryValidators.sleepQuality,
  priorNightActivities: dreamEntryValidators.priorNightActivities,
  dreamDate: dreamEntryValidators.dreamDate,
  dreamTime: dreamEntryValidators.dreamTime,
  dreamTimeTimezone: dreamEntryValidators.dreamTimeTimezone,
};

export const updateDreamEntryArgs = {
  id: v.id("dreamEntries"),
  description: dreamEntryValidators.description,
  mood: dreamEntryValidators.mood,
  sleepQuality: dreamEntryValidators.sleepQuality,
  priorNightActivities: dreamEntryValidators.priorNightActivities,
};

export const emailValidationArgs = {
  email: v.string(),
  code: v.string(),
};

/**
 * Business logic validation for dream entries
 */
export function validateDreamEntry(args: {
  sleepQuality: number;
  dreamDate: string;
  description: string;
  mood: string;
  priorNightActivities: string;
  dreamTime: string;
  dreamTimeTimezone: string;
}) {
  // Validate sleep quality range
  if (args.sleepQuality < SLEEP_QUALITY_RANGE.MIN || args.sleepQuality > SLEEP_QUALITY_RANGE.MAX) {
    throw new Error(`Sleep quality must be between ${SLEEP_QUALITY_RANGE.MIN} and ${SLEEP_QUALITY_RANGE.MAX}`);
  }

  // Validate date format (YYYY-MM-DD)
  if (!DATE_FORMAT_REGEX.test(args.dreamDate)) {
    throw new Error("Dream date must be in YYYY-MM-DD format");
  }

  // Validate date is not in the future
  const dreamDate = new Date(args.dreamDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  if (dreamDate > today) {
    throw new Error("Dream date cannot be in the future");
  }

  // Validate required fields are not empty
  if (!args.description.trim()) {
    throw new Error("Dream description is required");
  }

  if (!args.mood.trim()) {
    throw new Error("Mood is required");
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate verification code format
 */
export function validateVerificationCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}
