"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRegister } from "@/lib/hooks/use-auth";
import { USER_ROLES, VALIDATION, SUCCESS_MESSAGES } from "@/lib/constants";
import { Shield, Users, UserPlus } from "lucide-react";

const createUserSchema = z.object({
  name: z.string().min(VALIDATION.MIN_NAME_LENGTH, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(
      VALIDATION.MIN_PASSWORD_LENGTH,
      "Password must be at least 6 characters"
    ),
  role: z.enum([USER_ROLES.USER, USER_ROLES.BOOKKEEPER, USER_ROLES.ADMIN]),
});

type CreateUserData = z.infer<typeof createUserSchema>;

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const registerMutation = useRegister();

  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: USER_ROLES.USER,
    },
  });

  // Check if user is admin
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    router.push("/auth/login");
    return null;
  }

  const userRole = (session.user as unknown as { role: string }).role;
  if (userRole !== USER_ROLES.ADMIN) {
    router.push("/dashboard");
    return null;
  }

  const onSubmit = async (data: CreateUserData) => {
    setError(null);
    setSuccess(null);

    try {
      await registerMutation.mutateAsync(data);
      setSuccess(SUCCESS_MESSAGES.USER_REGISTERED);
      form.reset();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create user"
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Only administrators can create new users in the system. All new
            users will be created with the selected role and permissions.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  {...form.register("name")}
                  className="mt-1"
                  placeholder="Enter user's full name"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className="mt-1"
                  placeholder="Enter user's email address"
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  className="mt-1"
                  placeholder="Enter initial password"
                />
                {form.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700"
                >
                  Role
                </label>
                <select
                  id="role"
                  {...form.register("role")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={USER_ROLES.USER}>User</option>
                  <option value={USER_ROLES.BOOKKEEPER}>Bookkeeper</option>
                  <option value={USER_ROLES.ADMIN}>Admin</option>
                </select>
                {form.formState.errors.role && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.role.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending
                  ? "Creating user..."
                  : "Create User"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
