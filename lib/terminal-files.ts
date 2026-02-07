import fs from "fs";
import path from "path";

const TERMINAL_DIR = path.join(process.cwd(), "content/terminal");

/**
 * Read all terminal files from content/terminal/ at build time.
 * Returns a map of filename -> content.
 */
export function getTerminalFiles(): Record<string, string> {
  const files: Record<string, string> = {};

  if (!fs.existsSync(TERMINAL_DIR)) return files;

  for (const name of fs.readdirSync(TERMINAL_DIR)) {
    const filePath = path.join(TERMINAL_DIR, name);
    if (fs.statSync(filePath).isFile()) {
      files[name] = fs.readFileSync(filePath, "utf-8").trimEnd();
    }
  }

  return files;
}

/** Map of filename -> URL for the `open` command */
export const FILE_URLS: Record<string, string> = {
  "welcome.md": "https://keller.cv",
  "about.md": "https://github.com/gjkeller",
};
