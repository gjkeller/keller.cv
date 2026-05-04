"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Theme } from "@/lib/themes";
import { THEME_NAMES } from "@/lib/themes";
import { renderMarkdown, type MdStyles } from "@/lib/render-md";

/* ── Types ── */
interface TerminalProps {
  activeFile: { command: string; content: string } | null;
  staticFiles?: Record<string, string>;
  initialFiles?: Record<string, string>;
  initialUrls?: Record<string, string>;
  theme: Theme;
  onClose?: () => void;
  onMinimize?: () => void;
  onExpand?: () => void;
  onThemeChange?: (name: string) => void;
  borderless?: boolean;
  sessionKey?: string;
  /** Commands auto-typed in sequence on first paint of a fresh session. */
  initialAutoCommands?: string[];
  /**
   * Externally-driven command chain (e.g. `["clear", "cat blogs.md", "cd blog"]`).
   * Increment `id` to retrigger; set to `null` for no request.
   */
  autoTypeRequest?: { commands: string[]; id: number } | null;
}

export { THEME_NAMES };

/* ── Virtual filesystem ── */
const DIRECTORIES: Record<string, string[]> = {
  "~": ["welcome.md", "about.md", "projects/", "blog/"],
  "projects": [],
  "blog": [],
};

function buildFileSystem(
  staticFiles: Record<string, string>,
  activeFiles: Record<string, string>,
  activeUrls: Record<string, string>,
  fileUrls: Record<string, string>,
) {
  const fs = { ...staticFiles, ...activeFiles };
  const urls = { ...fileUrls, ...activeUrls };
  const dirs: Record<string, string[]> = { "~": [], "projects": [], "blog": [] };

  const rootFiles = new Set<string>();
  const projFiles = new Set<string>();
  const blogFiles = new Set<string>();

  for (const key of Object.keys(fs)) {
    if (key.startsWith("projects/")) projFiles.add(key.replace("projects/", ""));
    else if (key.startsWith("blog/")) blogFiles.add(key.replace("blog/", ""));
    else rootFiles.add(key);
  }

  dirs["projects"] = [...projFiles];
  dirs["blog"] = [...blogFiles];
  dirs["~"] = [
    ...rootFiles,
    ...(projFiles.size ? ["projects/"] : []),
    ...(blogFiles.size ? ["blog/"] : []),
  ];

  return { fs, dirs, urls };
}

/* ── Help & man pages ── */
const AGENT_ALIASES = ["agent", "claude", "codex"];

const HELP_TEXT = `Available commands:

  help          Show this help message
  ls [dir]      List files in directory
  cat <file>    Read a file
  open <file>   Open the link associated with a file
  cd <dir>      Change directory
  pwd           Print working directory
  whoami        Who am I?
  clear         Clear terminal
  theme         Change the color theme
  man <cmd>     Manual for a command
  agent [msg]   Chat with an AI about Gabe

Try: ls, cat welcome.md, agent`;

const MAN_PAGES: Record<string, string> = {
  ls: "ls - list directory contents\n\nUsage: ls [directory]\n\nList files in the current or specified directory.",
  cat: "cat - concatenate and print files\n\nUsage: cat <filename>\n\nDisplay the contents of a file.",
  open: "open - open a file's associated URL\n\nUsage: open <filename>\n\nOpens the website or page linked to the file in a new tab.",
  cd: "cd - change directory\n\nUsage: cd <directory>\n\nChange the current working directory. Use 'cd ..' or 'cd ~' to go home.",
  help: "help - display available commands\n\nUsage: help\n\nShows a list of all available shell commands.",
  pwd: "pwd - print working directory\n\nUsage: pwd\n\nPrint the full path of the current directory.",
  whoami: "whoami - display effective user id\n\nUsage: whoami\n\nPrint the user name associated with the current session.",
  clear: "clear - clear the terminal screen\n\nUsage: clear\n\nRemoves all previous output from the terminal.",
  man: "man - format and display manual pages\n\nUsage: man <command>\n\nDisplay the manual page for the specified command.",
  theme: `theme - change the color theme\n\nUsage:\n  theme --list       List available themes\n  theme --set <name> Set the active theme\n  theme --help       Show this help\n\nAvailable themes: ${THEME_NAMES.join(", ")}`,
  agent: "agent - chat with an AI about Gabe\n\nUsage:\n  agent              Enter interactive chat mode\n  agent <message>    Ask a question and stay in chat mode\n\nAliases: claude, codex\n\nType 'exit' to leave chat mode.",
};

/* ── Typewriter hook ── */
function useTypewriter(text: string, speed: number = 8) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      const chunk = Math.min(4, text.length - i);
      setDisplayed(text.slice(0, i + chunk));
      i += chunk;
      if (i >= text.length) { setDone(true); clearInterval(interval); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
}

