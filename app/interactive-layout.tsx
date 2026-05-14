"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { WorkItem, HackathonWin } from "@/lib/content";
import { THEMES, resolveAutoTheme, type Theme } from "@/lib/themes";
import { useTheme } from "@/lib/theme-context";
import { getCalApi } from "@calcom/embed-react";
import { GithubIcon, LinkedinIcon, XIcon, DevpostIcon } from "./icons";
import { Terminal } from "./terminal";
import { renderMarkdown, type MdStyles } from "@/lib/render-md";

/* ── Social icon map ── */
const socialIcons: Record<string, React.ReactNode> = {
  GitHub: <GithubIcon />, LinkedIn: <LinkedinIcon />, X: <XIcon />, Devpost: <DevpostIcon />,
};

/* ── Props ── */
interface Props {
  socialLinks: { label: string; url: string }[];
  calLink15: string;
  calLink30: string;
  name: string;
  tagline: string;
  bio: string;
  currentWork: WorkItem[];
  hackathons: HackathonWin[];
  posts: { slug: string; title: string; date: string; description?: string; content: string }[];
  terminalFiles: Record<string, string>;
  terminalUrls: Record<string, string>;
  initialSectionIntent?: "home" | "blog";
  initialCallIntent?: "none" | "15m" | "30m";
}

/* ── Small icons ── */
function TerminalIcon() {
  return (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>);
}

/* ── Ghost card styles ── */
function ghostCardStyle(theme: Theme) {
  return {
    ["--hover-bg" as string]: theme.cardHoverBg,
    ["--hover-border" as string]: theme.cardHoverBorder,
    ["--hover-shadow" as string]: theme.cardShadow,
    ["--active-shadow" as string]: theme.cardActiveShadow,
    ["--gloss-color" as string]: theme.isDark
      ? "rgba(255,255,255,0.06)"
      : "rgba(255,255,255,0.45)",
    ["--press-overlay" as string]: theme.isDark
      ? "rgba(0,0,0,0.14)"
      : "rgba(0,0,0,0.05)",
  };
}
const cardClass = "w-[calc(100%+1.5rem)] text-left -mx-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent";
const callCardClass = "w-full text-left px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent";
const DESKTOP_OPEN_HINT_MS = 1000;
const DESKTOP_CLICK_DELAY_MS = 280;

// Map pathname → document title. Used to keep the tab title in sync with
// the URL bar whenever we mutate history directly (pushState/replaceState),
// since Next.js only re-applies route metadata on real navigations.
const TITLE_BY_PATH: Record<string, string> = {
  "/": "Gabriel Keller",
  "/call": "Book a call | Gabriel Keller",
  "/blog": "Blog | Gabriel Keller",
};

function syncDocumentTitle(): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const title = TITLE_BY_PATH[window.location.pathname];
  if (title && document.title !== title) {
    document.title = title;
  }
}

