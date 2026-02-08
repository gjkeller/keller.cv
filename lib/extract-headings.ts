export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function extractHeadings(content: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const m2 = line.match(/^## (.+)$/);
    if (m2) {
      headings.push({ id: slugify(m2[1]), text: cleanText(m2[1]), level: 2 });
      continue;
    }
    const m3 = line.match(/^### (.+)$/);
    if (m3) {
      headings.push({ id: slugify(m3[1]), text: cleanText(m3[1]), level: 3 });
    }
  }
  return headings;
}

function slugify(text: string): string {
  return cleanText(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function cleanText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}
