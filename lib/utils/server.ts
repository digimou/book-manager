import crypto from "crypto";

/**
 * Generate a unique RFID tag for books
 * Server-side RFID generation utility
 */
export function generateRFIDTag(): string {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString("hex");
  return `RFID_${timestamp}_${randomBytes}`;
}

/**
 * Generate a secure OTP code
 * Server-side OTP generation utility
 */
export function generateOTP(): string {
  // Use crypto.randomInt for better security than Math.random
  const min = 100000;
  const max = 999999;
  return crypto.randomInt(min, max + 1).toString();
}

/**
 * Generate a secure random string
 * Server-side random string generation
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Hash a string using SHA-256
 * Server-side hashing utility
 */
export function hashString(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Generate a secure token
 * Server-side token generation
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validate ISBN format
 * Server-side ISBN validation
 */
export function isValidISBN(isbn: string): boolean {
  // Remove hyphens and spaces
  const cleanISBN = isbn.replace(/[-\s]/g, "");

  // Check if it's 10 or 13 digits
  if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
    return false;
  }

  // Basic format validation
  const isbnRegex = /^(?:\d{9}[\dX]|\d{13})$/;
  return isbnRegex.test(cleanISBN);
}

/**
 * Sanitize user input
 * Server-side input sanitization
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate and format phone number
 * Server-side phone validation
 */
export function formatPhoneNumber(phone: string): string | null {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Check if it's a valid length (10-15 digits)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return null;
  }

  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  }

  return cleaned;
}

/**
 * Generate a slug from a string
 * Server-side slug generation
 */
export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Calculate pagination metadata
 * Server-side pagination utility
 */
export function calculatePagination(
  totalItems: number,
  currentPage: number,
  itemsPerPage: number
): {
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
} {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    totalPages,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
  };
}

/**
 * Validate file upload
 * Server-side file validation
 */
export function validateFileUpload(
  file: { size: number; mimetype: string } | null,
  maxSize: number = 5 * 1024 * 1024, // 5MB default
  allowedTypes: string[] = ["image/jpeg", "image/png", "image/gif"]
): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: "No file provided" };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: "File size exceeds limit" };
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return { isValid: false, error: "File type not allowed" };
  }

  return { isValid: true };
}

/**
 * Generate a unique filename
 * Server-side filename generation
 */
export function generateUniqueFilename(
  originalName: string,
  prefix: string = ""
): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(4).toString("hex");
  const extension = originalName.split(".").pop();
  const name = originalName.split(".")[0];

  return `${prefix}${name}_${timestamp}_${randomString}.${extension}`;
}

/**
 * Format bytes to human readable size
 * Server-side file size formatting
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Check if a string contains profanity
 * Server-side content moderation
 */
export function containsProfanity(text: string): boolean {
  const profanityWords = [
    // Add your profanity list here
    "badword1",
    "badword2",
    // ... more words
  ];

  const lowerText = text.toLowerCase();
  return profanityWords.some((word) => lowerText.includes(word));
}

/**
 * Generate a secure password hash
 * Server-side password hashing
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 * Server-side password verification
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}
