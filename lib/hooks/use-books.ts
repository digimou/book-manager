import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";

// Types
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  rfidTag: string;
  genre: string;
  publicationDate: string;
  description?: string;
  coverImage?: string;
  totalCopies: number;
  availableCopies: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  bookIssues: BookIssue[];
}

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
  user: {
    name: string;
    email: string;
  };
}

export interface BooksResponse {
  books: Book[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BookFilters {
  search?: string;
  genre?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Fetch books with filters
const fetchBooks = async (
  filters: BookFilters = {}
): Promise<BooksResponse> => {
  const params = new URLSearchParams();

  if (filters.search) params.append("search", filters.search);
  if (filters.genre) params.append("genre", filters.genre);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  const response = await fetch(`${API_ENDPOINTS.BOOKS.LIST}?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch books");
  }

  return response.json();
};

// Fetch single book
const fetchBook = async (id: string): Promise<{ book: Book }> => {
  const response = await fetch(API_ENDPOINTS.BOOKS.GET(id));

  if (!response.ok) {
    throw new Error("Failed to fetch book");
  }

  return response.json();
};

// Create book
const createBook = async (bookData: Partial<Book>): Promise<{ book: Book }> => {
  const response = await fetch(API_ENDPOINTS.BOOKS.CREATE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create book");
  }

  return response.json();
};

// Update book
const updateBook = async ({
  id,
  ...bookData
}: { id: string } & Partial<Book>): Promise<{ book: Book }> => {
  const response = await fetch(API_ENDPOINTS.BOOKS.UPDATE(id), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update book");
  }

  return response.json();
};

// Delete book
const deleteBook = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(API_ENDPOINTS.BOOKS.DELETE(id), {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete book");
  }

  return response.json();
};

// Custom hooks
export const useBooks = (filters: BookFilters = {}) => {
  return useQuery({
    queryKey: ["books", filters],
    queryFn: () => fetchBooks(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBook = (id: string) => {
  return useQuery({
    queryKey: ["book", id],
    queryFn: () => fetchBook(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      // Invalidate and refetch books list
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBook,
    onSuccess: (data, variables) => {
      // Update the specific book in cache
      queryClient.setQueryData(["book", variables.id], data);
      // Invalidate and refetch books list
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
};

export const useDeleteBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBook,
    onSuccess: (data, variables) => {
      // Remove the book from cache
      queryClient.removeQueries({ queryKey: ["book", variables] });
      // Invalidate and refetch books list
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
};
