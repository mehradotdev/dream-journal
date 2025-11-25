import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  dreamEntries: defineTable({
    userId: v.id("users"),
    description: v.string(),
    mood: v.string(), // could be any string
    sleepQuality: v.number(), // 1-5 scale
    priorNightActivities: v.string(),
    dreamDate: v.string(), // YYYY-MM-DD format
    dreamTime: v.optional(v.string()), // HH:MM format (24-hour)
    dreamTimeTimezone: v.optional(v.string()), // Timezone string (e.g., "America/New_York", "UTC")
    dreamDateTime: v.optional(v.number()), // Unix timestamp in milliseconds (UTC)
  })
    .index("by_user", ["userId"])
    .index("by_user_and_datetime", ["userId", "dreamDateTime"])
    .index("by_datetime", ["dreamDateTime"]),
  
  emailVerifications: defineTable({
    email: v.string(),
    code: v.string(),
    expiresAt: v.number(),
    verified: v.boolean(),
  })
    .index("by_email", ["email"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
