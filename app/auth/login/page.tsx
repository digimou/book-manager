"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLogin } from "@/lib/hooks/use-auth";
import { VALIDATION, ROUTES } from "@/lib/constants";
import toast from "react-hot-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(VALIDATION.MIN_PASSWORD_LENGTH, {
    message: "Password must be at least 6 characters",
  }),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    try {
      await loginMutation.mutateAsync(data);
      toast.success("Login successful!");
      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  placeholder="Enter your email"
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
                  placeholder="Enter your password"
                />
                {form.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
