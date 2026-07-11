"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type LinkedRecord = {
  id: string;
  title: string;
  detail: string | null;
};

export function DocumentLinksSheet({
  fileName,
  records,
}: {
  fileName: string;
  records: LinkedRecord[];
}) {
  return (
    <Sheet>
      <SheetTrigger className="cursor-pointer text-muted-foreground text-xs underline underline-offset-4 hover:text-foreground">
        {records.length} link{records.length === 1 ? "" : "s"}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="break-all pr-8">{fileName}</SheetTitle>
          <SheetDescription>Records this document supports.</SheetDescription>
        </SheetHeader>
        <ul className="grid gap-2 overflow-y-auto px-4 pb-4">
          {records.map((record) => (
            <li key={record.id} className="rounded-md border bg-background p-3">
              <p className="font-medium text-sm">{record.title}</p>
              {record.detail === null ? null : (
                <p className="mt-0.5 text-muted-foreground text-xs">
                  {record.detail}
                </p>
              )}
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
