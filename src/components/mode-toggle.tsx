"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEME_SEQUENCE = ["light", "dark", "system"] as const;

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? theme : "system";
  const Icon =
    activeTheme === "light" ? Sun : activeTheme === "dark" ? Moon : Monitor;

  function cycleTheme() {
    const currentIndex = THEME_SEQUENCE.indexOf(
      theme as (typeof THEME_SEQUENCE)[number],
    );
    const nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;

    setTheme(THEME_SEQUENCE[nextIndex % THEME_SEQUENCE.length]);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${activeTheme}. Change theme`}
      onClick={cycleTheme}
      className={cn("shrink-0", className)}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}
