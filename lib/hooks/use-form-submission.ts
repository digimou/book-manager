import { useState } from "react";
import toast from "react-hot-toast";

interface UseFormSubmissionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useFormSubmission<T, U>(
  submissionFn: (data: U) => Promise<T>,
  options: UseFormSubmissionOptions<T> = {}
) {
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (data: U) => {
    setIsLoading(true);

    try {
      const result = await submissionFn(data);

      if (options.successMessage) {
        toast.success(options.successMessage);
      }

      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage =
        options.errorMessage ||
        (error instanceof Error ? error.message : "An error occurred");

      toast.error(errorMessage);
      options.onError?.(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submit,
    isLoading,
  };
}
