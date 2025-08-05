import { USER_ROLES, BOOK_GENRES, ISSUE_STATUS } from "@/lib/constants";

export interface UserSession {
  id: string;
  email: string;
  name?: string | null;
  role: keyof typeof USER_ROLES;
}

export interface AuthenticatedSession {
  user: UserSession;
  expires: string;
}

export interface BookUpdateData {
  title?: string;
  author?: string;
  isbn?: string;
  genre?: keyof typeof BOOK_GENRES;
  publicationDate?: Date;
  description?: string;
  coverImage?: string;
  totalCopies?: number;
}

export interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  totalIssues: number;
  overdueIssues: number;
  availableBooks: number;
  issuedBooks: number;
  recentIssues: Array<{
    id: string;
    book: { title: string; author: string };
    user: { name: string; email: string };
    issueDate: Date;
    dueDate: Date;
    status: keyof typeof ISSUE_STATUS;
  }>;
  popularBooks: Array<{
    id: string;
    title: string;
    author: string;
    issueCount: number;
  }>;
}

export interface BookIssueData {
  bookId: string;
  userId: string;
  dueDate: Date;
  otpCode?: string;
  otpExpires?: Date;
}

export interface BookIssueUpdateData {
  returnDate?: Date;
  status?: keyof typeof ISSUE_STATUS;
  otpCode?: string;
  otpExpires?: Date;
}
