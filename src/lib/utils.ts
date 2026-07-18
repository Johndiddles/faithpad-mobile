import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Note } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPlainTextFromLexical(jsonString: string): string {
  try {
    const obj = JSON.parse(jsonString);
    const extractText = (node: any): string => {
      if (!node) return "";
      if (node.text) return node.text;
      if (node.children) {
        return node.children.map(extractText).join(" ");
      }
      return "";
    };
    return extractText(obj.root).replace(/\s+/g, " ").trim();
  } catch {
    return jsonString;
  }
}

// Helper to get preview snippet from note blocks
export function getNoteSnippet(note: Note): string {
  const textBlock = note.blocks.find(
    (b) => b.type === "paragraph" && b.content.trim() !== "",
  );
  if (textBlock) {
    const content = textBlock.content.startsWith('{"root":')
      ? getPlainTextFromLexical(textBlock.content)
      : textBlock.content;
    return content.length > 60 ? content.substring(0, 60) + "..." : content;
  }
  return "No additional text";
}

export function formatNoteDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const checkDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (checkDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (checkDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else if (today.getTime() - checkDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { weekday: "long" });
  } else {
    return date.toLocaleDateString([], {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    });
  }
}
