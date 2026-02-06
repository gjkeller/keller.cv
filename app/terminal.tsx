"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TerminalProps {
  activeFile: { command: string; content: string } | null;
}

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

const DIRECTORIES: Record<string, string[]> = {
  "~": ["welcome.md", "about.md", "projects/", "blog/"],
  "projects": [],
  "blog": [],
};

function buildFileSystem(activeFiles: Record<string, string>) {
  const fs = { ...FILES, ...activeFiles };
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
  return { fs, dirs };
}

const HELP_TEXT = `Available commands:

  help          Show this help message
  ls [dir]      List files in directory
  ll [dir]      Alias for ls
  cat <file>    Read a file
  pwd           Print working directory
  whoami        Who am I?
  clear         Clear terminal
  man <cmd>     Manual for a command

Files are populated as you click items on the left.
Try: ls, cat welcome.md, cat about.md`;

const MAN_PAGES: Record<string, string> = {
  ls: "ls - list directory contents\n\nUsage: ls [directory]\n\nList files in the current or specified directory.",
  cat: "cat - concatenate and print files\n\nUsage: cat <filename>\n\nDisplay the contents of a file.",
  help: "help - display available commands\n\nUsage: help\n\nShows a list of all available shell commands.",
  pwd: "pwd - print working directory\n\nUsage: pwd\n\nPrint the full path of the current directory.",
  whoami: "whoami - display effective user id\n\nUsage: whoami\n\nPrint the user name associated with the current session.",
  clear: "clear - clear the terminal screen\n\nUsage: clear\n\nRemoves all previous output from the terminal.",
  man: "man - format and display manual pages\n\nUsage: man <command>\n\nDisplay the manual page for the specified command.",
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
export function Terminal({ activeFile }: TerminalProps) {
  const [history, setHistory] = useState<{ command: string; output: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [dynamicFiles, setDynamicFiles] = useState<Record<string, string>>({});

  // Auto-typing state for clicks from the left
  const [autoCommand, setAutoCommand] = useState("");
  const [autoOutput, setAutoOutput] = useState("");
  const [autoPhase, setAutoPhase] = useState<"idle" | "typing-cmd" | "typing-output">("idle");
  const prevFileRef = useRef<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cmdTyper = useTypewriter(autoPhase === "typing-cmd" ? autoCommand : "", 20);
  const outputTyper = useTypewriter(autoPhase === "typing-output" ? autoOutput : "", 6);

  const { fs, dirs } = buildFileSystem(dynamicFiles);

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
        return "/Users/gabe/keller.cv";
      case "whoami":
        return "gabe";
      case "ll":
      case "ls": {
        const dir = arg || "~";
        const entries = dirs[dir] || dirs[dir.replace("/", "")];
        if (!entries) return `ls: ${dir}: No such file or directory`;
        if (entries.length === 0) return "(empty — click items on the left to populate)";
        return entries.join("  ");
      }
      case "cat": {
        if (!arg) return "usage: cat <filename>";
        const content = fs[arg] || fs[arg.replace(/^\.\//, "")];
        if (!content) return `cat: ${arg}: No such file or directory\n\nTry 'ls' to see available files.`;
        return content;
      }
      case "man": {
        if (!arg) return "What manual page do you want?\nTry: man ls, man cat, man help";
        const page = MAN_PAGES[arg.toLowerCase()];
        if (!page) return `No manual entry for ${arg}`;
        return page;
      }
      case "echo":
        return arg;
      case "date":
        return new Date().toString();
      case "cd":
        return "Nice try, but this is a single-page app.";
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
  }, [fs, dirs]);

  // Handle user typing Enter
  const handleSubmit = useCallback(() => {
    const cmd = inputValue.trim();
    setInputValue("");

    if (!cmd) return;

    const output = runCommand(cmd);
    if (output === "__CLEAR__") {
      setHistory([]);
      return;
    }

    setHistory((prev) => [...prev, { command: cmd, output }]);
  }, [inputValue, runCommand]);

  // Auto-type: command done → output
  useEffect(() => {
    if (autoPhase === "typing-cmd" && cmdTyper.done) setAutoPhase("typing-output");
  }, [autoPhase, cmdTyper.done]);

  // Auto-type: output done → push to history
  useEffect(() => {
    if (autoPhase === "typing-output" && outputTyper.done) {
      setHistory((prev) => [...prev, { command: autoCommand, output: autoOutput }]);
      setAutoCommand("");
      setAutoOutput("");
      setAutoPhase("idle");
    }
  }, [autoPhase, outputTyper.done, autoCommand, autoOutput]);

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
        setHistory((prev) => [...prev, { command: autoCommand, output: autoOutput }]);
      }
    }

    setAutoCommand(fileKey);
    setAutoOutput(activeFile.content);
    setAutoPhase("typing-cmd");
  }, [activeFile]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <a
          key={j}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          {part}
        </a>
      ) : (
        <span key={j}>{part}</span>
      )
    );
  }, []);

  const renderLine = useCallback((text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) return <div key={i} className="text-gray-900 font-semibold text-sm">{linkify(line.slice(2))}</div>;
      if (line.startsWith("## ")) return <div key={i} className="text-gray-800 font-medium text-sm mt-3">{linkify(line.slice(3))}</div>;
      if (line.startsWith("**") && line.endsWith("**")) return <div key={i} className="text-gray-800 font-medium text-[13px]">{linkify(line.slice(2, -2))}</div>;
      if (line.trimStart().startsWith("→")) return <div key={i} className="text-gray-600 text-[13px]">{linkify(line)}</div>;
      if (line.trimStart().startsWith("-") || line.trimStart().startsWith("•")) return <div key={i} className="text-gray-600 text-[13px]">{linkify(line)}</div>;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <div key={i} className="text-gray-600 text-[13px] leading-relaxed">{linkify(line)}</div>;
    });
  }, [linkify]);

  const isAutoTyping = autoPhase !== "idle";

  return (
    <div className="w-full h-full flex flex-col bg-[#FAFAFA] rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] overflow-hidden" onClick={focusInput}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F0F0F0] border-b border-gray-200 select-none">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#DEA123]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]" />
        </div>
        <span className="text-[11px] text-gray-500 ml-2 font-mono">gabe@keller.cv ~ </span>
      </div>

      {/* Terminal body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px]">
        {/* History */}
        {history.map((entry, i) => (
          <div key={i} className="mb-4">
            <div>
              <span className="text-green-600 font-medium">$ </span>
              <span className="text-gray-800">{entry.command}</span>
            </div>
            {entry.output && <div className="mt-1">{renderLine(entry.output)}</div>}
          </div>
        ))}

        {/* Auto-typing in progress */}
        {isAutoTyping && (
          <div className="mb-4">
            <div>
              <span className="text-green-600 font-medium">$ </span>
              <span className="text-gray-800">
                {autoPhase === "typing-cmd" ? cmdTyper.displayed : autoCommand}
              </span>
              {autoPhase === "typing-cmd" && <span className="inline-block w-[7px] h-[14px] bg-gray-800 align-middle animate-pulse" />}
            </div>
            {autoPhase === "typing-output" && (
              <div className="mt-1">{renderLine(outputTyper.displayed)}</div>
            )}
          </div>
        )}

        {/* Interactive prompt (shown when not auto-typing) */}
        {!isAutoTyping && (
          <div>
            <span className="text-green-600 font-medium">$ </span>
            <span className="text-gray-800">{inputValue}</span>
            <span className="inline-block w-[7px] h-[14px] bg-gray-800 align-middle animate-pulse" />
          </div>
        )}
      </div>

      {/* Hidden input for keyboard capture */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => { if (!isAutoTyping) setInputValue(e.target.value); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isAutoTyping) handleSubmit();
        }}
        className="sr-only"
        autoFocus
        aria-label="Terminal input"
      />
    </div>
  );
}
