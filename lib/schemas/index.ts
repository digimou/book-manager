import { z } from "zod";
import { USER_ROLES, VALIDATION, BOOK_GENRES } from "@/lib/constants";

// Base schemas for common fields
export const baseNameSchema = z
  .string()
  .min(VALIDATION.MIN_NAME_LENGTH, { message: "Name is required" });

export const baseEmailSchema = z
  .string()
  .email({ message: "Invalid email address" });

export const basePasswordSchema = z
  .string()
  .min(VALIDATION.MIN_PASSWORD_LENGTH, {
    message: "Password must be at least 6 characters",
  });

export const baseRoleSchema = z.enum([
  USER_ROLES.USER,
  USER_ROLES.BOOKKEEPER,
  USER_ROLES.ADMIN,
]);

// User schemas
export const createUserSchema = z.object({
  name: baseNameSchema,
  email: baseEmailSchema,
  password: basePasswordSchema,
  role: baseRoleSchema,
});

export const updateUserSchema = z.object({
  name: baseNameSchema,
  email: baseEmailSchema,
  role: baseRoleSchema,
});

export const changePasswordSchema = z
  .object({
    password: basePasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Auth schemas
export const loginSchema = z.object({
  email: baseEmailSchema,
  password: basePasswordSchema,
});

// Book schemas
export const baseBookTitleSchema = z
  .string()
  .min(VALIDATION.MIN_NAME_LENGTH, { message: "Title is required" });

export const baseBookAuthorSchema = z
  .string()
  .min(VALIDATION.MIN_NAME_LENGTH, { message: "Author is required" });

export const baseBookIsbnSchema = z
  .string()
  .min(VALIDATION.MIN_NAME_LENGTH, { message: "ISBN is required" });

export const baseBookGenreSchema = z.enum([
  BOOK_GENRES.FICTION,
  BOOK_GENRES.NON_FICTION,
  BOOK_GENRES.SCIENCE_FICTION,
  BOOK_GENRES.MYSTERY,
  BOOK_GENRES.ROMANCE,
  BOOK_GENRES.THRILLER,
  BOOK_GENRES.BIOGRAPHY,
  BOOK_GENRES.HISTORY,
  BOOK_GENRES.SCIENCE,
  BOOK_GENRES.TECHNOLOGY,
  BOOK_GENRES.PHILOSOPHY,
  BOOK_GENRES.RELIGION,
  BOOK_GENRES.ART,
  BOOK_GENRES.MUSIC,
  BOOK_GENRES.TRAVEL,
  BOOK_GENRES.COOKING,
  BOOK_GENRES.HEALTH,
  BOOK_GENRES.EDUCATION,
  BOOK_GENRES.CHILDREN,
  BOOK_GENRES.YOUNG_ADULT,
  BOOK_GENRES.OTHER,
]);

// Custom date validation for date input
const dateSchema = z
  .string()
  .min(1, { message: "Publication date is required" })
  .refine(
    (value) => {
      // Check if it's a valid date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        return false;
      }

      // Check if it's a valid date
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    { message: "Please enter a valid publication date" }
  );

export const createBookSchema = z.object({
  title: baseBookTitleSchema,
  author: baseBookAuthorSchema,
  isbn: baseBookIsbnSchema,
  genre: baseBookGenreSchema,
  publicationDate: dateSchema,
  description: z.string().optional(),
  coverImage: z.string().optional(),
  totalCopies: z.number().min(VALIDATION.MIN_BOOK_COPIES, {
    message: "At least 1 copy is required",
  }),
});

export const updateBookSchema = z.object({
  title: baseBookTitleSchema.optional(),
  author: baseBookAuthorSchema.optional(),
  isbn: baseBookIsbnSchema.optional(),
  genre: baseBookGenreSchema.optional(),
  publicationDate: dateSchema.optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  totalCopies: z
    .number()
    .min(VALIDATION.MIN_BOOK_COPIES, { message: "At least 1 copy is required" })
    .optional(),
});

// Issue schemas
export const issueBookSchema = z.object({
  bookId: z.string().min(1, { message: "Book ID is required" }),
  userId: z.string().min(1, { message: "User ID is required" }),
  dueDate: z.string().datetime(),
});

export const returnBookSchema = z.object({
  bookId: z.string().min(1, { message: "Book ID is required" }),
  userId: z.string().min(1, { message: "User ID is required" }),
  otpCode: z.string().min(6, { message: "OTP code is required" }),
});

// Type exports
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type CreateBookData = z.infer<typeof createBookSchema>;
export type UpdateBookData = z.infer<typeof updateBookSchema>;
export type IssueBookData = z.infer<typeof issueBookSchema>;
export type ReturnBookData = z.infer<typeof returnBookSchema>;
