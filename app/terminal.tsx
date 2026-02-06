"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TerminalProps {
  activeFile: { command: string; content: string } | null;
}

function useTypewriter(text: string, speed: number = 12) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;

    let i = 0;
    const interval = setInterval(() => {
      // Type in chunks for speed
      const chunk = Math.min(3, text.length - i);
      setDisplayed(text.slice(0, i + chunk));
      i += chunk;
      if (i >= text.length) {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
}

const WELCOME_LINES = `# Gabriel Keller

CS @ UT Austin
Building agent infrastructure at AgentOps

Currently:
  → Cofounder @ Agent Operations Lab
  → Campus Lead @ Cursor
  → SWE Intern @ GridMatrix
  → VP @ Texas ACM

Click something on the left to learn more.`;

export function Terminal({ activeFile }: TerminalProps) {
  const [history, setHistory] = useState<{ command: string; output: string }[]>([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [currentOutput, setCurrentOutput] = useState("");
  const [phase, setPhase] = useState<"idle" | "typing-cmd" | "typing-output">("idle");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevFileRef = useRef<string | null>(null);

  // Type the command
  const cmdTyper = useTypewriter(
    phase === "typing-cmd" ? currentCommand : "",
    25
  );

  // Type the output
  const outputTyper = useTypewriter(
    phase === "typing-output" ? currentOutput : "",
    6
  );

  // When command typing finishes, switch to output
  useEffect(() => {
    if (phase === "typing-cmd" && cmdTyper.done) {
      setPhase("typing-output");
    }
  }, [phase, cmdTyper.done]);

  // When output typing finishes, push to history
  useEffect(() => {
    if (phase === "typing-output" && outputTyper.done) {
      setHistory((prev) => [...prev, { command: currentCommand, output: currentOutput }]);
      setCurrentCommand("");
      setCurrentOutput("");
      setPhase("idle");
    }
  }, [phase, outputTyper.done, currentCommand, currentOutput]);

  // Initial welcome
  useEffect(() => {
    setCurrentCommand("cat welcome.md");
    setCurrentOutput(WELCOME_LINES);
    setPhase("typing-cmd");
  }, []);

  // React to file changes
  useEffect(() => {
    if (!activeFile) return;
    const fileKey = activeFile.command;
    if (fileKey === prevFileRef.current) return;
    prevFileRef.current = fileKey;

    // If currently typing, flush to history immediately
    if (phase !== "idle") {
      if (currentCommand || currentOutput) {
        setHistory((prev) => [...prev, { command: currentCommand, output: currentOutput }]);
      }
    }

    setCurrentCommand(activeFile.command);
    setCurrentOutput(activeFile.content);
    setPhase("typing-cmd");
  }, [activeFile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  const renderLine = useCallback((text: string) => {
    return text.split("\n").map((line, i) => {
      // Markdown-style heading
      if (line.startsWith("# ")) {
        return <div key={i} className="text-gray-900 font-semibold text-sm">{line.slice(2)}</div>;
      }
      if (line.startsWith("## ")) {
        return <div key={i} className="text-gray-800 font-medium text-sm mt-3">{line.slice(3)}</div>;
      }
      // Arrow items
      if (line.trimStart().startsWith("→")) {
        return <div key={i} className="text-gray-600 text-[13px]">{line}</div>;
      }
      // Bullet items
      if (line.trimStart().startsWith("-") || line.trimStart().startsWith("•")) {
        return <div key={i} className="text-gray-600 text-[13px]">{line}</div>;
      }
      // Empty line
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }
      return <div key={i} className="text-gray-600 text-[13px] leading-relaxed">{line}</div>;
    });
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA] rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F0F0F0] border-b border-gray-200">
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
            <div className="flex items-center gap-1.5">
              <span className="text-green-600 font-medium">$</span>
              <span className="text-gray-800">{entry.command}</span>
            </div>
            <div className="mt-1 pl-0">{renderLine(entry.output)}</div>
          </div>
        ))}

        {/* Currently typing */}
        {phase !== "idle" && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-green-600 font-medium">$</span>
              <span className="text-gray-800">
                {phase === "typing-cmd" ? cmdTyper.displayed : currentCommand}
                {phase === "typing-cmd" && <span className="inline-block w-[7px] h-[14px] bg-gray-800 ml-px animate-pulse" />}
              </span>
            </div>
            {phase === "typing-output" && (
              <div className="mt-1">{renderLine(outputTyper.displayed)}</div>
            )}
          </div>
        )}

        {/* Idle prompt */}
        {phase === "idle" && (
          <div className="flex items-center gap-1.5">
            <span className="text-green-600 font-medium">$</span>
            <span className="inline-block w-[7px] h-[14px] bg-gray-800 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
