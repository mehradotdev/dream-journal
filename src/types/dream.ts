import { type Id } from "~/convex/_generated/dataModel";

export interface DreamEntry {
  _id: Id<"dreamEntries">;
  _creationTime: number;
  userId: Id<"users">;
  description: string;
  mood: string;
  sleepQuality: number;
  priorNightActivities: string;
  dreamDate: string;
  dreamTime?: string;
  dreamDateTime?: number;
}

export interface DreamEntryFormData {
  description: string;
  mood: string;
  sleepQuality: number;
  priorNightActivities: string;
  dreamDate: string;
  dreamTime: string;
  dreamTimeTimezone: string;
}

export interface DreamFormData {
  description: string;
  mood: string;
  sleepQuality: number;
  priorNightActivities: string;
  dreamDate: string;
  dreamTime: string;
  dreamTimeTimezone: string;
}

export const MOODS = [
  'Happy',
  'Peaceful',
  'Excited',
  'Anxious',
  'Confused',
  'Scared',
  'Sad',
  'Neutral',
] as const;
