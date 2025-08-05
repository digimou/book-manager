/**
 * Format a date as a relative time (e.g., "2 days ago")
 * Client-side relative time formatting
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Copy text to clipboard
 * Client-side clipboard utility
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * Download file from blob
 * Client-side file download utility
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get file size in human readable format
 * Client-side file size formatting
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Validate password strength
 * Client-side password validation
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

import { Session } from "next-auth";
import { USER_ROLES } from "@/lib/constants";

// Extract user role from session
export function getUserRole(session: Session | null): string | null {
  if (!session?.user) return null;
  return (session.user as unknown as { role: string }).role;
}

// Extract user ID from session
export function getUserId(session: Session | null): string | null {
  if (!session?.user) return null;
  return session.user.id || null;
}

// Check if user is admin
export function isAdmin(session: Session | null): boolean {
  const role = getUserRole(session);
  return role === USER_ROLES.ADMIN;
}

// Check if user is bookkeeper
export function isBookkeeper(session: Session | null): boolean {
  const role = getUserRole(session);
  return role === USER_ROLES.BOOKKEEPER;
}

// Check if user is regular user
export function isUser(session: Session | null): boolean {
  const role = getUserRole(session);
  return role === USER_ROLES.USER;
}

// Check if user is owner of a resource
export function isOwner(session: Session | null, ownerId: string): boolean {
  const userId = getUserId(session);
  return userId === ownerId;
}

// Check if user can edit (owner or admin)
export function canEdit(session: Session | null, ownerId: string): boolean {
  return isOwner(session, ownerId) || isAdmin(session);
}

// Check if user can transfer (owner or admin)
export function canTransfer(session: Session | null, ownerId: string): boolean {
  return isOwner(session, ownerId) || isAdmin(session);
}

// Check if user can add books (bookkeeper or admin)
export function canAddBooks(session: Session | null): boolean {
  return isBookkeeper(session) || isAdmin(session);
}

// Check if user can manage users (admin only)
export function canManageUsers(session: Session | null): boolean {
  return isAdmin(session);
}

// Get user display name
export function getUserDisplayName(session: Session | null): string {
  if (!session?.user) return "Unknown User";
  return session.user.name || session.user.email || "Unknown User";
}

// Get user email
export function getUserEmail(session: Session | null): string | null {
  if (!session?.user) return null;
  return session.user.email || null;
}
