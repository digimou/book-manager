"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number";
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function FormField({
  name,
  label,
  type = "text",
  placeholder,
  required = false,
  className,
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className={className}>
      <Label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        {...register(name)}
        className="mt-1"
        placeholder={placeholder}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message?.toString()}</p>
      )}
    </div>
  );
}
