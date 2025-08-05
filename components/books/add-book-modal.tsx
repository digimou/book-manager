"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { FormField } from "@/components/forms/form-field";
import { FormSelect } from "@/components/forms/form-select";
import { useCreateBook } from "@/lib/hooks/use-books";
import { useFormSubmission } from "@/lib/hooks/use-form-submission";
import { createBookSchema, type CreateBookData } from "@/lib/schemas";
import { BOOK_GENRES } from "@/lib/constants";
import { Plus, BookOpen } from "lucide-react";

interface AddBookModalProps {
  onSuccess?: () => void;
}

export function AddBookModal({ onSuccess }: AddBookModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const createBookMutation = useCreateBook();

  const form = useForm<CreateBookData>({
    resolver: zodResolver(createBookSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      genre: BOOK_GENRES.FICTION,
      publicationDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD format
      description: "",
      coverImage: "",
      totalCopies: 1,
    },
  });

  const { submit, isLoading } = useFormSubmission(
    async (data: CreateBookData) => {
      await createBookMutation.mutateAsync(data);
      setIsOpen(false);
      form.reset();
      onSuccess?.();
    },
    {
      successMessage: "Book added successfully!",
      errorMessage: "Failed to add book",
    }
  );

  const handleSubmit = async (data: CreateBookData) => {
    await submit(data);
  };

  const genreOptions = Object.entries(BOOK_GENRES).map(([key, value]) => ({
    value,
    label: key.replace(/_/g, " "),
  }));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Book
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Add New Book
          </DialogTitle>
          <DialogDescription>
            Add a new book to the library. Fill in all required fields.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="title"
                label="Title"
                placeholder="Enter book title"
                required
              />
              <FormField
                name="author"
                label="Author"
                placeholder="Enter author name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="isbn"
                label="ISBN"
                placeholder="Enter ISBN"
                required
              />
              <FormSelect
                name="genre"
                label="Genre"
                options={genreOptions}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="publicationDate"
                label="Publication Date"
                type="date"
                required
              />
              <FormField
                name="totalCopies"
                label="Total Copies"
                type="number"
                placeholder="1"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <Textarea
                id="description"
                {...form.register("description")}
                className="mt-1"
                placeholder="Enter book description (optional)"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.description.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="coverImage"
                className="block text-sm font-medium text-gray-700"
              >
                Cover Image URL
              </label>
              <Input
                id="coverImage"
                type="url"
                {...form.register("coverImage")}
                className="mt-1"
                placeholder="Enter cover image URL (optional)"
              />
              {form.formState.errors.coverImage && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.coverImage.message?.toString()}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Book"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
