"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, User, Calendar, FileText } from "lucide-react";
import { type Book } from "@/lib/hooks/use-books";
import { formatDate } from "@/lib/utils/shared";

interface BookAuditSheetProps {
  book: Book;
}

interface AuditRecord {
  id: string;
  fromOwner?: {
    id: string;
    name: string;
    email: string;
  };
  toOwner: {
    id: string;
    name: string;
    email: string;
  };
  performedBy: {
    id: string;
    name: string;
    email: string;
  };
  notes: string;
  createdAt: string;
}

export function BookAuditSheet({ book }: BookAuditSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    data: auditData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["book-audit", book.id],
    queryFn: async () => {
      const response = await fetch(`/api/books/${book.id}/ownership`);
      if (!response.ok) {
        throw new Error("Failed to fetch audit history");
      }
      const data = await response.json();
      return data.ownershipHistory as AuditRecord[];
    },
    enabled: isOpen, // Only fetch when sheet is open
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="View ownership history"
        >
          <History className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Ownership History
          </SheetTitle>
          <SheetDescription>
            Complete audit trail for &quot;{book.title}&quot;
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">
                  Loading audit history...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Failed to load audit history</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          )}

          {auditData && auditData.length === 0 && (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No ownership history found</p>
            </div>
          )}

          {auditData && auditData.length > 0 && (
            <div className="space-y-4">
              {auditData.map((audit, index) => (
                <Card key={audit.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        Transfer #{auditData.length - index}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {formatDate(new Date(audit.createdAt))}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      {audit.fromOwner && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-700">
                            From:
                          </span>
                          <span className="text-gray-600">
                            {audit.fromOwner.name}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-gray-700">To:</span>
                        <span className="text-gray-600">
                          {audit.toOwner.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-gray-700">
                          Performed by:
                        </span>
                        <span className="text-gray-600">
                          {audit.performedBy.name}
                        </span>
                      </div>

                      {audit.notes && (
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="h-4 w-4 text-purple-500 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-medium text-gray-700">
                              Notes:
                            </span>
                            <p className="text-gray-600 mt-1">{audit.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
