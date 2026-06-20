import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
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
      <body className="min-h-full bg-[#f7f8f5]">
        <TooltipProvider>
          <SidebarProvider>
            <Suspense
              fallback={
                <div
                  className="hidden w-64 shrink-0 border-r bg-sidebar md:block"
                  aria-hidden="true"
                />
              }
            >
              <AppSidebar />
            </Suspense>
            <SidebarInset className="min-w-0 bg-[#f7f8f5]">
              <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
                <SidebarTrigger className="-ml-1 md:hidden" />
                <Separator orientation="vertical" className="h-4 md:hidden" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm">
                    Property accounting workspace
                  </p>
                </div>
              </header>
              <main className="w-full flex-1 text-foreground">
                <div className="mx-auto flex w-full max-w-360 flex-col gap-6 p-4 md:p-6 lg:p-8">
                  {children}
                </div>
              </main>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
