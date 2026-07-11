"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  fileName,
  url,
}: {
  fileName: string;
  url: string;
}) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (!IMAGE_EXTENSIONS.has(extension)) {
    return (
      <a
        className="underline-offset-4 hover:underline"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        Open
      </a>
    );
  }

  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer underline-offset-4 hover:underline">
        View
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="break-all pr-8">{fileName}</DialogTitle>
        </DialogHeader>
        {/* biome-ignore lint/performance/noImgElement: storage URLs may point at arbitrary external hosts, which next/image remotePatterns cannot enumerate. */}
        <img
          src={url}
          alt={fileName}
          className="max-h-[70vh] w-full rounded-md border bg-muted/40 object-contain"
        />
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
