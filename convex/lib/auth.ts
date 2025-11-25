import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { AuthenticationError } from "./errors";

/**
 * Get the authenticated user ID, throwing an error if not authenticated
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new AuthenticationError();
  }
  return userId;
}

/**
 * Get the authenticated user ID, returning null if not authenticated
 */
export async function getOptionalAuth(ctx: QueryCtx | MutationCtx): Promise<Id<"users"> | null> {
  return await getAuthUserId(ctx);
}

/**
 * Get the authenticated user document, throwing an error if not found
 */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await requireAuth(ctx);
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }
  return user;
}

/**
 * Get the authenticated user document, returning null if not found
 */
export async function getOptionalUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getOptionalAuth(ctx);
  if (!userId) {
    return null;
  }
  return await ctx.db.get(userId);
}

/**
 * Require user to be authenticated and email verified
 * OAuth users (Google) are automatically considered verified
 * Password users must verify their email
 */
export async function requireVerifiedUser(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  
  // If user signed up with password (has email but no OAuth), require verification
  if (user.email && !user.emailVerificationTime) {
    throw new AuthenticationError("Email verification required");
  }
  
  return user;
}

/**
 * Check if user is verified
 * OAuth users are automatically verified
 * Password users need emailVerificationTime set
 */
export async function isUserVerified(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const user = await getOptionalUser(ctx);
  if (!user) return false;
  
  // If no email, user is anonymous or OAuth - consider verified
  // If has email, check for emailVerificationTime
  return !user.email || !!user.emailVerificationTime;
}