/* ── Terminal component ── */
export function Terminal({
  activeFile,
  staticFiles = {},
  initialFiles = {},
  initialUrls = {},
  theme,
  onClose,
  onMinimize,
  onExpand,
  onThemeChange,
  borderless = false,
  sessionKey = "main",
  initialAutoCommands,
  autoTypeRequest = null,
}: TerminalProps) {
  const dark = theme.isDark;
  const [history, setHistory] = useState<{ prompt: string; command: string; output: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [dynamicFiles, setDynamicFiles] = useState<Record<string, string>>(initialFiles);
  const [dynamicUrls, setDynamicUrls] = useState<Record<string, string>>(initialUrls);
  const [cwd, setCwd] = useState("~");

  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const savedInput = useRef("");
  const [cursorPos, setCursorPos] = useState(0);

  /* ── Agent chat mode ── */
  const [chatMode, setChatMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [streamingOutput, setStreamingOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastCtrlCRef = useRef<number>(0);

  const [autoCommand, setAutoCommand] = useState("");
  const [autoOutput, setAutoOutput] = useState("");
  const [autoPhase, setAutoPhase] = useState<"idle" | "typing-cmd" | "typing-output">("idle");
  const prevFileRef = useRef<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  // Queue of upcoming auto-type commands. We pop the head, type it, run it,
  // commit its output to history, then advance to the next.
  const autoQueueRef = useRef<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const syncCursor = useCallback(() => {
    const pos = inputRef.current?.selectionStart ?? 0;
    setCursorPos((prev) => (prev === pos ? prev : pos));
  }, []);

  const cmdTyper = useTypewriter(autoPhase === "typing-cmd" ? autoCommand : "", 20);
  const outputTyper = useTypewriter(autoPhase === "typing-output" ? autoOutput : "", 6);

  const { fs, dirs, urls } = buildFileSystem(staticFiles, dynamicFiles, dynamicUrls, initialUrls);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(`terminal-state:${sessionKey}`);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          history?: { prompt: string; command: string; output: string }[];
          dynamicFiles?: Record<string, string>;
          dynamicUrls?: Record<string, string>;
          cwd?: string;
          cmdHistory?: string[];
        };
        if (parsed.history) setHistory(parsed.history);
        if (parsed.dynamicFiles) setDynamicFiles(parsed.dynamicFiles);
        if (parsed.dynamicUrls) setDynamicUrls(parsed.dynamicUrls);
        if (parsed.cwd) setCwd(parsed.cwd);
        if (parsed.cmdHistory) setCmdHistory(parsed.cmdHistory);
      }
    } catch {
      // Ignore storage parse errors and continue with default session.
    } finally {
      setStorageReady(true);
    }
  }, [sessionKey]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") return;
    const payload = {
      history,
      dynamicFiles,
      dynamicUrls,
      cwd,
      cmdHistory,
    };
    try {
      window.sessionStorage.setItem(`terminal-state:${sessionKey}`, JSON.stringify(payload));
    } catch {
      // Ignore quota/storage errors.
    }
  }, [storageReady, sessionKey, history, dynamicFiles, dynamicUrls, cwd, cmdHistory]);

  /* ── Path resolution ── */
  const resolvePath = useCallback((path: string): string => {
    if (path === "~" || path === "") return "~";
    if (path === ".." || path === "../") return "~";
    if (path === "." || path === "./") return cwd;
    if (path.startsWith("~/")) return path.slice(2) || "~";
    if (cwd === "~") return path.replace(/\/$/, "");
    return `${cwd}/${path}`.replace(/\/$/, "");
  }, [cwd]);

  const resolveFile = useCallback((path: string): string => {
    if (path.startsWith("~/")) return path.slice(2);
    if (path.startsWith("./")) path = path.slice(2);
    if (cwd === "~") return path;
    return `${cwd}/${path}`;
  }, [cwd]);

  /* ── Tab completion ── */
  const getCompletions = useCallback((partial: string): string[] => {
    const parts = partial.split(/\s+/);
    const commands = ["help", "ls", "ll", "cat", "open", "cd", "pwd", "whoami", "clear", "man", "echo", "date", "theme", "agent", "claude", "codex"];

    if (parts.length <= 1) return commands.filter((c) => c.startsWith(partial));

    const cmd = parts[0].toLowerCase();
    const arg = parts[parts.length - 1];

    if (cmd === "theme") {
      const themeOptions = [...THEME_NAMES, "auto", "--list", "--set", "--help"];
      return themeOptions.filter((o) => o.startsWith(arg));
    }
    if (cmd === "man") return commands.filter((c) => c.startsWith(arg));
    if (cmd === "cd") {
      const currentDir = cwd === "~" ? "~" : cwd;
      return (dirs[currentDir] || []).filter((e) => e.endsWith("/") && e.startsWith(arg));
    }

    // Handle path-prefixed args like "blog/hel" or "projects/"
    const slashIdx = arg.lastIndexOf("/");
    if (slashIdx >= 0) {
      const dirPrefix = arg.slice(0, slashIdx);
      const filePrefix = arg.slice(slashIdx + 1);
      const targetDir = cwd === "~" ? dirPrefix : `${cwd}/${dirPrefix}`;
      const dirEntries = dirs[targetDir] || [];
      const candidates: string[] = [...dirEntries];
      for (const key of Object.keys(fs)) {
        if (key.startsWith(targetDir + "/")) {
          const relative = key.slice(targetDir.length + 1);
          if (!relative.includes("/") && !candidates.includes(relative)) candidates.push(relative);
        }
      }
      return candidates
        .filter((f) => f.startsWith(filePrefix))
        .map((f) => `${dirPrefix}/${f}`);
    }

    const currentDir = cwd === "~" ? "~" : cwd;
    const entries = dirs[currentDir] || [];
    const allFiles: string[] = [...entries];
    for (const key of Object.keys(fs)) {
      if (cwd === "~" && !key.includes("/")) {
        if (!allFiles.includes(key)) allFiles.push(key);
      } else if (key.startsWith(cwd + "/")) {
        const relative = key.slice(cwd.length + 1);
        if (!relative.includes("/") && !allFiles.includes(relative)) allFiles.push(relative);
      }
    }
    return allFiles.filter((f) => f.startsWith(arg));
  }, [cwd, dirs, fs]);

  const currentPrompt = chatMode ? "user> " : cwd === "~" ? "$ " : `${cwd} $ `;

  const MSG_CHAR_LIMIT = 1000;

  /* ── Agent chat ── */
  const sendChatMessage = useCallback(async (userMessage: string, freshSession = false) => {
    // Client-side truncation with notice
    let msg = userMessage;
    let truncNotice = "";
    if (msg.length > MSG_CHAR_LIMIT) {
      msg = msg.slice(0, MSG_CHAR_LIMIT);
      truncNotice = `(message trimmed to ${MSG_CHAR_LIMIT} characters)\n`;
    }

    const base = freshSession ? [] : chatMessages;
    const nextMessages = [...base, { role: "user" as const, content: msg }];
    setChatMessages(nextMessages);

    const prompt = "user> ";
    const cmdLabel = userMessage;

    // Show user prompt immediately (with truncation notice if applicable)
    setHistory((prev) => [...prev, { prompt, command: cmdLabel, output: truncNotice }]);
    setIsStreaming(true);
    setStreamingOutput("");

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        const errorMsg = err.error ?? `Error: ${res.status}`;
        // Replace last entry with error
        setHistory((prev) => [...prev.slice(0, -1), { prompt, command: cmdLabel, output: truncNotice + errorMsg }]);
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setIsStreaming(false); return; }

      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamingOutput(full);
      }

      // Replace last entry with final output (preserve truncation notice)
      setHistory((prev) => [...prev.slice(0, -1), { prompt, command: cmdLabel, output: truncNotice + (full || "(no response)") }]);
      setChatMessages((prev) => [...prev, { role: "user", content: msg }, { role: "assistant", content: full }]);
      setStreamingOutput("");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        const partial = streamingOutput;
        setHistory((prev) => [...prev.slice(0, -1), { prompt, command: cmdLabel, output: truncNotice + (partial ? partial + "\n(cancelled)" : "(cancelled)") }]);
      } else {
        setHistory((prev) => [...prev.slice(0, -1), { prompt, command: cmdLabel, output: truncNotice + "Connection error. Try again." }]);
      }
    } finally {
      setStreamingOutput("");
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [chatMessages, streamingOutput]);

  /* ── Agent greeting (no visible user prompt) ── */
  const sendGreeting = useCallback(async () => {
    const greetMsg = [{ role: "user" as const, content: "Say a brief, friendly greeting to a new visitor. One or two sentences max. Don't use emojis." }];
    setChatMessages(greetMsg);

    setIsStreaming(true);
    setStreamingOutput("");

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: greetMsg, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
        signal: controller.signal,
      });

      if (!res.ok) {
        setHistory((prev) => [...prev, { prompt: "", command: "", output: "Ask me anything about Gabe." }]);
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setIsStreaming(false); return; }

      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamingOutput(full);
      }

      setHistory((prev) => [...prev, { prompt: "", command: "", output: full || "Ask me anything about Gabe." }]);
      setChatMessages((prev) => [...prev, { role: "assistant", content: full }]);
      setStreamingOutput("");
    } catch {
      setHistory((prev) => [...prev, { prompt: "", command: "", output: "Ask me anything about Gabe." }]);
    } finally {
      setStreamingOutput("");
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, []);

  /* ── Command execution ── */
  const runCommand = useCallback((cmd: string): string => {
    const parts = cmd.trim().split(/\s+/);
    const base = parts[0]?.toLowerCase();
    const arg = parts.slice(1).join(" ");

    if (!base) return "";

    switch (base) {
      case "help":
        return HELP_TEXT;
      case "clear":
        return "__CLEAR__";
      case "pwd":
        return `/Users/gabe/keller.cv${cwd === "~" ? "" : `/${cwd}`}`;
      case "whoami":
        return "gabe";
      case "ll":
      case "ls": {
        const dir = arg ? resolvePath(arg) : cwd;
        const entries = dirs[dir] || dirs[dir.replace("/", "")];
        if (!entries) return `ls: ${arg || dir}: No such file or directory`;
        if (entries.length === 0) return "(empty)";
        return entries.join("  ");
      }
      case "cd": {
        if (!arg || arg === "~" || arg === "~/") { setCwd("~"); return ""; }
        if (arg === ".." || arg === "../") { setCwd("~"); return ""; }
        const target = resolvePath(arg);
        if (dirs[target] !== undefined) { setCwd(target); return ""; }
        return `cd: ${arg}: No such directory`;
      }
      case "cat": {
        if (!arg) return "usage: cat <filename>";
        const filePath = resolveFile(arg);
        const content = fs[filePath] || fs[arg];
        if (!content) return `cat: ${arg}: No such file or directory\n\nTry 'ls' to see available files.`;
        return content;
      }
      case "open": {
        if (!arg) return "usage: open <filename>";
        const filePath = resolveFile(arg);
        const url = urls[filePath] || urls[arg];
        if (!url) return `open: ${arg}: No URL associated with this file`;
        window.open(url, "_blank");
        return `Opening ${url}...`;
      }
      case "man": {
        if (!arg) return "What manual page do you want?\nTry: man ls, man cat, man help";
        const page = MAN_PAGES[arg.toLowerCase()];
        if (!page) return `No manual entry for ${arg}`;
        return page;
      }
      case "theme": {
        if (!arg || arg === "--help") return MAN_PAGES["theme"];
        if (arg === "--list" || arg === "-l") {
          const allThemes = [...THEME_NAMES, "auto"];
          return `Available themes:\n\n${allThemes.map((n) => `  ${n === (theme as Theme & { name: string }).name ? "● " : "  "}${n}${n === (theme as Theme & { name: string }).name ? " (active)" : ""}`).join("\n")}\n\nUsage: theme --set <name>`;
        }
        if (arg.startsWith("--set ") || arg.startsWith("-s ")) {
          const themeName = arg.replace(/^--(set|s)\s+/, "").replace(/^-s\s+/, "").trim();
          const valid = [...THEME_NAMES, "auto"];
          if (!valid.includes(themeName)) return `theme: unknown theme '${themeName}'\n\nAvailable: ${valid.join(", ")}`;
          onThemeChange?.(themeName);
          return `Theme set to '${themeName}'`;
        }
        const valid = [...THEME_NAMES, "auto"];
        if (valid.includes(arg)) { onThemeChange?.(arg); return `Theme set to '${arg}'`; }
        return `theme: unknown option '${arg}'\n\nTry: theme --help`;
      }
      case "echo":
        return arg;
      case "date":
        return new Date().toString();
      case "rm":
        return "rm: permission denied (and you wouldn't want to anyway)";
      case "sudo":
        return "gabe is not in the sudoers file. This incident will be reported.";
      case "vim":
      case "nano":
      case "emacs":
        return `${base}: this terminal is read-only. Try 'cat' instead.`;
      case "exit":
        return "Where would you even go?";
      case "agent":
      case "claude":
      case "codex": {
        setChatMode(true);
        setChatMessages([]);
        if (arg) {
          return "__AGENT_INLINE__:" + arg;
        }
        // Enter chat mode with a streamed greeting
        sendGreeting();
        return "__AGENT_GREET__";
      }
      default:
        return `command not found: ${base}\n\nType 'help' for available commands.`;
    }
  }, [fs, dirs, urls, cwd, resolvePath, resolveFile, onThemeChange, theme, sendChatMessage, sendGreeting]);

  /* ── Submit handler ── */
  const handleSubmit = useCallback(() => {
    if (isStreaming) return;

    const cmd = inputValue.trim();
    setInputValue("");
    setCursorPos(0);
    setHistoryIdx(-1);
    if (!cmd) return;
    setCmdHistory((prev) => [cmd, ...prev]);

    // Chat mode handling
    if (chatMode) {
      if (cmd.toLowerCase() === "exit" || cmd.toLowerCase() === "quit") {
        setChatMode(false);
        setChatMessages([]);
        setHistory((prev) => [...prev, { prompt: "user> ", command: cmd, output: "Leaving agent mode." }]);
        return;
      }
      if (cmd.toLowerCase() === "clear") { setHistory([]); return; }
      // Send as chat message
      sendChatMessage(cmd);
      return;
    }

    const output = runCommand(cmd);
    if (output === "__CLEAR__") { setHistory([]); return; }
    if (output.startsWith("__AGENT_INLINE__:")) {
      const inlineMsg = output.slice("__AGENT_INLINE__:".length);
      // Show the original command with the shell prompt and a hint
      setHistory((prev) => [...prev, { prompt: currentPrompt, command: cmd, output: "Agent mode enabled — just type to keep chatting. 'exit' to leave." }]);
      // Now fire the chat message (fresh session since we just entered agent mode)
      sendChatMessage(inlineMsg, true);
      return;
    }
    if (output === "__AGENT_GREET__") {
      // Show the command; sendGreeting appends a separate entry for the streamed greeting
      setHistory((prev) => [...prev, { prompt: currentPrompt, command: cmd, output: "" }]);
      return;
    }
    setHistory((prev) => [...prev, { prompt: currentPrompt, command: cmd, output }]);
  }, [inputValue, runCommand, currentPrompt, chatMode, isStreaming, sendChatMessage]);

  /* ── Key handler ── */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (autoPhase !== "idle") return;
    // Ctrl+A: move cursor to start of line
    if (e.key === "a" && e.ctrlKey) {
      e.preventDefault();
      if (inputRef.current) { inputRef.current.selectionStart = inputRef.current.selectionEnd = 0; }
      setCursorPos(0);
      return;
    }
    // Ctrl+C: cancel streaming, clear input, or double-press to exit chat
    if (e.key === "c" && e.ctrlKey) {
      // Allow native copy when text is selected
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0) return;
      e.preventDefault();
      if (isStreaming) { abortRef.current?.abort(); return; }
      if (inputValue) { setInputValue(""); setCursorPos(0); return; }
      // In chat mode with empty input: double Ctrl+C exits
      if (chatMode) {
        const now = Date.now();
        if (now - lastCtrlCRef.current < 1000) {
          setChatMode(false);
          setChatMessages([]);
          setHistory((prev) => [...prev, { prompt: "user> ", command: "^C", output: "Leaving agent mode." }]);
          lastCtrlCRef.current = 0;
          return;
        }
        lastCtrlCRef.current = now;
        setHistory((prev) => [...prev, { prompt: "user> ", command: "^C", output: "(press Ctrl+C again to exit agent mode)" }]);
        return;
      }
      setHistory((prev) => [...prev, { prompt: currentPrompt, command: "^C", output: "" }]);
      return;
    }
    // Ctrl+D: exit agent mode
    if (e.key === "d" && e.ctrlKey && chatMode) {
      e.preventDefault();
      if (isStreaming) abortRef.current?.abort();
      setChatMode(false);
      setChatMessages([]);
      setHistory((prev) => [...prev, { prompt: "user> ", command: "^D", output: "Leaving agent mode." }]);
      return;
    }
    if (isStreaming) return;
    // Horizontal arrow keys: handle directly to avoid hidden-input selection lag
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      let pos = cursorPos;
      if (e.key === "ArrowLeft") {
        if (e.metaKey) {
          pos = 0;
        } else if (e.altKey) {
          // Option+Left: jump to start of previous word
          let i = pos - 1;
          while (i > 0 && inputValue[i - 1] === ' ') i--;
          while (i > 0 && inputValue[i - 1] !== ' ') i--;
          pos = Math.max(0, i);
        } else {
          pos = Math.max(0, pos - 1);
        }
      } else {
        if (e.metaKey) {
          pos = inputValue.length;
        } else if (e.altKey) {
          // Option+Right: jump to end of next word
          let i = pos;
          while (i < inputValue.length && inputValue[i] === ' ') i++;
          while (i < inputValue.length && inputValue[i] !== ' ') i++;
          pos = i;
        } else {
          pos = Math.min(inputValue.length, pos + 1);
        }
      }
      setCursorPos(pos);
      if (inputRef.current) inputRef.current.selectionStart = inputRef.current.selectionEnd = pos;
      return;
    }
    if (e.key === "Enter") { handleSubmit(); return; }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const newIdx = historyIdx + 1;
      if (newIdx >= cmdHistory.length) return;
      if (historyIdx === -1) savedInput.current = inputValue;
      setHistoryIdx(newIdx);
      setInputValue(cmdHistory[newIdx]);
      setCursorPos(cmdHistory[newIdx].length);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx <= 0) { setHistoryIdx(-1); setInputValue(savedInput.current); setCursorPos(savedInput.current.length); return; }
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      setInputValue(cmdHistory[newIdx]);
      setCursorPos(cmdHistory[newIdx].length);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const completions = getCompletions(inputValue);
      if (completions.length === 1) {
        const parts = inputValue.split(/\s+/);
        let next: string;
        if (parts.length <= 1) next = completions[0] + " ";
        else { parts[parts.length - 1] = completions[0]; next = parts.join(" ") + (completions[0].endsWith("/") ? "" : " "); }
        setInputValue(next);
        setCursorPos(next.length);
      } else if (completions.length > 1) {
        setHistory((prev) => [...prev, { prompt: currentPrompt, command: inputValue, output: completions.join("  ") }]);
      }
    }
  }, [inputValue, cursorPos, cmdHistory, historyIdx, autoPhase, handleSubmit, getCompletions, currentPrompt, isStreaming, chatMode]);

  /* ── Auto-type lifecycle ──
   * Each entry in autoQueueRef is a single command line which may contain
   * `&&` chaining (e.g. `clear && cat blogs.md && cd blog`). The whole line
   * is typed verbatim by the typewriter; once the user-visible typing
   * finishes we execute each part of the chain in order, applying side
   * effects (cd / clear) and committing one history entry per non-clear
   * part.
   */
  type SideEffect = "none" | "clear" | { kind: "cd"; newCwd: string };

  const resolveSinglePart = (
    raw: string,
    cwdAtCall: string,
  ): { output: string; sideEffect: SideEffect } => {
    const [base, ...rest] = raw.trim().split(/\s+/);
    const arg = rest.join(" ");
    if (base === "clear") return { output: "", sideEffect: "clear" };
    if (base === "cd") {
      let newCwd = cwdAtCall;
      if (!arg || arg === "~" || arg === "~/" || arg === ".." || arg === "../") {
        newCwd = "~";
      } else {
        const target = arg.startsWith("~/")
          ? arg.slice(2) || "~"
          : cwdAtCall === "~"
            ? arg.replace(/\/$/, "")
            : `${cwdAtCall}/${arg}`.replace(/\/$/, "");
        if (dirs[target] !== undefined) newCwd = target;
      }
      return { output: "", sideEffect: { kind: "cd", newCwd } };
    }
    if (base === "cat") {
      const filePath = arg.startsWith("~/")
        ? arg.slice(2)
        : cwdAtCall === "~"
          ? arg
          : `${cwdAtCall}/${arg}`;
      const content = fs[filePath] || fs[arg] || `cat: ${arg}: No such file or directory`;
      return { output: content, sideEffect: "none" };
    }
    if (base === "ls") {
      const dir = arg
        ? arg === "~"
          ? "~"
          : arg.startsWith("~/")
            ? arg.slice(2) || "~"
            : cwdAtCall === "~"
              ? arg.replace(/\/$/, "")
              : `${cwdAtCall}/${arg}`.replace(/\/$/, "")
        : cwdAtCall;
      const entries = dirs[dir] || dirs[dir.replace("/", "")];
      return {
        output: entries
          ? entries.length
            ? entries.join("  ")
            : "(empty)"
          : `ls: ${arg || dir}: No such file or directory`,
        sideEffect: "none",
      };
    }
    return { output: "", sideEffect: "none" };
  };

  // Plan generated when a chain begins typing; consumed at commit time.
  type ChainPart = { command: string; output: string; sideEffect: SideEffect };
  type ChainPlan = {
    parts: ChainPart[];
    typedLine: string;
    promptAtType: string;
  };
  const chainPlanRef = useRef<ChainPlan | null>(null);

  const advanceAutoQueueRef = useRef<() => void>(() => {});
  advanceAutoQueueRef.current = () => {
    const next = autoQueueRef.current.shift();
    if (!next) {
      setAutoCommand("");
      setAutoOutput("");
      setAutoPhase("idle");
      chainPlanRef.current = null;
      return;
    }
    const parts = next
      .split(/\s*&&\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
    let projectedCwd = cwd;
    const planParts: ChainPart[] = parts.map((p) => {
      const resolved = resolveSinglePart(p, projectedCwd);
      if (
        resolved.sideEffect !== "none" &&
        resolved.sideEffect !== "clear" &&
        resolved.sideEffect.kind === "cd"
      ) {
        projectedCwd = resolved.sideEffect.newCwd;
      }
      return { command: p, output: resolved.output, sideEffect: resolved.sideEffect };
    });
    chainPlanRef.current = {
      parts: planParts,
      typedLine: next,
      promptAtType: currentPrompt,
    };
    // Concatenate non-empty outputs so the typewriter streams them all under
    // the single typed-out command line. Outputs are joined by a blank line.
    const concatenated = planParts
      .map((p) => p.output)
      .filter((o) => o !== "")
      .join("\n");
    setAutoCommand(next);
    setAutoOutput(concatenated);
    setAutoPhase("typing-cmd");
  };

  const commitAndAdvanceRef = useRef<() => void>(() => {});
  commitAndAdvanceRef.current = () => {
    const plan = chainPlanRef.current;
    chainPlanRef.current = null;
    if (!plan) {
      advanceAutoQueueRef.current();
      return;
    }

    // Apply final side effects (cd) and append the chain entry. `clear` was
    // already applied when typing finished, so nothing to do for it here
    // beyond skipping its (empty) output.
    let nextCwd = cwd;
    const collectedOutputs: string[] = [];
    for (const part of plan.parts) {
      if (part.sideEffect === "clear") continue;
      if (part.output) collectedOutputs.push(part.output);
      if (part.sideEffect !== "none" && part.sideEffect.kind === "cd") {
        nextCwd = part.sideEffect.newCwd;
      }
    }

    const entry = {
      prompt: plan.promptAtType,
      command: plan.typedLine,
      output: collectedOutputs.join("\n"),
    };
    setHistory((prev) => [...prev, entry]);
    if (nextCwd !== cwd) setCwd(nextCwd);

    advanceAutoQueueRef.current();
  };

  // Compare typewriter's displayed text against the current autoCommand /
  // autoOutput so we don't get spurious "done=true" carry-over when a new
  // command/output is set in the same React batch (the inner `useTypewriter`
  // effect has not yet reset `done` for the new text).
  useEffect(() => {
    if (autoPhase !== "typing-cmd") return;
    if (!autoCommand) return;
    if (cmdTyper.displayed !== autoCommand) return;
    // Apply `clear` *before* the output streams (real-shell ordering): if the
    // chain contains `clear`, wipe scrollback the moment the command line
    // finishes typing, then stream the post-clear output below.
    const plan = chainPlanRef.current;
    if (plan && plan.parts.some((p) => p.sideEffect === "clear")) {
      setHistory([]);
    }
    if (autoOutput) {
      setAutoPhase("typing-output");
    } else {
      commitAndAdvanceRef.current();
    }
  }, [autoPhase, cmdTyper.displayed, autoCommand, autoOutput]);

  useEffect(() => {
    if (autoPhase !== "typing-output") return;
    if (!autoOutput) return;
    if (outputTyper.displayed !== autoOutput) return;
    commitAndAdvanceRef.current();
  }, [autoPhase, outputTyper.displayed, autoOutput]);

  // Initial intro commands (default: just `cat welcome.md`). Fires exactly
  // once per Terminal instance after sessionStorage rehydration.
  const ranInitialRef = useRef(false);
  useEffect(() => {
    if (!storageReady) return;
    if (ranInitialRef.current) return;
    ranInitialRef.current = true;
    if (history.length > 0) return;
    const initial = initialAutoCommands && initialAutoCommands.length > 0
      ? initialAutoCommands
      : ["cat welcome.md"];
    autoQueueRef.current.push(...initial);
    advanceAutoQueueRef.current();
  }, [storageReady, history.length, initialAutoCommands]); // eslint-disable-line react-hooks/exhaustive-deps

  // React to clicks from left column
  useEffect(() => {
    if (!activeFile) return;
    const fileKey = activeFile.command;
    if (fileKey === prevFileRef.current) return;
    prevFileRef.current = fileKey;

    const fileName = fileKey.replace("cat ", "");
    setDynamicFiles((prev) => ({ ...prev, [fileName]: activeFile.content }));

    // Exit agent mode if active
    if (chatMode) {
      if (isStreaming) abortRef.current?.abort();
      setChatMode(false);
      setChatMessages([]);
      setHistory((prev) => [...prev, { prompt: "user> ", command: "", output: "Leaving agent mode." }]);
    }

    if (autoPhase !== "idle" && (autoCommand || autoOutput)) {
      setHistory((prev) => [...prev, { prompt: currentPrompt, command: autoCommand, output: autoOutput }]);
    }

    setAutoCommand(fileKey);
    setAutoOutput(activeFile.content);
    setAutoPhase("typing-cmd");
  }, [activeFile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Register URLs from activeFile
  useEffect(() => {
    if (!activeFile) return;
    const fileName = activeFile.command.replace("cat ", "");
    const urlMatch = activeFile.content.match(/^(https?:\/\/[^\s]+)$/m);
    if (urlMatch) setDynamicUrls((prev) => ({ ...prev, [fileName]: urlMatch[1] }));
  }, [activeFile]);

  // Externally-requested command chain (e.g. `clear && cat blogs.md && cd blog`
  // when navigating between /blog and /).
  const lastAutoTypeReqIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!autoTypeRequest) return;
    if (lastAutoTypeReqIdRef.current === autoTypeRequest.id) return;
    lastAutoTypeReqIdRef.current = autoTypeRequest.id;
    if (!storageReady) return;

    if (chatMode) {
      if (isStreaming) abortRef.current?.abort();
      setChatMode(false);
      setChatMessages([]);
      setHistory((prev) => [...prev, { prompt: "user> ", command: "", output: "Leaving agent mode." }]);
    }

    // Enqueue the chain. If the typer is mid-animation, append to the queue
    // so it will run after the in-progress entry finishes; otherwise kick off.
    autoQueueRef.current.push(...autoTypeRequest.commands);
    if (autoPhase === "idle") {
      advanceAutoQueueRef.current();
    }
  }, [autoTypeRequest, storageReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  });

  const isAutoTyping = autoPhase !== "idle";

  const focusInput = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) return;
    inputRef.current?.focus();
  };

  /* ── Container keydown: refocus input when typing with text selected ── */
  const handleContainerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (document.activeElement === inputRef.current) return;
    if (['Control', 'Alt', 'Shift', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(e.key)) return;

    // Allow native copy (Ctrl+C / Cmd+C) when text is selected
    if (e.key === 'c' && (e.ctrlKey || e.metaKey)) return;

    window.getSelection()?.removeAllRanges();
    inputRef.current?.focus();

    // For printable chars, manually insert since the input wasn't focused for this keystroke
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !isAutoTyping) {
      e.preventDefault();
      const pos = cursorPos;
      setInputValue(prev => prev.slice(0, pos) + e.key + prev.slice(pos));
      const newPos = pos + 1;
      setCursorPos(newPos);
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = newPos;
        }
      });
    }
  }, [cursorPos, isAutoTyping]);

  /* ── Shared markdown renderer with terminal styles ── */
  const mdStyles: MdStyles = useMemo(() => ({
    headingColor: theme.termText,
    textColor: theme.termText,
    dimColor: theme.termDim,
    isDark: theme.isDark,
  }), [theme]);

  const renderLine = useCallback((text: string) => {
    return renderMarkdown(text, mdStyles);
  }, [mdStyles]);

  return (
    <div
      className={`w-full h-full flex flex-col overflow-hidden transition-colors duration-300 ${borderless ? "" : "rounded-xl border"}`}
      style={{
        backgroundColor: theme.termBg,
        borderColor: theme.termBarBorder,
        outline: 'none',
        boxShadow: dark
          ? "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)"
          : "0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
      onClick={focusInput}
      onKeyDown={handleContainerKeyDown}
      tabIndex={-1}
    >
      {/* Title bar */}
      <div
        className={`flex items-center gap-2 px-4 ${borderless ? "py-3.5" : "py-2.5"} border-b select-none`}
        style={{ backgroundColor: theme.termBarBg, borderColor: theme.termBarBorder }}
      >
        {borderless ? (
          /* Mobile: labeled "Done" pill button */
          <button
            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
            className="px-3 py-1 rounded-full text-xs font-semibold active:scale-95 transition-transform"
            style={{ backgroundColor: theme.isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", color: theme.termText }}
            aria-label="Close terminal"
          >
            Done
          </button>
        ) : (
          /* Desktop: standard traffic lights */
          <div className="group flex gap-1.5">
            <button onClick={(e) => { e.stopPropagation(); onClose?.(); }} className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] flex items-center justify-center hover:brightness-110 transition" aria-label="Close">
              <svg className="w-[6px] h-[6px] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none" stroke="#4D0000" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" /></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onMinimize?.(); }} className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#DEA123] flex items-center justify-center hover:brightness-110 transition" aria-label="Minimize">
              <svg className="w-[6px] h-[6px] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none" stroke="#995700" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="6" x2="11" y2="6" /></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onExpand?.(); }} className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29] flex items-center justify-center hover:brightness-110 transition" aria-label="Fullscreen">
              <svg className="w-[6px] h-[6px] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none" stroke="#006500" strokeWidth="1.5">
                <polyline points="8,1 11,1 11,4" /><polyline points="4,11 1,11 1,8" />
              </svg>
            </button>
          </div>
        )}
        <span className={`${borderless ? "text-[13px]" : "text-[11px]"} ml-2 font-mono`} style={{ color: theme.termDim }}>
          {chatMode ? "gabe@keller.cv — agent" : `gabe@keller.cv ${cwd === "~" ? "~" : `~/${cwd}`}`}
        </span>
      </div>

      {/* Terminal body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-[13px]">
        {history.map((entry, i) => (
          <div key={i} className="mb-4">
            <div>
              <span className={entry.prompt === "user> " ? "text-blue-400 font-medium" : "text-green-500 font-medium"}>{entry.prompt}</span>
              <span style={{ color: theme.termText }}>{entry.command}</span>
            </div>
            {entry.output && <div className="mt-1">{renderLine(entry.output)}</div>}
          </div>
        ))}

        {isAutoTyping && (
          <div className="mb-4">
            <div>
              <span className="text-green-500 font-medium">{currentPrompt}</span>
              <span style={{ color: theme.termText }}>
                {autoPhase === "typing-cmd" ? cmdTyper.displayed : autoCommand}
              </span>
              {autoPhase === "typing-cmd" && <span className="animate-cursor" style={{ '--cursor-bg': theme.termText, '--cursor-fg': theme.termBg, '--cursor-text': theme.termText } as React.CSSProperties}>{"\u00A0"}</span>}
            </div>
            {autoPhase === "typing-output" && (
              <div className="mt-1">{renderLine(outputTyper.displayed)}</div>
            )}
          </div>
        )}

        {/* Streaming agent output */}
        {isStreaming && (
          <div className="mb-4">
            <div className="mt-1">
              {streamingOutput
                ? renderLine(streamingOutput)
                : <span style={{ color: theme.termDim }} className="animate-pulse">thinking...</span>
              }
            </div>
          </div>
        )}

        {/* Inline prompt + cursor (desktop only when not borderless) */}
        {!isAutoTyping && !borderless && (
          <div>
            <span className={chatMode ? "text-blue-400 font-medium" : "text-green-500 font-medium"}>{currentPrompt}</span>
            {isStreaming ? (
              <>
                <span style={{ color: theme.termText }}>{inputValue}</span>
                <span className="animate-cursor ml-0.5" style={{ '--cursor-bg': '#60a5fa', '--cursor-fg': theme.termBg, '--cursor-text': 'transparent' } as React.CSSProperties}>{"\u00A0"}</span>
              </>
            ) : (
              <>
                <span style={{ color: theme.termText }}>{inputValue.slice(0, cursorPos)}</span>
                <span
                  key={`${cursorPos}-${inputValue.length}`}
                  className="animate-cursor"
                  style={{ '--cursor-bg': theme.termText, '--cursor-fg': theme.termBg, '--cursor-text': theme.termText } as React.CSSProperties}
                >{(inputValue[cursorPos] == null || inputValue[cursorPos] === ' ') ? '\u00A0' : inputValue[cursorPos]}</span>
                <span style={{ color: theme.termText }}>{inputValue.slice(cursorPos + 1)}</span>
              </>
            )}
          </div>
        )}
      </div>

      {borderless ? (
        /* Mobile: visible sticky input bar */
        <div
          className="flex items-center gap-2 px-3 py-2 border-t font-mono text-[16px]"
          style={{ backgroundColor: theme.termBarBg, borderColor: theme.termBarBorder }}
        >
          <span className={`shrink-0 ${chatMode ? "text-blue-400" : "text-green-500"} font-medium`}>{currentPrompt}</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => { if (!isAutoTyping) { setInputValue(e.target.value); syncCursor(); } }}
            onKeyDown={handleKeyDown}
            onSelect={syncCursor}
            enterKeyHint="go"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 min-w-0 bg-transparent outline-none font-mono text-[16px]"
            style={{ color: theme.termText, caretColor: theme.termText }}
            aria-label="Terminal input"
          />
          <button
            onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
            disabled={isStreaming}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
            style={{ backgroundColor: theme.termText }}
            aria-label="Run command"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: theme.termBg }}>
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      ) : (
        /* Desktop: hidden input */
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => { if (!isAutoTyping) { setInputValue(e.target.value); syncCursor(); } }}
          onKeyDown={handleKeyDown}
          onSelect={syncCursor}
          className="sr-only"
          autoFocus
          aria-label="Terminal input"
        />
      )}
    </div>
  );
}
