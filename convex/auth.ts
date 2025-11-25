import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Resend } from "resend";

// Auth configuration
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Password,
  ],
});

// Get logged in user
export const loggedInUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});

// Email Verification Logic

// Generate a random 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email
export const sendVerificationEmail = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const code = generateVerificationCode();
    
    // Store the verification code in the database
    await ctx.runMutation(internal.auth.storeVerificationCode, {
      email: args.email,
      code,
    });

    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send the email
    const { error } = await resend.emails.send({
      from: "Dream Journal <noreply@dreamjournal.example.com>",
      to: args.email,
      subject: "Verify your Dream Journal account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Verify Your Email</h1>
          <p>Welcome to Dream Journal! Please verify your email address by entering this code:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h2 style="color: #1f2937; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h2>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }

    return { success: true };
  },
});

// Store verification code in database
export const storeVerificationCode = internalMutation({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    
    // Delete any existing verification codes for this email
    const existing = await ctx.db
      .query("emailVerifications")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    
    for (const record of existing) {
      await ctx.db.delete(record._id);
    }

    // Store the new verification code
    await ctx.db.insert("emailVerifications", {
      email: args.email,
      code: args.code,
      expiresAt,
      verified: false,
    });
  },
});

// Verify the code
export const verifyEmail = mutation({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const verification = await ctx.db
      .query("emailVerifications")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("code"), args.code))
      .first();

    if (!verification) {
      throw new Error("Invalid verification code");
    }

    if (verification.expiresAt < Date.now()) {
      throw new Error("Verification code has expired");
    }

    if (verification.verified) {
      throw new Error("Email already verified");
    }

    // Mark as verified
    await ctx.db.patch(verification._id, { verified: true });

    // Update user's email verification status
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        emailVerificationTime: Date.now(),
      });
    }

    return { success: true };
  },
});

// Check if email is verified
export const isEmailVerified = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    return user?.emailVerificationTime ? true : false;
  },
});

// Account Linking Logic

// Link accounts with the same verified email
export const linkAccountsByEmail = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || !currentUser.email) {
      throw new Error("User not found or no email");
    }

    // Check if current user's email is verified
    if (!currentUser.emailVerificationTime) {
      throw new Error("Email not verified");
    }

    // Find other users with the same verified email
    const otherUsers = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", currentUser.email))
      .filter((q) => 
        q.and(
          q.neq(q.field("_id"), userId),
          q.neq(q.field("emailVerificationTime"), undefined)
        )
      )
      .collect();

    if (otherUsers.length === 0) {
      return { linked: false, message: "No other verified accounts found with this email" };
    }

    // For each other user, transfer their data to the current user
    for (const otherUser of otherUsers) {
      // Transfer dream entries
      const dreamEntries = await ctx.db
        .query("dreamEntries")
        .withIndex("by_user", (q) => q.eq("userId", otherUser._id))
        .collect();

      for (const entry of dreamEntries) {
        await ctx.db.patch(entry._id, { userId });
      }

      // Delete the other user account
      await ctx.db.delete(otherUser._id);
    }

    return { 
      linked: true, 
      message: `Successfully linked ${otherUsers.length} account(s)`,
      transferredEntries: otherUsers.length
    };
  },
});

// Check for linkable accounts
export const checkLinkableAccounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || !currentUser.email) {
      return null;
    }

    // Find other users with the same email
    const otherUsers = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", currentUser.email))
      .filter((q) => q.neq(q.field("_id"), userId))
      .collect();

    const verifiedOthers = otherUsers.filter(user => user.emailVerificationTime);
    const unverifiedOthers = otherUsers.filter(user => !user.emailVerificationTime);

    return {
      currentUserVerified: !!currentUser.emailVerificationTime,
      linkableAccounts: verifiedOthers.length,
      unverifiedAccounts: unverifiedOthers.length,
      canLink: !!currentUser.emailVerificationTime && verifiedOthers.length > 0
    };
  },
});
