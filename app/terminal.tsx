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

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const syncCursor = useCallback(() => {
    const pos = inputRef.current?.selectionStart ?? 0;
    setCursorPos((prev) => (prev === pos ? prev : pos));
  }, []);

  const cmdTyper = useTypewriter(autoPhase === "typing-cmd" ? autoCommand : "", 20);
  const outputTyper = useTypewriter(autoPhase === "typing-output" ? autoOutput : "", 6);

  const { fs, dirs, urls } = buildFileSystem(staticFiles, dynamicFiles, dynamicUrls, initialUrls);

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
  }, [inputValue, cmdHistory, historyIdx, autoPhase, handleSubmit, getCompletions, currentPrompt, isStreaming, chatMode]);

  /* ── Auto-type lifecycle ── */
  useEffect(() => {
    if (autoPhase === "typing-cmd" && cmdTyper.done) setAutoPhase("typing-output");
  }, [autoPhase, cmdTyper.done]);

  useEffect(() => {
    if (autoPhase === "typing-output" && outputTyper.done) {
      setHistory((prev) => [...prev, { prompt: currentPrompt, command: autoCommand, output: autoOutput }]);
      setAutoCommand("");
      setAutoOutput("");
      setAutoPhase("idle");
    }
  }, [autoPhase, outputTyper.done, autoCommand, autoOutput, currentPrompt]);

  // Initial welcome
  useEffect(() => {
    const welcome = staticFiles["welcome.md"] || "Type 'help' for commands.";
    setAutoCommand("cat welcome.md");
    setAutoOutput(welcome);
    setAutoPhase("typing-cmd");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  });

  const focusInput = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) return;
    inputRef.current?.focus();
  };

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

  const isAutoTyping = autoPhase !== "idle";

  return (
    <div
      className={`w-full h-full flex flex-col overflow-hidden transition-colors duration-300 ${borderless ? "" : "rounded-xl border"}`}
      style={{
        backgroundColor: theme.termBg,
        borderColor: theme.termBarBorder,
        boxShadow: dark
          ? "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)"
          : "0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
      onClick={focusInput}
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
              {autoPhase === "typing-cmd" && <span className="inline-block min-w-[7px] h-[14px] align-middle animate-cursor font-mono text-[13px] leading-[14px]" style={{ backgroundColor: theme.termText, color: theme.termBg }}>{" "}</span>}
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
                <span className="inline-block min-w-[7px] h-[14px] align-middle animate-cursor ml-0.5 font-mono text-[13px] leading-[14px]" style={{ backgroundColor: "#60a5fa", color: theme.termBg }}>{" "}</span>
              </>
            ) : (
              <>
                <span style={{ color: theme.termText }}>{inputValue.slice(0, cursorPos)}</span>
                <span
                  key={`${cursorPos}-${inputValue.length}`}
                  className="inline-block min-w-[7px] h-[14px] align-middle animate-cursor font-mono text-[13px] leading-[14px]"
                  style={{ backgroundColor: theme.termText, color: theme.termBg }}
                >{inputValue[cursorPos] ?? " "}</span>
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
