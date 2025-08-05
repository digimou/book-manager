import { useQuery } from "@tanstack/react-query";

// Types
export interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  issuedBooks: number;
  userIssuedBooks: number;
}

// Fetch dashboard stats
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch("/api/dashboard/stats");

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }

  return response.json();
};

// Custom hooks
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
