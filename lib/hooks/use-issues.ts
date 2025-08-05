import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";

// Types
export interface BookIssue {
  id: string;
  bookId: string;
  userId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: string;
  otpCode?: string;
  otpExpires?: string;
  createdAt: string;
  updatedAt: string;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    availableCopies: number;
    totalCopies: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface IssuesResponse {
  issues: BookIssue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface IssueFilters {
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface IssueBookData {
  bookId: string;
  userId: string;
  dueDate: string;
}

export interface ReturnBookData {
  bookId: string;
  userId: string;
  otpCode: string;
}

// Fetch issues with filters
const fetchIssues = async (
  filters: IssueFilters = {}
): Promise<IssuesResponse> => {
  const params = new URLSearchParams();

  if (filters.status) params.append("status", filters.status);
  if (filters.userId) params.append("userId", filters.userId);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  const response = await fetch(`${API_ENDPOINTS.ISSUES.LIST}?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch issues");
  }

  return response.json();
};

// Issue a book
const issueBook = async (
  data: IssueBookData
): Promise<{ bookIssue: BookIssue; otpCode: string; message: string }> => {
  const response = await fetch(API_ENDPOINTS.ISSUES.CREATE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to issue book");
  }

  return response.json();
};

// Return a book
const returnBook = async (
  data: ReturnBookData
): Promise<{ message: string }> => {
  const response = await fetch(API_ENDPOINTS.ISSUES.RETURN, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to return book");
  }

  return response.json();
};

// Custom hooks
export const useIssues = (filters: IssueFilters = {}) => {
  return useQuery({
    queryKey: ["issues", filters],
    queryFn: () => fetchIssues(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes (issues change more frequently)
  });
};

export const useIssueBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueBook,
    onSuccess: () => {
      // Invalidate and refetch issues list
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      // Invalidate and refetch books list (availability changes)
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
};

export const useReturnBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: returnBook,
    onSuccess: () => {
      // Invalidate and refetch issues list
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      // Invalidate and refetch books list (availability changes)
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
};
