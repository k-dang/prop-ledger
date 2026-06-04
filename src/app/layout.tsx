import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rental Property Workspace",
  description: "Tax-ready rental property management workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <main className="min-h-screen bg-[#f7f8f5] text-foreground">
          <div className="mx-auto flex w-full max-w-360 flex-col gap-6 px-4 py-4 md:px-6 lg:px-8">
            <WorkspaceHeader />
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

function WorkspaceHeader() {
  return (
    <header className="flex flex-col gap-4 border-border border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700">
          <Building2 className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">
            Rental property management
          </p>
          <h1 className="truncate font-semibold text-2xl tracking-normal">
            Property accounting workspace
          </h1>
        </div>
      </div>
    </header>
  );
}
