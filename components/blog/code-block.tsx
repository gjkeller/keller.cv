"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface CodeBlockProps {
  children?: ReactNode;
  // Language tag lifted from the inner <code class="language-XYZ"> by
  // mdx-components.tsx. Optional because plain fenced blocks render too.
  language?: string;
}

/**
 * Wraps a Markdown code block with a copy button and the per-language
 * accent pill. Stays a thin shell around the original <pre> so all
 * theming continues to live in app/globals.css under `.blog-prose`.
 */
export function CodeBlock({ children, language }: CodeBlockProps) {
  const preRef = useRef<HTMLPreElement | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(
    () => () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    },
    [],
  );

  const handleCopy = async () => {
    const codeEl = preRef.current?.querySelector("code");
    const text = codeEl?.textContent ?? preRef.current?.textContent ?? "";
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      ok = false;
    }
    // Fallback for older browsers / non-secure contexts (e.g. http://*.local).
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    setStatus(ok ? "copied" : "error");
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => setStatus("idle"), 1800);
  };

  const buttonLabel =
    status === "copied"
      ? "Code copied to clipboard"
      : status === "error"
        ? "Copy failed — try selecting manually"
        : "Copy code to clipboard";

  return (
    <pre ref={preRef} data-language={language}>
      <div className="code-block-controls" data-status={status}>
        <button
          type="button"
          onClick={handleCopy}
          className="code-copy-button"
          aria-label={buttonLabel}
          title={buttonLabel}
        >
          {status === "copied" ? <CheckIcon /> : <CopyIcon />}
        </button>
        {language ? <span className="code-lang-pill">{language}</span> : null}
      </div>
      {children}
    </pre>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
