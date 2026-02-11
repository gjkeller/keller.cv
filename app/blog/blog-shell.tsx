"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme-context";
import { usePathname } from "next/navigation";

/** Shared chrome for all blog pages — themed via context */
export function BlogShell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  const { theme, themeMode, setThemeMode } = useTheme();
  const pathname = usePathname();
  const isBlogPage = pathname.startsWith("/blog");

  const navLinks = [
    { href: "/", label: "Home", active: pathname === "/" },
    { href: "/blog", label: "Blog", active: isBlogPage },
  ];

  const socialLinks = [
    { href: "https://x.com/gabrieljkeller", label: "Twitter" },
    { href: "https://github.com/gjkeller", label: "GitHub" },
  ];
  const getNavLabel = (label: string) => (label === "Home" ? "← Home" : label);

  const themeOptions = [
    { id: "auto", label: "Auto" },
    { id: "light", label: "Light" },
    { id: "warm", label: "Warm" },
    { id: "dark-blue", label: "Dark Blue" },
    { id: "dark-gray", label: "Dark Gray" },
    { id: "midnight", label: "Midnight" },
  ] as const;

  const ThemeToggle = ({ compact = false }: { compact?: boolean }) => (
    <details className={`theme-inline-details ${compact ? "text-[11px]" : "text-xs"}`}>
      <summary
        className="list-none cursor-pointer select-none transition-opacity hover:opacity-75"
        style={{ color: theme.textMuted }}
      >
        Theme
      </summary>
      <div
        className="theme-inline-options mt-1"
      >
        {themeOptions.map((option) => {
          const active = option.id === themeMode;
          return (
            <button
              key={option.id}
              type="button"
              className="block w-full text-left py-1 transition-colors"
              style={{
                color: active ? theme.text : theme.textMuted,
                fontWeight: active ? 500 : 400,
              }}
              onClick={(event) => {
                setThemeMode(option.id);
                const details = (event.currentTarget.closest("details") as HTMLDetailsElement | null);
                if (details) details.open = false;
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </details>
  );

  const renderSidebar = () => (
    <aside className="hidden lg:block fixed left-8 top-8 z-20 w-56">
      <div className="pl-3">
        <nav className="space-y-2 mb-7" aria-label="Blog sidebar links">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between text-[15px] leading-5 transition-opacity hover:opacity-70"
              style={{ color: link.active ? theme.text : theme.textDim, fontWeight: link.active ? 500 : 400 }}
            >
              <span>{getNavLabel(link.label)}</span>
            </Link>
          ))}
        </nav>
        <div className="space-y-2 mb-6">
          {socialLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm transition-opacity hover:opacity-70"
              style={{ color: theme.textMuted }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <ThemeToggle compact />
      </div>
    </aside>
  );

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.bg }}
    >
      <style>{`
        .theme-inline-details > summary::-webkit-details-marker { display: none; }
        .theme-inline-details > summary::marker { content: ""; }
        .theme-inline-details .theme-inline-options {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transform: translateY(-2px);
          transition: max-height 180ms ease, opacity 140ms ease, transform 180ms ease;
        }
        .theme-inline-details[open] .theme-inline-options {
          max-height: 220px;
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
      {renderSidebar()}

      <div className={`mx-auto px-10 sm:px-16 lg:px-24 pt-16 sm:pt-24 pb-8 sm:pb-10 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
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
