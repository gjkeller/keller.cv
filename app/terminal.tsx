"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Theme {
  termBg: string;
  termBarBg: string;
  termBarBorder: string;
  termText: string;
  termDim: string;
  isDark: boolean;
  [key: string]: unknown;
}

interface TerminalProps {
  activeFile: { command: string; content: string } | null;
  initialFiles?: Record<string, string>;
  initialUrls?: Record<string, string>;
  theme: Theme;
  onClose?: () => void;
  onMinimize?: () => void;
  onThemeChange?: (name: string) => void;
}

export const THEME_NAMES = ["light", "dark-blue", "dark-gray", "warm", "midnight"];

/* ── Virtual filesystem ── */
const FILES: Record<string, string> = {
  "welcome.md": `# Gabriel Keller

CS @ UT Austin
Building agent infrastructure at AgentOps

Currently:
  → Cofounder @ Agent Operations Lab
  → Campus Lead @ Cursor
  → SWE Intern @ GridMatrix
  → VP @ Texas ACM

Type 'help' for commands, or click something on the left.`,

  "about.md": `# About Me

I'm a CS student at UT Austin, currently reinventing agentic
infrastructure at Agent Operations Lab. I started coding at 12
with Minecraft plugins and have been hooked ever since.

I care about building tools that make developers more productive
and AI systems that actually work in production.`,

  ".secret": `
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣤⣤⣤⣤⣤⣶⣦⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣿⡿⠛⠉⠙⠛⠛⠛⠛⠻⢿⣿⣷⣤⡀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⠋⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⠈⢻⣿⣿⡄⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⣸⣿⡏⠀⠀⠀⣠⣶⣾⣿⣿⣿⠿⠿⠿⢿⣿⣿⣿⣄⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⣿⣿⠁⠀⠀⢰⣿⣿⣯⠁⠀⠀⠀⠀⠀⠀⠀⠈⠙⢿⣷⡄⠀
    ⠀⠀⣀⣤⣴⣶⣶⣿⡟⠀⠀⠀⢸⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣷⠀
    ⠀⢰⣿⡟⠋⠉⣹⣿⡇⠀⠀⠀⠘⣿⣿⣿⣿⣷⣦⣤⣤⣤⣶⣶⣶⣶⣿⣿⣿⠀
    ⠀⢸⣿⡇⠀⠀⣿⣿⡇⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠃⠀
    ⠀⣸⣿⡇⠀⠀⣿⣿⡇⠀⠀⠀⠀⠀⠉⠻⠿⣿⣿⣿⣿⡿⠿⠿⠛⢻⣿⡇⠀⠀
    ⠀⣿⣿⠁⠀⠀⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣧⠀⠀
    ⠀⣿⣿⠀⠀⠀⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⠀⠀
    ⠀⣿⣿⠀⠀⠀⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⠀⠀
    ⠀⢿⣿⡆⠀⠀⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡇⠀⠀
    ⠀⠸⣿⣧⡀⠀⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⠃⠀⠀
    ⠀⠀⠛⢿⣿⣿⣿⣿⣇⠀⠀⠀⠀⠀⣰⣿⣿⣷⣶⣶⣶⣶⠶⠀⢠⣿⣿⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⣿⣿⠀⠀⠀⠀⠀⣿⣿⡇⠀⣽⣿⡏⠁⠀⠀⢸⣿⡇⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⣿⣿⠀⠀⠀⠀⠀⣿⣿⡇⠀⢹⣿⡆⠀⠀⠀⣸⣿⠇⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⢿⣿⣦⣄⣀⣠⣴⣿⣿⠁⠀⠈⠻⣿⣿⣿⣿⡿⠏⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠈⠛⠻⠿⠿⠿⠿⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

You found it. Nice.

https://bit.ly/3Qv0kEf`,
};

// Map files to their "open" URLs
const FILE_URLS: Record<string, string> = {
  "welcome.md": "https://keller.cv",
  "about.md": "https://github.com/gjkeller",
};

const DIRECTORIES: Record<string, string[]> = {
  "~": ["welcome.md", "about.md", "projects/", "blog/"],
  "projects": [],
  "blog": [],
};

