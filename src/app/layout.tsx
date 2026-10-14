import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarPropertyNavigation,
  SidebarPropertyNavigationFallback,
} from "@/components/nav-properties";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getPropertyNavigation } from "@/db/queries";
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
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <SidebarProvider
              style={
                {
                  "--sidebar-width": "calc(var(--spacing) * 72)",
                  "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
              }
            >
              <AppSidebar>
                <Suspense fallback={<SidebarPropertyNavigationFallback />}>
                  <PropertyNavigation />
                </Suspense>
              </AppSidebar>
              <SidebarInset className="min-w-0 bg-background">
                <SiteHeader />
                <main className="w-full flex-1 text-foreground">
                  <div className="mx-auto flex w-full max-w-360 flex-col gap-6 p-4 md:p-6 lg:p-8">
                    {children}
                  </div>
                </main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

async function PropertyNavigation() {
  const properties = await getPropertyNavigation();

  return <SidebarPropertyNavigation properties={properties} />;
}
