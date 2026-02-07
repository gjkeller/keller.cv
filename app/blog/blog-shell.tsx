"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

/** Shared chrome for all blog pages — themed via context */
export function BlogShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.bg }}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <header
          className="mb-8 pb-4 border-b"
          style={{ borderColor: theme.border }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 transition-colors hover:opacity-80"
            style={{ color: theme.textDim }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </header>

        {children}

        {/* Footer */}
        <footer
          className="mt-16 pt-8 border-t"
          style={{ borderColor: theme.border }}
        >
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="transition-colors hover:opacity-80"
              style={{ color: theme.textDim }}
            >
              &larr; Back to Home
            </Link>
            <div className="text-sm" style={{ color: theme.textMuted }}>
              &copy; {new Date().getFullYear()} Gabriel Keller
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
