"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBooks } from "@/lib/hooks/use-books";
import { USER_ROLES } from "@/lib/constants";
import { AddBookModal } from "@/components/books/add-book-modal";
import { EditBookModal } from "@/components/books/edit-book-modal";
import { TransferOwnershipModal } from "@/components/books/transfer-ownership-modal";

export default function BooksPage() {
  const { data: session, status } = useSession();
  const { data: booksData, isLoading, error, refetch } = useBooks();

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    redirect("/auth/login");
  }

  const userRole = (session.user as unknown as { role: string }).role;
  const isAdmin = userRole === USER_ROLES.ADMIN;
  const isBookkeeper = userRole === USER_ROLES.BOOKKEEPER;
  const canAddBooks = isAdmin || isBookkeeper;
  const currentUserId = session.user.id;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Books
          </h2>
          <p className="text-gray-600 mb-4">Failed to load books.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const books = booksData?.books || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Books</h1>
        {canAddBooks && <AddBookModal onSuccess={() => refetch()} />}
      </div>

      {books.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No books found
          </h3>
          <p className="text-gray-600">
            {canAddBooks
              ? "Start by adding some books to the library."
              : "No books are available at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {books.map((book) => {
            const isOwner = book.ownerId === currentUserId;
            const canEdit = isOwner || isAdmin; // Owner or admin can edit
            const canTransfer = isOwner || isAdmin; // Owner or admin can transfer

            return (
              <Card key={book.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight truncate">
                        {book.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 truncate">
                        by {book.author}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {canEdit && (
                        <EditBookModal
                          book={book}
                          onSuccess={() => refetch()}
                        />
                      )}
                      {canTransfer && (
                        <TransferOwnershipModal
                          book={book}
                          onSuccess={() => refetch()}
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">ISBN:</span>
                      <span className="text-gray-600 truncate">
                        {book.isbn}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">RFID:</span>
                      <span className="text-gray-600 font-mono text-xs truncate">
                        {book.rfidTag}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Genre:</span>
                      <span className="text-gray-600">{book.genre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Status:</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          book.status === "AVAILABLE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {book.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Copies:</span>
                      <span className="text-gray-600">
                        {book.availableCopies}/{book.totalCopies}
                      </span>
                    </div>
                    {book.owner && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">
                          Owner:
                        </span>
                        <span className="text-gray-600 truncate">
                          {book.owner.name}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
