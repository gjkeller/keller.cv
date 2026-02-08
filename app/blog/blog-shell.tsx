"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme-context";
import { usePathname } from "next/navigation";

/** Shared chrome for all blog pages — themed via context */
export function BlogShell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const isIndex = pathname === "/blog";

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Blog header — simple nav */}
      <header
        className="border-b"
        style={{ borderColor: theme.border }}
      >
        <div className={`mx-auto px-10 sm:px-24 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
          <nav className="flex items-center justify-center gap-6 h-12 text-sm">
            <Link
              href="/"
              className="transition-colors hover:opacity-80"
              style={{ color: theme.textMuted }}
            >
              Home
            </Link>
            <Link
              href="/blog"
              className="transition-colors hover:opacity-80"
              style={{ color: isIndex ? theme.text : theme.textMuted, fontWeight: isIndex ? 500 : 400 }}
            >
              Blog
            </Link>
          </nav>
        </div>
      </header>

      <div className={`mx-auto px-10 sm:px-24 py-10 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        {children}

        {/* Footer */}
        <footer
          className="mt-16 pt-8 border-t"
          style={{ borderColor: theme.border }}
        >
          <div className="flex justify-between items-center">
            <Link
              href="/blog"
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: theme.textDim }}
            >
              &larr; All posts
            </Link>
            <div className="text-xs" style={{ color: theme.textMuted }}>
              &copy; {new Date().getFullYear()} Gabriel Keller
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
