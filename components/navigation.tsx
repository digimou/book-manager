"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/lib/hooks/use-auth";
import { USER_ROLES, ROUTES } from "@/lib/constants";

export default function Navigation() {
  const { data: session } = useSession();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      window.location.href = ROUTES.LOGIN;
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link
              href={session ? ROUTES.DASHBOARD : ROUTES.HOME}
              className="text-xl font-bold text-gray-900"
            >
              Book Manager
            </Link>

            {session && (
              <div className="flex items-center space-x-4">
                <Link
                  href={ROUTES.DASHBOARD}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  href={ROUTES.BOOKS}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Books
                </Link>
                {(session.user as unknown as { role: string }).role ===
                  USER_ROLES.ADMIN && (
                  <Link
                    href={ROUTES.USERS}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Users
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {session.user?.name || session.user?.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
