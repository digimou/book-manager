// User Roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  BOOKKEEPER: "BOOKKEEPER",
  USER: "USER",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Book Status
export const BOOK_STATUS = {
  AVAILABLE: "AVAILABLE",
  ISSUED: "ISSUED",
  RESERVED: "RESERVED",
  MAINTENANCE: "MAINTENANCE",
  LOST: "LOST",
} as const;

export type BookStatus = (typeof BOOK_STATUS)[keyof typeof BOOK_STATUS];

// Issue Status
export const ISSUE_STATUS = {
  ISSUED: "ISSUED",
  RETURNED: "RETURNED",
  OVERDUE: "OVERDUE",
  LOST: "LOST",
} as const;

export type IssueStatus = (typeof ISSUE_STATUS)[keyof typeof ISSUE_STATUS];

// Book Genres
export const BOOK_GENRES = {
  FICTION: "FICTION",
  NON_FICTION: "NON_FICTION",
  SCIENCE_FICTION: "SCIENCE_FICTION",
  MYSTERY: "MYSTERY",
  ROMANCE: "ROMANCE",
  THRILLER: "THRILLER",
  BIOGRAPHY: "BIOGRAPHY",
  HISTORY: "HISTORY",
  SCIENCE: "SCIENCE",
  TECHNOLOGY: "TECHNOLOGY",
  PHILOSOPHY: "PHILOSOPHY",
  RELIGION: "RELIGION",
  ART: "ART",
  MUSIC: "MUSIC",
  TRAVEL: "TRAVEL",
  COOKING: "COOKING",
  HEALTH: "HEALTH",
  EDUCATION: "EDUCATION",
  CHILDREN: "CHILDREN",
  YOUNG_ADULT: "YOUNG_ADULT",
  OTHER: "OTHER",
} as const;

export type BookGenre = (typeof BOOK_GENRES)[keyof typeof BOOK_GENRES];

// OTP Types
export const OTP_TYPES = {
  BOOK_ISSUE: "BOOK_ISSUE",
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;

export type OTPType = (typeof OTP_TYPES)[keyof typeof OTP_TYPES];

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// OTP Configuration
export const OTP_CONFIG = {
  EXPIRY_MINUTES: 10,
  LENGTH: 6,
} as const;

// Email Configuration
export const EMAIL_CONFIG = {
  DEFAULT_PORT: 587,
  SECURE: false,
} as const;

// Database Configuration
export const DB_CONFIG = {
  LOG_QUERIES: ["query"] as "query"[],
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MIN_NAME_LENGTH: 1,
  MIN_BOOK_COPIES: 1,
} as const;

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  DASHBOARD: "/dashboard",
  BOOKS: "/books",
  BOOKS_ADD: "/books/add",
  USERS: "/users",
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
  },
  BOOKS: {
    LIST: "/api/books",
    CREATE: "/api/books",
    GET: (id: string) => `/api/books/${id}`,
    UPDATE: (id: string) => `/api/books/${id}`,
    DELETE: (id: string) => `/api/books/${id}`,
  },
  ISSUES: {
    LIST: "/api/issues",
    CREATE: "/api/issues",
    RETURN: "/api/issues",
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  BOOK_NOT_FOUND: "Book not found",
  USER_NOT_FOUND: "User not found",
  INVALID_OTP: "Invalid OTP",
  OTP_EXPIRED: "OTP expired",
  NO_COPIES_AVAILABLE: "No copies available for this book",
  BOOK_WITH_ACTIVE_ISSUES: "Cannot delete book with active issues",
  USER_ALREADY_EXISTS: "User with this email already exists",
  BOOK_ALREADY_EXISTS: "Book with this ISBN already exists",
  VALIDATION_ERROR: "Validation error",
  INTERNAL_SERVER_ERROR: "Internal server error",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  BOOK_CREATED: "Book created successfully",
  BOOK_UPDATED: "Book updated successfully",
  BOOK_DELETED: "Book deleted successfully",
  BOOK_ISSUED: "Book issued successfully",
  BOOK_RETURNED: "Book returned successfully",
  USER_REGISTERED: "Registration successful! Redirecting to login...",
} as const;
