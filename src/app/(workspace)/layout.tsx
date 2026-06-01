import { Building2 } from "lucide-react";
import type { ReactNode } from "react";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f8f5] text-foreground">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-6 px-4 py-4 md:px-6 lg:px-8">
        <WorkspaceHeader />
        {children}
      </div>
    </main>
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
