import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createDreamEntry = mutation({
  args: {
    description: v.string(),
    mood: v.string(),
    sleepQuality: v.number(),
    priorNightActivities: v.string(),
    dreamDate: v.string(),
    dreamTime: v.string(),
    dreamTimeTimezone: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const timeToUse = args.dreamTime || "00:00";

    // 1. Construct a standard ISO 8601 string
    const isoString = `${args.dreamDate}T${timeToUse}:00${args.dreamTimeTimezone}`;

    // 2. Parse directly into a Date object
    const dreamDateObj = new Date(isoString);

    if (isNaN(dreamDateObj.getTime())) {
      throw new Error("Invalid date, time, or timezone format.");
    }

    const dreamDateTime = dreamDateObj.getTime();

    // 3. Validate Future Date
    const now = Date.now();
    const buffer = 60 * 1000; 

    if (dreamDateTime > (now + buffer)) {
      throw new Error("Dream date and time cannot be in the future");
    }

    if (args.sleepQuality < 1 || args.sleepQuality > 5) {
      throw new Error("Sleep quality must be between 1 and 5");
    }

    return await ctx.db.insert("dreamEntries", {
      userId,
      description: args.description,
      mood: args.mood,
      sleepQuality: args.sleepQuality,
      priorNightActivities: args.priorNightActivities,
      dreamDate: args.dreamDate,
      dreamTime: args.dreamTime,
      dreamTimeTimezone: args.dreamTimeTimezone, // <--- IMPORTANT: STORE THIS
      dreamDateTime,
    });
  },
});

export const getDreamEntries = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const entries = await ctx.db
      .query("dreamEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return entries.sort((a, b) => {
      const aTime = a.dreamDateTime || a._creationTime;
      const bTime = b.dreamDateTime || b._creationTime;
      return bTime - aTime;
    });
  },
});

export const updateDreamEntry = mutation({
  args: {
    id: v.id("dreamEntries"),
    description: v.string(),
    mood: v.string(),
    sleepQuality: v.number(),
    priorNightActivities: v.string(),
    dreamDate: v.string(),
    dreamTime: v.optional(v.string()),
    dreamTimeTimezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingEntry = await ctx.db.get(args.id);
    if (!existingEntry || existingEntry.userId !== userId) {
      throw new Error("Dream entry not found or not authorized");
    }

    // Determine the time to use
    const timeToUse = args.dreamTime !== undefined ? args.dreamTime : (existingEntry.dreamTime || "00:00");
    
    // Determine timezone to use
    // PRIORITY: 1. New Arg -> 2. Stored in DB -> 3. Default +00:00
    const timezoneToUse = args.dreamTimeTimezone || existingEntry.dreamTimeTimezone || "+00:00";

    // 1. Construct ISO string
    const isoString = `${args.dreamDate}T${timeToUse}:00${timezoneToUse}`;
    
    // 2. Parse Date
    const dreamDateObj = new Date(isoString);

    if (isNaN(dreamDateObj.getTime())) {
      throw new Error("Invalid date, time, or timezone format.");
    }

    const dreamDateTime = dreamDateObj.getTime();

    // 3. Validate Future Date
    const now = Date.now();
    const buffer = 60 * 1000;

    if (dreamDateTime > (now + buffer)) {
      throw new Error("Dream date and time cannot be in the future");
    }

    if (args.sleepQuality < 1 || args.sleepQuality > 5) {
      throw new Error("Sleep quality must be between 1 and 5");
    }

    return await ctx.db.patch(args.id, {
      description: args.description,
      mood: args.mood,
      sleepQuality: args.sleepQuality,
      priorNightActivities: args.priorNightActivities,
      dreamDate: args.dreamDate,
      dreamTime: args.dreamTime,
      dreamTimeTimezone: timezoneToUse, // Update the stored timezone if it changed
      dreamDateTime,
    });
  },
});

export const deleteDreamEntry = mutation({
  args: {
    id: v.id("dreamEntries"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingEntry = await ctx.db.get(args.id);
    if (!existingEntry || existingEntry.userId !== userId) {
      throw new Error("Dream entry not found or not authorized");
    }

    return await ctx.db.delete(args.id);
  },
});
