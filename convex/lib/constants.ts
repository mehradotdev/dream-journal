/**
 * Application constants
 */
export const VERIFICATION_CODE_EXPIRY_MINUTES = 10;
export const VERIFICATION_CODE_LENGTH = 6;

export const SLEEP_QUALITY_RANGE = {
  MIN: 1,
  MAX: 10,
} as const;

export const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const EMAIL_CONFIG = {
  FROM: "Dream Journal <noreply@updates.mehra.dev>",
  SUBJECT: "Verify your Dream Journal account",
} as const;
