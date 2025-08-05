"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormField } from "@/components/forms/form-field";
import { useLogin } from "@/lib/hooks/use-auth";
import { useFormSubmission } from "@/lib/hooks/use-form-submission";
import { loginSchema, type LoginData } from "@/lib/schemas";
import { ROUTES } from "@/lib/constants";

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

  const { submit, isLoading } = useFormSubmission(
    async (data: LoginData) => {
      await loginMutation.mutateAsync(data);
      router.push(ROUTES.DASHBOARD);
    },
    {
      successMessage: "Login successful!",
      errorMessage: "Login failed",
    }
  );

  const onSubmit = async (data: LoginData) => {
    await submit(data);
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
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  required
                />

                <FormField
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  required
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
