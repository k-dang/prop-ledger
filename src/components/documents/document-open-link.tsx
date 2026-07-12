"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const IMAGE_EXTENSIONS = new Set([
  "avif",
  "bmp",
  "gif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "webp",
]);

export function DocumentOpenLink({
  children,
  fileName,
  triggerClassName,
  url,
}: {
  children?: ReactNode;
  fileName: string;
  triggerClassName?: string;
  url: string;
}) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const isImage = IMAGE_EXTENSIONS.has(extension);

  return (
    <Dialog>
      <DialogTrigger
        className={cn(
          "cursor-pointer underline-offset-4 hover:underline",
          triggerClassName,
        )}
        aria-label={children ? `View ${fileName}` : undefined}
      >
        {children ?? "View"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="break-all pr-8">{fileName}</DialogTitle>
        </DialogHeader>
        {isImage ? (
          // biome-ignore lint/performance/noImgElement: storage URLs may point at arbitrary external hosts, which next/image remotePatterns cannot enumerate.
          <img
            src={url}
            alt={fileName}
            className="max-h-[70vh] w-full rounded-md border bg-muted/40 object-contain"
          />
        ) : (
          <iframe
            src={url}
            title={fileName}
            className="h-[70vh] w-full rounded-md border bg-muted/40"
          />
        )}
        <a
          className="text-muted-foreground text-xs underline-offset-4 hover:underline"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          Open original
        </a>
      </DialogContent>
    </Dialog>
  );
}
