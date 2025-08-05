"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function FormSelect({
  name,
  label,
  options,
  placeholder,
  required = false,
  className,
}: FormSelectProps) {
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
      <select
        id={name}
        {...register(name)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message?.toString()}</p>
      )}
    </div>
  );
}