function buildFileSystem(activeFiles: Record<string, string>, activeUrls: Record<string, string>) {
  const fs = { ...FILES, ...activeFiles };
  const urls = { ...FILE_URLS, ...activeUrls };
  const dirs = { ...DIRECTORIES };
  const rootFiles: string[] = ["welcome.md", "about.md"];
  const projFiles: string[] = [];
  const blogFiles: string[] = [];
  for (const key of Object.keys(activeFiles)) {
    if (key.startsWith("projects/")) projFiles.push(key.replace("projects/", ""));
    else if (key.startsWith("blog/")) blogFiles.push(key.replace("blog/", ""));
    else rootFiles.push(key);
  }
  dirs["projects"] = projFiles;
  dirs["blog"] = blogFiles;
  dirs["~"] = [...rootFiles, ...(projFiles.length ? ["projects/"] : []), ...(blogFiles.length ? ["blog/"] : [])];
  return { fs, dirs, urls };
}

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

Files are populated as you click items on the left.
Try: ls, cat welcome.md, theme --list`;

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
  theme: "theme - change the color theme\n\nUsage:\n  theme --list       List available themes\n  theme --set <name> Set the active theme\n  theme --help       Show this help\n\nAvailable themes: light, dark-blue, dark-gray, warm, midnight",
};

/* ── Typewriter for auto-typed content ── */
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
export function Terminal({ activeFile, initialFiles = {}, initialUrls = {}, theme, onClose, onMinimize, onThemeChange }: TerminalProps) {
  const dark = theme.isDark;
  const [history, setHistory] = useState<{ prompt: string; command: string; output: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [dynamicFiles, setDynamicFiles] = useState<Record<string, string>>(initialFiles);
  const [dynamicUrls, setDynamicUrls] = useState<Record<string, string>>(initialUrls);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cwd, setCwd] = useState("~");

  // Command history for up/down arrows
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const savedInput = useRef("");

  // Auto-typing state for clicks from the left
  const [autoCommand, setAutoCommand] = useState("");
  const [autoOutput, setAutoOutput] = useState("");
  const [autoPhase, setAutoPhase] = useState<"idle" | "typing-cmd" | "typing-output">("idle");
  const prevFileRef = useRef<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cmdTyper = useTypewriter(autoPhase === "typing-cmd" ? autoCommand : "", 20);
  const outputTyper = useTypewriter(autoPhase === "typing-output" ? autoOutput : "", 6);

  const { fs, dirs, urls } = buildFileSystem(dynamicFiles, dynamicUrls);

  // Resolve a path relative to cwd
  const resolvePath = useCallback((path: string): string => {
    if (path === "~" || path === "") return "~";
    if (path === ".." || path === "../") return "~";
    if (path === "." || path === "./") return cwd;
    // Absolute-ish: starts with ~/ or is a known dir
    if (path.startsWith("~/")) return path.slice(2) || "~";
    // Relative to cwd
    if (cwd === "~") return path.replace(/\/$/, "");
    return `${cwd}/${path}`.replace(/\/$/, "");
  }, [cwd]);

  // Resolve a file path (for cat/open) relative to cwd
  const resolveFile = useCallback((path: string): string => {
    if (path.startsWith("~/")) return path.slice(2);
    if (path.startsWith("./")) path = path.slice(2);
    if (cwd === "~") return path;
    return `${cwd}/${path}`;
  }, [cwd]);

  // Get all completable tokens (files + dirs + commands)
  const getCompletions = useCallback((partial: string): string[] => {
    const parts = partial.split(/\s+/);
    const commands = ["help", "ls", "ll", "cat", "open", "cd", "pwd", "whoami", "clear", "man", "echo", "date", "theme"];

    // Completing the command itself
    if (parts.length <= 1) {
      return commands.filter((c) => c.startsWith(partial));
    }

    // Completing a file/dir argument
    const arg = parts[parts.length - 1];
    const currentDir = cwd === "~" ? "~" : cwd;
    const entries = dirs[currentDir] || [];

    // Also include files in fs that are in the current directory
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

  // Process a command
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
        if (entries.length === 0) return "(empty — click items on the left to populate)";
        return entries.join("  ");
      }
      case "cd": {
        if (!arg || arg === "~" || arg === "~/") {
          setCwd("~");
          return "";
        }
        if (arg === ".." || arg === "../") {
          setCwd("~");
          return "";
        }
        const target = resolvePath(arg);
        if (dirs[target] !== undefined) {
          setCwd(target);
          return "";
        }
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
        if (arg === "--list" || arg === "-l") return `Available themes:\n\n${THEME_NAMES.map((n) => `  ${n === theme.name ? "● " : "  "}${n}${n === theme.name ? " (active)" : ""}`).join("\n")}\n\nUsage: theme --set <name>`;
        if (arg.startsWith("--set ") || arg.startsWith("-s ")) {
          const themeName = arg.replace(/^--(set|s)\s+/, "").replace(/^-s\s+/, "").trim();
          if (!THEME_NAMES.includes(themeName)) return `theme: unknown theme '${themeName}'\n\nAvailable: ${THEME_NAMES.join(", ")}`;
          onThemeChange?.(themeName);
          return `Theme set to '${themeName}'`;
        }
        // Bare theme name without --set
        if (THEME_NAMES.includes(arg)) {
          onThemeChange?.(arg);
          return `Theme set to '${arg}'`;
        }
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
      default:
        return `command not found: ${base}\n\nType 'help' for available commands.`;
    }
  }, [fs, dirs, urls, cwd, resolvePath, resolveFile, onThemeChange, theme.name]);

  const currentPrompt = cwd === "~" ? "$ " : `${cwd} $ `;

  // Handle user typing Enter
  const handleSubmit = useCallback(() => {
    const cmd = inputValue.trim();
    const promptSnapshot = currentPrompt;
    setInputValue("");
    setHistoryIdx(-1);

    if (!cmd) return;

    setCmdHistory((prev) => [cmd, ...prev]);

    const output = runCommand(cmd);
    if (output === "__CLEAR__") {
      setHistory([]);
      return;
    }

    setHistory((prev) => [...prev, { prompt: promptSnapshot, command: cmd, output }]);
  }, [inputValue, runCommand, currentPrompt]);

  // Key handler for arrows + tab
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const isAutoTyping = autoPhase !== "idle";
    if (isAutoTyping) return;

    if (e.key === "Enter") {
      handleSubmit();
      return;
    }

    // Up arrow — previous command
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const newIdx = historyIdx + 1;
      if (newIdx >= cmdHistory.length) return;
      if (historyIdx === -1) savedInput.current = inputValue;
      setHistoryIdx(newIdx);
      setInputValue(cmdHistory[newIdx]);
      return;
    }

    // Down arrow — next command
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx <= 0) {
        setHistoryIdx(-1);
        setInputValue(savedInput.current);
        return;
      }
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      setInputValue(cmdHistory[newIdx]);
      return;
    }

    // Tab — autocomplete
    if (e.key === "Tab") {
      e.preventDefault();
      const completions = getCompletions(inputValue);
      if (completions.length === 1) {
        const parts = inputValue.split(/\s+/);
        if (parts.length <= 1) {
          setInputValue(completions[0] + " ");
        } else {
          parts[parts.length - 1] = completions[0];
          setInputValue(parts.join(" ") + (completions[0].endsWith("/") ? "" : " "));
        }
      } else if (completions.length > 1) {
        // Show possible completions
        setHistory((prev) => [...prev, { prompt: currentPrompt, command: inputValue, output: completions.join("  ") }]);
      }
      return;
    }
  }, [inputValue, cmdHistory, historyIdx, autoPhase, handleSubmit, getCompletions]);

  // Auto-type: command done → output
  useEffect(() => {
    if (autoPhase === "typing-cmd" && cmdTyper.done) setAutoPhase("typing-output");
  }, [autoPhase, cmdTyper.done]);

  // Auto-type: output done → push to history
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
    setAutoCommand("cat welcome.md");
    setAutoOutput(FILES["welcome.md"]);
    setAutoPhase("typing-cmd");
  }, []);

  // React to clicks from left column
  useEffect(() => {
    if (!activeFile) return;
    const fileKey = activeFile.command;
    if (fileKey === prevFileRef.current) return;
    prevFileRef.current = fileKey;

    // Register the file in our virtual FS
    const fileName = fileKey.replace("cat ", "");
    setDynamicFiles((prev) => ({ ...prev, [fileName]: activeFile.content }));

    // Flush current auto-type if running
    if (autoPhase !== "idle") {
      if (autoCommand || autoOutput) {
        setHistory((prev) => [...prev, { prompt: currentPrompt, command: autoCommand, output: autoOutput }]);
      }
    }

    setAutoCommand(fileKey);
    setAutoOutput(activeFile.content);
    setAutoPhase("typing-cmd");
  }, [activeFile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Register URLs from activeFile
  useEffect(() => {
    if (!activeFile) return;
    const fileName = activeFile.command.replace("cat ", "");
    // Extract URL from content (look for http line)
    const urlMatch = activeFile.content.match(/^(https?:\/\/[^\s]+)$/m);
    if (urlMatch) {
      setDynamicUrls((prev) => ({ ...prev, [fileName]: urlMatch[1] }));
    }
  }, [activeFile]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  });

  // Focus input when clicking terminal body
  const focusInput = () => inputRef.current?.focus();

  const linkify = useCallback((text: string) => {
    const urlRegex = /(https?:\/\/[^\s)]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, j) =>
      urlRegex.test(part) ? (
        <a key={j} href={part} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">{part}</a>
      ) : (<span key={j}>{part}</span>)
    );
  }, []);

  const renderLine = useCallback((text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) return <div key={i} className="font-semibold text-sm" style={{ color: theme.termText }}>{linkify(line.slice(2))}</div>;
      if (line.startsWith("## ")) return <div key={i} className="font-medium text-sm mt-3" style={{ color: theme.termText }}>{linkify(line.slice(3))}</div>;
      if (line.startsWith("**") && line.endsWith("**")) return <div key={i} className="font-medium text-[13px]" style={{ color: theme.termText }}>{linkify(line.slice(2, -2))}</div>;
      if (line.trimStart().startsWith("→")) return <div key={i} className="text-[13px]" style={{ color: theme.termDim }}>{linkify(line)}</div>;
      if (line.trimStart().startsWith("-") || line.trimStart().startsWith("•")) return <div key={i} className="text-[13px]" style={{ color: theme.termDim }}>{linkify(line)}</div>;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <div key={i} className="text-[13px] leading-relaxed" style={{ color: theme.termDim }}>{linkify(line)}</div>;
    });
  }, [linkify, theme]);

  const isAutoTyping = autoPhase !== "idle";

  return (
    <div
      className="w-full h-full flex flex-col rounded-xl border overflow-hidden transition-colors duration-300"
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
        className="flex items-center gap-2 px-4 py-2.5 border-b select-none"
        style={{ backgroundColor: theme.termBarBg, borderColor: theme.termBarBorder }}
      >
        <div className="group flex gap-1.5">
          {/* Close */}
          <button onClick={(e) => { e.stopPropagation(); onClose?.(); }} className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] flex items-center justify-center hover:brightness-110 transition" aria-label="Close">
            <svg className="w-[6px] h-[6px] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none" stroke="#4D0000" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" /></svg>
          </button>
          {/* Minimize */}
          <button onClick={(e) => { e.stopPropagation(); onMinimize?.(); }} className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#DEA123] flex items-center justify-center hover:brightness-110 transition" aria-label="Minimize">
            <svg className="w-[6px] h-[6px] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none" stroke="#995700" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="6" x2="11" y2="6" /></svg>
          </button>
          {/* Expand */}
          <button onClick={(e) => { e.stopPropagation(); setIsFullscreen(!isFullscreen); }} className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29] flex items-center justify-center hover:brightness-110 transition" aria-label="Fullscreen">
            <svg className="w-[6px] h-[6px] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none" stroke="#006500" strokeWidth="1.5">
              {/* Diagonal expand arrows */}
              <polyline points="8,1 11,1 11,4" /><polyline points="4,11 1,11 1,8" />
            </svg>
          </button>
        </div>
        <span className="text-[11px] ml-2 font-mono" style={{ color: theme.termDim }}>gabe@keller.cv {cwd === "~" ? "~" : `~/${cwd}`}</span>
      </div>

      {/* Terminal body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px]">
        {history.map((entry, i) => (
          <div key={i} className="mb-4">
            <div>
              <span className="text-green-500 font-medium">{entry.prompt}</span>
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
              {autoPhase === "typing-cmd" && <span className="inline-block w-[7px] h-[14px] align-middle animate-pulse" style={{ backgroundColor: theme.termText }} />}
            </div>
            {autoPhase === "typing-output" && (
              <div className="mt-1">{renderLine(outputTyper.displayed)}</div>
            )}
          </div>
        )}

        {!isAutoTyping && (
          <div>
            <span className="text-green-500 font-medium">{currentPrompt}</span>
            <span style={{ color: theme.termText }}>{inputValue}</span>
            <span className="inline-block w-[7px] h-[14px] align-middle animate-pulse" style={{ backgroundColor: theme.termText }} />
          </div>
        )}
      </div>

      {/* Hidden input for keyboard capture */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => { if (!isAutoTyping) setInputValue(e.target.value); }}
        onKeyDown={handleKeyDown}
        className="sr-only"
        autoFocus
        aria-label="Terminal input"
      />
    </div>
  );
}