function toCalPath(calLink: string): string {
  const trimmed = calLink.trim();
  if (!trimmed) return "";
  if (!trimmed.includes("://")) {
    return trimmed.replace(/^\/+/, "").replace(/\/+$/, "");
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname.endsWith("cal.com")) {
      const path = url.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
      return `${path}${url.search}`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

function withCalDuration(calPath: string, minutes: number): string {
  const [path, query = ""] = calPath.split("?");
  const params = new URLSearchParams(query);
  params.set("duration", String(minutes));
  const serialized = params.toString();
  return serialized ? `${path}?${serialized}` : path;
}

function buildCalCssVars(theme: Theme) {
  const isDark = theme.isDark;
  const calBg = isDark ? "#111113" : theme.bg;
  const calBgMuted = isDark ? "#16161a" : theme.termBarBg;
  const calBgSubtle = isDark ? "#1f1f23" : theme.cardHoverBg;
  const calBgEmphasis = isDark ? "#2a2a30" : theme.cardHoverBg;
  const calText = isDark ? "#d4d4d8" : theme.text;
  const calTextDim = isDark ? "#a1a1aa" : theme.textDim;
  const calTextMuted = isDark ? "#71717a" : theme.textMuted;
  const calBorder = isDark ? "#27272a" : theme.border;
  const calBrand = isDark ? "#e4e4e7" : theme.text;

  const vars = {
    "--cal-bg": calBg,
    "--cal-bg-muted": calBgMuted,
    "--cal-bg-subtle": calBgSubtle,
    "--cal-bg-emphasis": calBgEmphasis,
    "--cal-text": calTextDim,
    "--cal-text-emphasis": calText,
    "--cal-text-subtle": calTextDim,
    "--cal-text-muted": calTextMuted,
    "--cal-border": calBorder,
    "--cal-border-subtle": calBorder,
    "--cal-brand": calBrand,
    "--cal-brand-color": calBrand,
    "--cal-brand-text": isDark ? "#111113" : "#FFFFFF",
  } as const;

  // Apply same token set to both modes so Cal always matches the active TUI theme.
  return { light: vars, dark: vars };
}

function removeCalModalInstances(): void {
  if (typeof document === "undefined") return;
  document.querySelectorAll("cal-modal-box").forEach((el) => el.remove());
}

function isCalModalVisible(): boolean {
  if (typeof document === "undefined") return false;
  const modalNodes = Array.from(
    document.querySelectorAll<HTMLElement>("cal-modal-box"),
  );
  return modalNodes.some((modalEl) => {
    const styles = window.getComputedStyle(modalEl);
    if (styles.display === "none" || styles.visibility === "hidden") {
      return false;
    }
    const opacity = Number.parseFloat(styles.opacity || "1");
    return Number.isNaN(opacity) || opacity > 0.01;
  });
}

function constrainCalModalWidth(maxWidthPx = 980): void {
  if (typeof document === "undefined") return;
  const modals = document.querySelectorAll("cal-modal-box");
  modals.forEach((modalEl) => {
    const shadow = (modalEl as HTMLElement).shadowRoot;
    if (!shadow) return;
    if (shadow.getElementById("keller-cal-modal-width")) return;

    const style = document.createElement("style");
    style.id = "keller-cal-modal-width";
    style.textContent = `
      .modal-box {
        width: min(${maxWidthPx}px, calc(100vw - 2rem)) !important;
        left: 50% !important;
        top: calc(50% + 0.5rem) !important;
        transform: translate(-50%, -50%) !important;
      }

      @media (max-width: 768px) {
        .modal-box {
          width: calc(100vw - 1rem) !important;
        }
      }
    `;
    shadow.appendChild(style);
  });
}

function beginCalModalWidthSync(
  maxWidthPx = 980,
  windowMs = 2800,
): () => void {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return () => {};
  }

  const apply = () => constrainCalModalWidth(maxWidthPx);
  apply();

  const observer = new MutationObserver(() => apply());
  observer.observe(document.body, { childList: true, subtree: true });

  const intervalId = window.setInterval(apply, 120);
  const timeoutId = window.setTimeout(() => {
    observer.disconnect();
    window.clearInterval(intervalId);
  }, windowMs);

  return () => {
    observer.disconnect();
    window.clearInterval(intervalId);
    window.clearTimeout(timeoutId);
  };
}

function applyCalUiConfig(
  cal: Awaited<ReturnType<typeof getCalApi>>,
  theme: Theme,
): void {
  const calTheme = theme.isDark ? "dark" : "light";
  const calCssVars = buildCalCssVars(theme);
  const calBg = theme.isDark ? "#111113" : theme.bg;
  const calSurface = theme.isDark ? "#1f1f23" : theme.cardHoverBg;
  const calText = theme.isDark ? "#d4d4d8" : theme.text;
  const calTextMuted = theme.isDark ? "#71717a" : theme.textMuted;
  cal("ui", {
    hideEventTypeDetails: false,
    layout: "month_view",
    theme: calTheme,
    colorScheme: calTheme,
    styles: {
      branding: { brandColor: calText },
      body: { background: calBg },
      eventTypeListItem: { background: calSurface, color: calText },
      enabledDateButton: { background: calSurface, color: calText },
      disabledDateButton: { background: calBg, color: calTextMuted },
      availabilityDatePicker: { background: calBg, color: calText },
    },
    cssVarsPerTheme: calCssVars,
  });
}

async function applyCalUiForTheme(theme: Theme): Promise<void> {
  async function configureNamespace(namespace: string) {
    const cal = await getCalApi({ namespace });
    applyCalUiConfig(cal, theme);
  }

  await Promise.all([configureNamespace("15m"), configureNamespace("30m")]);
}

/* ── Main layout ── */
export function InteractiveLayout({
  socialLinks, calLink15, calLink30, name, tagline, bio,
  currentWork, hackathons, posts, terminalFiles, terminalUrls,
  initialSectionIntent = "home",
  initialCallIntent = "none",
}: Props) {
  const router = useRouter();
  const [activeFile, setActiveFile] = useState<{ command: string; content: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  // Viewport detection — single terminal instance adapts to desktop/mobile
  // Always init as true to match SSR; useEffect corrects after hydration
  const [isDesktop, setIsDesktop] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalFullscreen, setTerminalFullscreen] = useState(false);
  const [blogsExpanded, setBlogsExpanded] = useState(
    initialSectionIntent === "blog",
  );
  // True once the home content should be removed from layout (display:none).
  // Lags `blogsExpanded` so the smooth-scroll-to-writing animation has a
  // chance to play before the document shrinks underneath it.
  const [homeCollapsed, setHomeCollapsed] = useState(
    initialSectionIntent === "blog",
  );
  const homeCollapseTimerRef = useRef<number | null>(null);
  // Versioned chain request so the terminal re-fires even when the same
  // commands are requested multiple times.
  const [autoTypeRequest, setAutoTypeRequest] = useState<
    { commands: string[]; id: number } | null
  >(null);
  const autoTypeRequestIdRef = useRef(0);
  const hasShownWelcomeRef = useRef(initialSectionIntent !== "blog");
  const requestTerminalAutoType = useCallback((commands: string[]) => {
    autoTypeRequestIdRef.current += 1;
    setAutoTypeRequest({ commands, id: autoTypeRequestIdRef.current });
  }, []);
  const [desktopTooltip, setDesktopTooltip] = useState<{
    key: string;
    x: number;
    y: number;
  } | null>(null);
  const clickTimeoutRef = useRef<number | null>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);
  const clickKeyRef = useRef<string | null>(null);
  const singleClickCountRef = useRef(0);
  const terminalWrapperRef = useRef<HTMLDivElement | null>(null);
  const writingSectionRef = useRef<HTMLElement | null>(null);
  const calWidthSyncCleanupRef = useRef<(() => void) | null>(null);
  const previewPosts = useMemo(() => posts.slice(0, 3), [posts]);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const desktop = mql.matches;
    setIsDesktop(desktop);
    // On mobile, close the terminal so users land on main content
    if (!desktop) setTerminalOpen(false);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(
    () => () => {
      if (clickTimeoutRef.current) window.clearTimeout(clickTimeoutRef.current);
      if (tooltipTimeoutRef.current) window.clearTimeout(tooltipTimeoutRef.current);
      calWidthSyncCleanupRef.current?.();
      calWidthSyncCleanupRef.current = null;
    },
    [],
  );

  // Lock body scroll + track visual viewport for mobile terminal (iOS-safe)
  const [mobileVh, setMobileVh] = useState<number | null>(null);
  const [mobileVOffset, setMobileVOffset] = useState(0);
  useEffect(() => {
    if (!isDesktop && terminalOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
      const vv = window.visualViewport;
      if (vv) {
        const update = () => {
          setMobileVh(vv.height);
          setMobileVOffset(vv.offsetTop);
        };
        update();
        vv.addEventListener("resize", update);
        vv.addEventListener("scroll", update);
        return () => {
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.touchAction = '';
          vv.removeEventListener("resize", update);
          vv.removeEventListener("scroll", update);
        };
      }
      return () => {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.touchAction = '';
      };
    }
  }, [isDesktop, terminalOpen]);

  // Shared theme from context (persisted + system-aware)
  const { theme, setThemeMode } = useTheme();

  // Keep Cal embed UI in sync with the site's auto-resolved theme.
  useEffect(() => {
    async function syncCalUi() {
      removeCalModalInstances();
      await applyCalUiForTheme(theme);
    }

    void syncCalUi();
  }, [theme]);

  // Build blog terminal entries from posts
  const allFiles = useMemo(() => {
    const files = { ...terminalFiles };
    for (const post of posts) {
      files[`blog/${post.slug}.md`] = `# ${post.title}\n\n*${new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}*\n\n${post.description || post.content.slice(0, 400)}\n\nRead full post: /blog/${post.slug}`;
    }
    return files;
  }, [terminalFiles, posts]);

  const allUrls = useMemo(() => {
    const urls = { ...terminalUrls };
    for (const post of posts) {
      urls[`blog/${post.slug}.md`] = `/blog/${post.slug}`;
    }
    return urls;
  }, [terminalUrls, posts]);

  const handleThemeChange = useCallback((themeName: string) => {
    setThemeMode(themeName);
    const nextTheme =
      themeName === "auto"
        ? resolveAutoTheme(window.matchMedia("(prefers-color-scheme: dark)").matches)
        : THEMES.find((t) => t.name === themeName) || theme;
    removeCalModalInstances();
    void applyCalUiForTheme(nextTheme);
  }, [setThemeMode, theme]);

  const clearDesktopTooltip = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      window.clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setDesktopTooltip(null);
  }, []);

  const showDesktopTooltip = useCallback(
    (key: string, clientX: number, clientY: number) => {
      if (!isDesktop) return;
      if (tooltipTimeoutRef.current) window.clearTimeout(tooltipTimeoutRef.current);
      setDesktopTooltip({ key, x: clientX, y: clientY });
      tooltipTimeoutRef.current = window.setTimeout(() => {
        setDesktopTooltip(null);
        tooltipTimeoutRef.current = null;
      }, DESKTOP_OPEN_HINT_MS);
    },
    [isDesktop],
  );

  useEffect(() => {
    if (!desktopTooltip) return;

    const handleMouseMove = (event: MouseEvent) => {
      const dx = event.clientX - desktopTooltip.x;
      const dy = event.clientY - desktopTooltip.y;
      if (Math.hypot(dx, dy) > 6) {
        clearDesktopTooltip();
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [desktopTooltip, clearDesktopTooltip]);

  const handleClick = useCallback((e: React.MouseEvent, type: string, id: string, url?: string) => {
    const key = `${type}-${id}`;
    if ((e.metaKey || e.ctrlKey || e.shiftKey || e.detail === 2) && url) {
      if (clickTimeoutRef.current && clickKeyRef.current === key) {
        window.clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      clearDesktopTooltip();
      if (e.metaKey || e.ctrlKey) window.open(url, "_blank");
      else if (url.startsWith("/")) router.push(url);
      else window.location.assign(url);
      return;
    }

    if (clickTimeoutRef.current) window.clearTimeout(clickTimeoutRef.current);
    clickKeyRef.current = key;
    singleClickCountRef.current += 1;
    if (singleClickCountRef.current >= 3) {
      showDesktopTooltip(key, e.clientX, e.clientY);
    }
    clickTimeoutRef.current = window.setTimeout(() => {
      if (activeId === key) {
        setActiveId(null);
        setActiveFile(null);
        return;
      }
      setActiveId(key);

      let command: string | null = null;
      let content: string | null = null;

      if (type === "work") {
        const item = currentWork.find((w) => w.company === id);
        if (item) {
          command = `cat ${item.slug}.md`;
          content = allFiles[`${item.slug}.md`] ?? null;
        }
      } else if (type === "hackathon") {
        const item = hackathons.find((h) => h.name === id);
        if (item) {
          command = `cat projects/${item.slug}.md`;
          content = allFiles[`projects/${item.slug}.md`] ?? null;
        }
      } else if (type === "post") {
        const post = posts.find((p) => p.slug === id);
        if (post) {
          command = `cat blog/${post.slug}.md`;
          content = allFiles[`blog/${post.slug}.md`] ?? null;
        }
      }

      if (command && content) {
        setActiveFile({ command, content });
        if (!terminalOpen) setTerminalOpen(true);
      }
    }, DESKTOP_CLICK_DELAY_MS);
  }, [activeId, currentWork, hackathons, posts, allFiles, terminalOpen, router, clearDesktopTooltip, showDesktopTooltip]);

  const toggleMobile = useCallback((key: string) => {
    setMobileExpanded((prev) => (prev === key ? null : key));
  }, []);

  const mobileMdStyles: MdStyles = useMemo(() => ({
    headingColor: theme.text,
    textColor: theme.text,
    dimColor: theme.textDim,
    isDark: theme.isDark,
  }), [theme]);

  const cardStyle = ghostCardStyle(theme);
  const calPath15 = useMemo(() => withCalDuration(toCalPath(calLink15), 15), [calLink15]);
  const calPath30 = useMemo(() => withCalDuration(toCalPath(calLink30), 30), [calLink30]);
  const calButtonTheme = theme.isDark ? "dark" : "light";
  const isTrackingCallModalRef = useRef(false);
  const hasSeenTrackedCallModalRef = useRef(false);
  const updateCallUrlForDuration = useCallback(
    (minutes: number, mode: "push" | "replace" = "replace") => {
      if (typeof window === "undefined") return;
      const durationLabel = `${minutes}m`;
      const nextUrl = `/call?duration=${durationLabel}`;
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (currentUrl === nextUrl) return;
      const method = mode === "push" ? "pushState" : "replaceState";
      window.history[method](
        { ...(window.history.state ?? {}), section: "call", duration: durationLabel },
        "",
        nextUrl,
      );
      syncDocumentTitle();
    },
    [],
  );
  const closeCalModal = useCallback(() => {
    calWidthSyncCleanupRef.current?.();
    calWidthSyncCleanupRef.current = null;
    isTrackingCallModalRef.current = false;
    hasSeenTrackedCallModalRef.current = false;
    removeCalModalInstances();
    if (window.location.pathname === "/call") {
      window.history.replaceState(
        { ...(window.history.state ?? {}), section: "home" },
        "",
        "/",
      );
      syncDocumentTitle();
    }
  }, []);
  const openCalModal = useCallback(async (namespace: "15m" | "30m", calLink: string, duration: 15 | 30) => {
    // Reset tracking before replacing/re-opening modal.
    isTrackingCallModalRef.current = false;
    hasSeenTrackedCallModalRef.current = false;

    updateCallUrlForDuration(duration, "push");
    calWidthSyncCleanupRef.current?.();
    calWidthSyncCleanupRef.current = null;
    removeCalModalInstances();
    // Force a fresh namespace per click so repeated opens of the same CTA
    // cannot reuse stale modal/theme state from previous runs.
    const modalNamespace = `${namespace}-${Date.now()}`;
    const cal = await getCalApi({ namespace: modalNamespace });
    applyCalUiConfig(cal, theme);
    cal("modal", {
      calLink,
      config: {
        layout: "month_view",
        useSlotsViewOnSmallScreen: "true",
        duration: String(duration),
        theme: calButtonTheme,
        "ui.color-scheme": calButtonTheme,
      },
    });
    isTrackingCallModalRef.current = true;
    hasSeenTrackedCallModalRef.current = false;
    calWidthSyncCleanupRef.current = beginCalModalWidthSync(980, 2800);
  }, [calButtonTheme, theme, updateCallUrlForDuration]);
  const hasAutoOpenedCallRef = useRef(false);

  useEffect(() => {
    if (initialCallIntent === "none" || hasAutoOpenedCallRef.current) return;
    if (typeof document !== "undefined" && document.querySelector("cal-modal-box")) {
      hasAutoOpenedCallRef.current = true;
      return;
    }

    const dedupeKey = `${window.location.pathname}${window.location.search}`;
    const timerId = window.setTimeout(() => {
      const now = Date.now();
      const trackedWindow = window as Window & {
        __kellerAutoCallOpen?: { key: string; ts: number };
      };
      const prior = trackedWindow.__kellerAutoCallOpen;
      if (prior && prior.key === dedupeKey && now - prior.ts < 2500) {
        hasAutoOpenedCallRef.current = true;
        return;
      }
      trackedWindow.__kellerAutoCallOpen = { key: dedupeKey, ts: now };
      hasAutoOpenedCallRef.current = true;
      if (initialCallIntent === "30m") {
        void openCalModal("30m", calPath30, 30);
        return;
      }
      void openCalModal("15m", calPath15, 15);
    }, 280);
    return () => window.clearTimeout(timerId);
  }, [initialCallIntent, openCalModal, calPath15, calPath30]);

  useEffect(() => {
    const handleEscapeToCloseCal = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!isCalModalVisible()) return;
      closeCalModal();
    };
    window.addEventListener("keydown", handleEscapeToCloseCal);
    return () => window.removeEventListener("keydown", handleEscapeToCloseCal);
  }, [closeCalModal]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!isTrackingCallModalRef.current) return;

      const modalVisible = isCalModalVisible();
      if (modalVisible) {
        hasSeenTrackedCallModalRef.current = true;
        return;
      }

      if (!hasSeenTrackedCallModalRef.current) return;

      isTrackingCallModalRef.current = false;
      hasSeenTrackedCallModalRef.current = false;

      if (window.location.pathname !== "/call") return;

      closeCalModal();
    }, 200);

    return () => window.clearInterval(intervalId);
  }, [closeCalModal]);

  /* ── Fluent-style glossy hover (event delegation) ── */
  const mainRef = useRef<HTMLElement>(null);

  const handleGlossMove = useCallback((e: React.MouseEvent) => {
    const card = (e.target as HTMLElement).closest(".ghost-card") as HTMLElement | null;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--gx", `${e.clientX - rect.left}px`);
    card.style.setProperty("--gy", `${e.clientY - rect.top}px`);
    card.style.setProperty("--gloss-opacity", "1");
  }, []);

  const handleGlossLeave = useCallback((e: React.MouseEvent) => {
    const card = (e.target as HTMLElement).closest(".ghost-card") as HTMLElement | null;
    if (!card) return;
    const related = e.relatedTarget as HTMLElement | null;
    if (related && card.contains(related)) return;
    card.style.setProperty("--gloss-opacity", "0");
  }, []);

  // Compute the window.scrollY offset at which the Writing heading aligns
  // with the terminal pane's top edge. A fixed-position mask covers the
  // viewport area above the terminal so any home content in that band is
  // hidden while expanded.
  const computeWritingScrollTarget = useCallback(() => {
    const heading = writingSectionRef.current;
    if (!heading) return 0;
    const wrapper = terminalWrapperRef.current;
    const desiredTop = wrapper
      ? wrapper.getBoundingClientRect().top
      : window.innerHeight * 0.1;
    const headingTop = heading.getBoundingClientRect().top;
    return Math.max(0, window.scrollY + headingTop - desiredTop);
  }, []);

  const scrollToWriting = useCallback((behavior: ScrollBehavior = "smooth") => {
    window.scrollTo({ top: computeWritingScrollTarget(), behavior });
  }, [computeWritingScrollTarget]);

  // Sequence the expand transition: smooth-scroll to writing target with
  // home still in document flow, then drop home from layout (display:none)
  // once the scroll has settled — at which point the doc shrinks to just
  // writing + footer and the natural scrollbar takes over.
  const expandToBlogs = useCallback(() => {
    if (homeCollapseTimerRef.current) {
      window.clearTimeout(homeCollapseTimerRef.current);
      homeCollapseTimerRef.current = null;
    }
    setBlogsExpanded(true);
    setHomeCollapsed(false);
    requestAnimationFrame(() => scrollToWriting("smooth"));
    homeCollapseTimerRef.current = window.setTimeout(() => {
      setHomeCollapsed(true);
      // Once home is gone the doc bottom-aligns naturally; reset to top.
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      homeCollapseTimerRef.current = null;
    }, 700);
  }, [scrollToWriting]);

  // Sequence the collapse transition: re-mount home, jump scrollY to the
  // writing target so the visual position stays put, then smooth-scroll
  // back to 0 (revealing the home content from above).
  const collapseToHome = useCallback(() => {
    if (homeCollapseTimerRef.current) {
      window.clearTimeout(homeCollapseTimerRef.current);
      homeCollapseTimerRef.current = null;
    }
    setBlogsExpanded(false);
    setHomeCollapsed(false);
    requestAnimationFrame(() => {
      window.scrollTo({
        top: computeWritingScrollTarget(),
        behavior: "instant" as ScrollBehavior,
      });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }, [computeWritingScrollTarget]);

  const handleViewAllClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.metaKey || e.ctrlKey) {
      window.open("/blog", "_blank", "noopener,noreferrer");
      return;
    }
    if (blogsExpanded) {
      collapseToHome();
      if (!hasShownWelcomeRef.current) {
        hasShownWelcomeRef.current = true;
        requestTerminalAutoType(["cd .. && cat welcome.md"]);
      } else {
        requestTerminalAutoType(["cd .."]);
      }
      if (window.location.pathname === "/blog") {
        window.history.pushState({ section: "home" }, "", "/");
        syncDocumentTitle();
      }
      return;
    }
    expandToBlogs();
    requestTerminalAutoType(["clear && cd blog && cat README.md"]);
    if (window.location.pathname !== "/blog") {
      window.history.pushState({ section: "blogs" }, "", "/blog");
      syncDocumentTitle();
    }
  }, [blogsExpanded, requestTerminalAutoType, expandToBlogs, collapseToHome]);

  // Direct /blog cold load: home is already display:none on first paint, so
  // writing is naturally at the top of the document — no scroll needed.

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === "/blog") {
        if (!blogsExpanded) expandToBlogs();
      } else {
        if (blogsExpanded) collapseToHome();
        if (!hasShownWelcomeRef.current) {
          hasShownWelcomeRef.current = true;
          requestTerminalAutoType(["cd .. && cat welcome.md"]);
        } else {
          requestTerminalAutoType(["cd .."]);
        }
      }
      syncDocumentTitle();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [requestTerminalAutoType, blogsExpanded, expandToBlogs, collapseToHome]);

  useEffect(
    () => () => {
      if (homeCollapseTimerRef.current) {
        window.clearTimeout(homeCollapseTimerRef.current);
      }
    },
    [],
  );

  return (
    <main
      ref={mainRef}
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.bg }}
      onMouseMove={handleGlossMove}
      onMouseOut={handleGlossLeave}
    >
      <style>{`
        .ghost-card:hover { background-color: var(--hover-bg); border-color: var(--hover-border); box-shadow: var(--hover-shadow); }
        .ghost-card:active { box-shadow: var(--active-shadow); }
        .ghost-card:active::after { opacity: 1; }
        .ghost-card { position: relative; overflow: hidden; }
        .ghost-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            220px 150px ellipse at var(--gx, -300px) var(--gy, -300px),
            var(--gloss-color, rgba(255,255,255,0.06)) 0%,
            transparent 100%
          );
          opacity: var(--gloss-opacity, 0);
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 1;
        }
        .ghost-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: var(--press-overlay, rgba(0,0,0,0.08));
          opacity: 0;
          transition: opacity 120ms ease;
          pointer-events: none;
          z-index: 2;
        }
      `}</style>

      {/* Content column — centered on small screens, left-aligned when terminal visible on lg */}
      <div
        className={`px-8 pt-16 sm:pt-24 pb-16 sm:pb-24 lg:pb-[10vh] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          terminalOpen && !terminalFullscreen ? "lg:max-w-[50vw]" : ""
        }`}
        style={{
          opacity: terminalFullscreen ? 0 : 1,
          pointerEvents: terminalFullscreen ? "none" : "auto",
        }}
      >
        <div className="max-w-[480px] mx-auto">
          {/* Home-only sections: removed from layout flow (display:none) when
              the user has fully transitioned to the expanded /blog view.
              We use a separate `homeCollapsed` flag (rather than just
              `blogsExpanded`) so the smooth-scroll animation that runs when
              expanding has the home content in place to scroll past;
              `homeCollapsed` flips to true on a timer once the scroll has
              settled, shrinking the document to just the writing + footer
              region (scrollbar then reflects only what's visible). */}
          <div
            style={{
              display: homeCollapsed ? "none" : undefined,
              visibility: blogsExpanded && !homeCollapsed ? "hidden" : "visible",
              pointerEvents: blogsExpanded ? "none" : "auto",
            }}
          >
          {/* Header */}
          <header>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>{name}</h1>
                <p className="text-sm mt-1.5" style={{ color: theme.textDim }}>{tagline}</p>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                {socialLinks.filter((l) => socialIcons[l.label]).map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-5 h-5 transition-colors hover:opacity-80" style={{ color: theme.textMuted }} aria-label={link.label} title={link.label}>
                    {socialIcons[link.label]}
                  </a>
                ))}
              </div>
            </div>
            <p className="text-[15px] mt-6 leading-relaxed" style={{ color: theme.textDim }}>{bio}</p>

            {/* Call buttons */}
            <p className="text-[15px] mt-6 mb-4 leading-relaxed" style={{ color: theme.textDim }}>
              If you&apos;re into agentic engineering, let&apos;s talk:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void openCalModal("15m", calPath15, 15)}
                className={`${callCardClass} ghost-card flex items-center gap-3 py-3`}
                style={cardStyle}
              >
                <svg className="w-4 h-4 shrink-0" style={{ color: theme.textMuted }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                <div>
                  <span className="font-medium text-[14px]" style={{ color: theme.text }}>Quick call</span>
                  <span className="text-xs block" style={{ color: theme.textMuted }}>15 min</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => void openCalModal("30m", calPath30, 30)}
                className={`${callCardClass} ghost-card flex items-center gap-3 py-3`}
                style={cardStyle}
              >
                <svg className="w-4 h-4 shrink-0" style={{ color: theme.textMuted }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <div>
                  <span className="font-medium text-[14px]" style={{ color: theme.text }}>Deep dive</span>
                  <span className="text-xs block" style={{ color: theme.textMuted }}>30 min</span>
                </div>
              </button>
            </div>

            {/* Terminal link — desktop: collapses when terminal open */}
            <div className={`hidden lg:grid transition-all duration-300 ${terminalOpen ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
              <div className="overflow-hidden">
                <button
                  onClick={() => setTerminalOpen(true)}
                  className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 border border-transparent ghost-card"
                  style={{ ...cardStyle, color: theme.text }}
                >
                  <TerminalIcon />
                  Access bash terminal
                </button>
              </div>
            </div>

            {/* Terminal link — mobile: show/hide immediately, no animation */}
            {!terminalOpen && (
              <button
                onClick={() => setTerminalOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer border border-transparent ghost-card"
                style={{ ...cardStyle, color: theme.text }}
              >
                <TerminalIcon />
                Access bash terminal
              </button>
            )}
          </header>

          <hr className="my-8" style={{ borderColor: theme.border }} />

          {/* Currently */}
          <Section title="Currently" theme={theme}>
            {currentWork.map((item) => {
              const key = `work-${item.company}`;
              const isMobileOpen = mobileExpanded === key;
              return (
                <div key={item.company}>
                  <div className="relative hidden lg:block">
                    <button onClick={(e) => handleClick(e, "work", item.company, item.url)} className={`${cardClass} ghost-card flex items-start justify-between gap-4`} style={cardStyle}>
                      <div className="min-w-0">
                        <span className="font-medium text-[15px]" style={{ color: theme.text }}>{item.company}</span>
                        <p className="text-sm mt-0.5" style={{ color: theme.textDim }}>{item.description}</p>
                      </div>
                      <span className="text-xs shrink-0 mt-1" style={{ color: theme.textMuted }}>{item.role}</span>
                    </button>
                  </div>
                  <button onClick={() => toggleMobile(key)} className={`lg:hidden flex ${cardClass} ghost-card items-start justify-between gap-4`} style={cardStyle}>
                    <div className="min-w-0">
                      <span className="font-medium text-[15px]" style={{ color: theme.text }}>{item.company}</span>
                      <p className="text-sm mt-0.5" style={{ color: theme.textDim }}>{item.description}</p>
                    </div>
                    <span className="text-xs shrink-0 mt-1" style={{ color: theme.textMuted }}>{item.role}</span>
                  </button>
                  <MobileDetail open={isMobileOpen}>
                    <div className="text-sm leading-relaxed">{renderMarkdown(item.detail, mobileMdStyles)}</div>
                    {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:text-blue-400 mt-2 inline-block">Visit &rarr;</a>}
                  </MobileDetail>
                </div>
              );
            })}
          </Section>

          <hr className="my-8" style={{ borderColor: theme.border }} />

          {/* Projects */}
          <Section title="Projects" theme={theme}>
            {hackathons.map((win) => {
              const key = `hackathon-${win.name}`;
              const isMobileOpen = mobileExpanded === key;
              return (
                <div key={win.name}>
                  <div className="relative hidden lg:block">
                    <button onClick={(e) => handleClick(e, "hackathon", win.name, win.url)} className={`${cardClass} ghost-card flex items-start justify-between gap-4`} style={cardStyle}>
                      <div className="min-w-0">
                        <span className="font-medium text-[15px]" style={{ color: theme.text }}>{win.project}</span>
                        <p className="text-sm mt-0.5" style={{ color: theme.textDim }}>{win.name}</p>
                      </div>
                      <span className="text-xs shrink-0 mt-1" style={{ color: theme.textMuted }}>{win.prize}</span>
                    </button>
                  </div>
                  <button onClick={() => toggleMobile(key)} className={`lg:hidden flex ${cardClass} ghost-card items-start justify-between gap-4`} style={cardStyle}>
                    <div className="min-w-0">
                      <span className="font-medium text-[15px]" style={{ color: theme.text }}>{win.project}</span>
                      <p className="text-sm mt-0.5" style={{ color: theme.textDim }}>{win.name}</p>
                    </div>
                    <span className="text-xs shrink-0 mt-1" style={{ color: theme.textMuted }}>{win.prize}</span>
                  </button>
                  <MobileDetail open={isMobileOpen}>
                    <div className="text-sm leading-relaxed">{renderMarkdown(win.detail, mobileMdStyles)}</div>
                    <a href={win.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:text-blue-400 mt-2 inline-block">Visit &rarr;</a>
                  </MobileDetail>
                </div>
              );
            })}
          </Section>

          <hr className="my-8" style={{ borderColor: theme.border }} />
          </div>

          {/* Writing + footer block. On home, the footer flows naturally
              right after the preview posts (no padding gap). On expanded,
              the block is pinned to the terminal pane's height (80vh) and
              uses flex to push the footer to its bottom — Writing aligns
              with the terminal top, footer aligns with the terminal
              bottom. */}
          <div
            className={
              blogsExpanded ? "lg:flex lg:flex-col lg:min-h-[80vh]" : ""
            }
          >
          <section ref={writingSectionRef}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>Writing</h2>
              <button
                type="button"
                onClick={handleViewAllClick}
                className="text-xs transition-colors hover:opacity-70"
                style={{ color: theme.textMuted }}
              >
                {blogsExpanded ? "\u2190 Back to home" : "View all \u2192"}
              </button>
            </div>
            {(blogsExpanded ? posts : previewPosts).length > 0 ? (
              <div>
                {(blogsExpanded ? posts : previewPosts).map((post) => {
                  const key = `post-${post.slug}`;
                  const isMobileOpen = mobileExpanded === key;
                  return (
                    <div key={post.slug}>
                      <div className="relative hidden lg:block">
                        <button onClick={(e) => handleClick(e, "post", post.slug, `/blog/${post.slug}`)} className={`${cardClass} ghost-card flex items-baseline justify-between gap-4`} style={cardStyle}>
                          <span className="text-[15px] font-medium" style={{ color: theme.text }}>{post.title}</span>
                          <span className="text-xs shrink-0 tabular-nums" style={{ color: theme.textMuted }}>{new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                        </button>
                      </div>
                      <button onClick={() => toggleMobile(key)} className={`lg:hidden flex ${cardClass} ghost-card items-baseline justify-between gap-4`} style={cardStyle}>
                        <span className="text-[15px] font-medium" style={{ color: theme.text }}>{post.title}</span>
                        <span className="text-xs shrink-0 tabular-nums" style={{ color: theme.textMuted }}>{new Date(post.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      </button>
                      <MobileDetail open={isMobileOpen}>
                        <p className="text-sm leading-relaxed" style={{ color: theme.textDim }}>{post.description || post.content.slice(0, 200)}</p>
                        <a href={`/blog/${post.slug}`} className="text-sm text-blue-500 hover:text-blue-400 mt-2 inline-block">Read more &rarr;</a>
                      </MobileDetail>
                    </div>
                  );
                })}
              </div>
            ) : (<p className="text-sm" style={{ color: theme.textMuted }}>Coming soon.</p>)}
          </section>

          <footer
            className={`pt-6 border-t ${blogsExpanded ? "lg:mt-auto mt-12" : "mt-12"}`}
            style={{ borderColor: theme.border }}
          >
            <p className="text-xs" style={{ color: theme.textMuted }}>&copy; 2026 Gabriel Keller</p>
          </footer>
          </div>
        </div>
      </div>

      {/* Single terminal instance — wrapper switches between desktop/mobile layout */}
      {isDesktop ? (
        <div ref={terminalWrapperRef} className={`fixed ease-[cubic-bezier(0.22,1,0.36,1)] ${
          !terminalOpen
            ? "transition-all duration-150 opacity-0 scale-95 pointer-events-none left-1/2 top-1/2 -translate-y-1/2 ml-4 w-[calc(50vw-5rem)] h-[80vh]"
            : terminalFullscreen
              ? "transition-all duration-500 opacity-100 scale-100 z-50 top-10 left-10 right-10 bottom-10 w-auto h-auto ml-0 translate-y-0"
              : "transition-all duration-500 opacity-100 scale-100 left-1/2 top-1/2 -translate-y-1/2 ml-4 w-[calc(50vw-5rem)] h-[80vh]"
        }`}>
          <Terminal
            activeFile={activeFile}
            staticFiles={allFiles}
            initialFiles={{}}
            initialUrls={allUrls}
            theme={theme}
            sessionKey="site"
            onClose={() => { setTerminalFullscreen(false); setTerminalOpen(false); }}
            onMinimize={() => { setTerminalFullscreen(false); setTerminalOpen(false); }}
            onExpand={() => setTerminalFullscreen(!terminalFullscreen)}
            onThemeChange={handleThemeChange}
            initialAutoCommands={
              initialSectionIntent === "blog"
                ? ["cd blog && cat README.md"]
                : ["cat welcome.md"]
            }
            autoTypeRequest={autoTypeRequest}
          />
        </div>
      ) : terminalOpen ? (
        <div className="fixed left-0 w-full z-50 overflow-hidden" style={{ backgroundColor: theme.termBg, top: 0, height: mobileVh ? `${mobileVh}px` : '100dvh', transform: mobileVOffset ? `translateY(${mobileVOffset}px)` : undefined }}>
          <Terminal
            activeFile={activeFile}
            staticFiles={allFiles}
            initialFiles={{}}
            initialUrls={allUrls}
            theme={theme}
            sessionKey="site"
            onClose={() => setTerminalOpen(false)}
            onMinimize={() => setTerminalOpen(false)}
            onExpand={() => {}}
            onThemeChange={handleThemeChange}
            borderless
            initialAutoCommands={
              initialSectionIntent === "blog"
                ? ["cd blog && cat README.md"]
                : ["cat welcome.md"]
            }
            autoTypeRequest={autoTypeRequest}
          />
        </div>
      ) : null}

      <DesktopCursorHint tooltip={desktopTooltip} />
    </main>
  );
}

/* ── Reusable sub-components ── */
function Section({ title, theme, children }: { title: string; theme: Theme; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function MobileDetail({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className={`lg:hidden overflow-hidden transition-all duration-300 ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
      <div className="pb-3 pt-1">{children}</div>
    </div>
  );
}

function DesktopCursorHint({
  tooltip,
}: {
  tooltip: { key: string; x: number; y: number } | null;
}) {
  if (!tooltip) return null;
  return (
    <div
      className="pointer-events-none fixed z-[70]"
      style={{
        left: tooltip.x,
        top: tooltip.y,
        transform: "translate(-50%, calc(-100% - 12px))",
      }}
    >
      <span className="relative inline-flex whitespace-nowrap rounded-xl bg-[#2b2d31]/95 px-3 py-1.5 text-center text-xs font-medium leading-none text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
        Double click to open
      </span>
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#2b2d31]/95"
      />
    </div>
  );
}
