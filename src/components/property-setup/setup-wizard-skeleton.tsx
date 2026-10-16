import { Skeleton } from "@/components/ui/skeleton";

export function SetupWizardSkeleton() {
  return (
    <div
      className="grid gap-6"
      role="status"
      aria-busy="true"
      aria-label="Loading property setup"
    >
      <div className="grid gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-40 max-w-full" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[13rem_minmax(0,40rem)] lg:gap-8">
        <div className="hidden gap-2 lg:grid" aria-hidden="true">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="grid gap-2 lg:hidden" aria-hidden="true">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-1 w-full" />
        </div>
        <div className="grid gap-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
          <div className="grid gap-2">
            <Skeleton className="h-6 w-48 max-w-full" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="grid gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-24" />
          </div>
          <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-between">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading property setup…</span>
    </div>
  );
}
