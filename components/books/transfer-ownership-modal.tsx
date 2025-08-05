"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FormSelect } from "@/components/forms/form-select";
import { useQuery } from "@tanstack/react-query";
import { useFormSubmission } from "@/lib/hooks/use-form-submission";
import { USER_ROLES } from "@/lib/constants";
import { ArrowRightLeft, Users } from "lucide-react";
import { type Book } from "@/lib/hooks/use-books";
import { z } from "zod";

const transferSchema = z.object({
  newOwnerId: z.string().min(1, { message: "Please select a new owner" }),
  notes: z.string().min(1, { message: "Transfer notes are required" }),
});

type TransferData = z.infer<typeof transferSchema>;

interface TransferOwnershipModalProps {
  book: Book;
  onSuccess?: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function TransferOwnershipModal({
  book,
  onSuccess,
}: TransferOwnershipModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch bookkeepers for transfer
  const { data: bookkeepers, isLoading: loadingBookkeepers } = useQuery({
    queryKey: ["bookkeepers"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch bookkeepers");
      }
      const users = await response.json();
      return users.filter((user: User) => user.role === USER_ROLES.BOOKKEEPER);
    },
  });

  const form = useForm<TransferData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      newOwnerId: "",
      notes: "",
    },
  });

  const { submit, isLoading } = useFormSubmission(
    async (data: TransferData) => {
      const response = await fetch(`/api/books/${book.id}/ownership`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newOwnerId: data.newOwnerId,
          notes: data.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to transfer ownership");
      }

      setIsOpen(false);
      form.reset();
      onSuccess?.();
    },
    {
      successMessage: "Book ownership transferred successfully!",
      errorMessage: "Failed to transfer ownership",
    }
  );

  const handleSubmit = async (data: TransferData) => {
    await submit(data);
  };

  const bookkeeperOptions =
    bookkeepers?.map((bookkeeper: User) => ({
      value: bookkeeper.id,
      label: bookkeeper.name,
    })) || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Transfer ownership"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Transfer Book Ownership
          </DialogTitle>
          <DialogDescription>
            Transfer ownership of &quot;{book.title}&quot; to another
            bookkeeper.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="newOwnerId"
                className="block text-sm font-medium text-gray-700"
              >
                New Owner
              </label>
              {loadingBookkeepers ? (
                <div className="mt-1 p-2 bg-gray-100 rounded text-sm text-gray-600">
                  Loading bookkeepers...
                </div>
              ) : (
                <FormSelect
                  name="newOwnerId"
                  label=""
                  options={bookkeeperOptions}
                  placeholder="Select a bookkeeper"
                  required
                />
              )}
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700"
              >
                Transfer Notes
              </label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                className="mt-1"
                placeholder="Add notes about this ownership transfer..."
                rows={3}
              />
              {form.formState.errors.notes && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.notes.message?.toString()}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || loadingBookkeepers}>
                {isLoading ? "Transferring..." : "Transfer Ownership"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
