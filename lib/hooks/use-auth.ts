import { useMutation } from "@tanstack/react-query";
import { signIn, signOut } from "next-auth/react";
import { API_ENDPOINTS } from "@/lib/constants";

// Types
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Register user
const registerUser = async (data: RegisterData): Promise<{ user: { id: string; email: string; name: string; role: string } }> => {
  const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to register user");
  }

  return response.json();
};

// Custom hooks
export const useRegister = () => {
  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      // Registration successful, user can now login
    },
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: LoginData) => {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      await signOut({ redirect: false });
    },
  });
};
