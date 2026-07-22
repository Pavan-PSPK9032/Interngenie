"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";
import { useApp } from "@/lib/store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <ThemeSync>{children}</ThemeSync>
    </NextThemesProvider>
  );
}

// Sync our Zustand theme with next-themes
function ThemeSync({ children }: { children: React.ReactNode }) {
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Initialize from system preference on first load
  useEffect(() => {
    const saved = localStorage.getItem("pm-internship-app");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.state?.theme) {
          setTheme(parsed.state.theme);
          return;
        }
      } catch {}
    }
    // Default to light
    setTheme("light");
  }, [setTheme]);

  return <>{children}</>;
}
