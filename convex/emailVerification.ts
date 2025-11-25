import { v } from "convex/values";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { EmailService } from "./lib/email";
import { emailValidationArgs, validateEmail, validateVerificationCode } from "./lib/validation";
import { ValidationError, NotFoundError } from "./lib/errors";
import { VERIFICATION_CODE_EXPIRY_MINUTES } from "./lib/constants";

/**
 * Send verification email
 */
export const sendVerificationEmail = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    if (!validateEmail(args.email)) {
      throw new ValidationError("Invalid email format");
    }

    const emailService = new EmailService();
    const code = emailService.generateVerificationCode();
    
    // Store the verification code in the database
    await ctx.runMutation(internal.emailVerification.storeVerificationCode, {
      email: args.email,
      code,
    });

    // Send the email
    await emailService.sendVerificationEmail(args.email, code);

    return { success: true };
  },
});

/**
 * Store verification code in database
 */
export const storeVerificationCode = internalMutation({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const expiresAt = Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000;
    
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

/**
 * Verify the code
 */
export const verifyEmail = mutation({
  args: emailValidationArgs,
  handler: async (ctx, args) => {
    if (!validateEmail(args.email)) {
      throw new ValidationError("Invalid email format");
    }

    if (!validateVerificationCode(args.code)) {
      throw new ValidationError("Invalid verification code format");
    }

    const verification = await ctx.db
      .query("emailVerifications")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("code"), args.code))
      .first();

    if (!verification) {
      throw new NotFoundError("Verification code");
    }

    if (verification.expiresAt < Date.now()) {
      throw new ValidationError("Verification code has expired");
    }

    // Check if user's email is already verified
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.emailVerificationTime) {
      // Email already verified, return success
      return { success: true, alreadyVerified: true };
    }

    if (verification.verified) {
      // Mark the user as verified if not already
      await ctx.db.patch(user._id, {
        emailVerificationTime: Date.now(),
      });
      return { success: true, alreadyVerified: true };
    }

    // Mark as verified
    await ctx.db.patch(verification._id, { verified: true });

    // Update user's email verification status
    await ctx.db.patch(user._id, {
      emailVerificationTime: Date.now(),
    });

    return { success: true, alreadyVerified: false };
  },
});

/**
 * Check if email is verified
 */
export const isEmailVerified = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    if (!validateEmail(args.email)) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    return !!user?.emailVerificationTime;
  },
});
