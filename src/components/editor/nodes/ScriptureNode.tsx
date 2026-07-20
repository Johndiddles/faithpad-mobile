import {
  DecoratorNode,
  NodeKey,
  SerializedLexicalNode,
  EditorConfig,
  LexicalNode,
  $getNodeByKey,
} from "lexical";
import React, { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useBiblePassageQuery } from "../../../services/youversion";

export const USFM_TO_BOOK_NAME: Record<string, string> = {
  GEN: "Genesis",
  EXD: "Exodus",
  LEV: "Leviticus",
  NUM: "Numbers",
  DEU: "Deuteronomy",
  JOS: "Joshua",
  JDG: "Judges",
  RUT: "Ruth",
  "1SA": "1 Samuel",
  "2SA": "2 Samuel",
  "1KI": "1 Kings",
  "2KI": "2 Kings",
  "1CH": "1 Chronicles",
  "2CH": "2 Chronicles",
  EZR: "Ezra",
  NEH: "Nehemiah",
  EST: "Esther",
  JOB: "Job",
  PSA: "Psalm",
  PRO: "Proverbs",
  ECC: "Ecclesiastes",
  SNG: "Song of Solomon",
  ISA: "Isaiah",
  JER: "Jeremiah",
  LAM: "Lamentations",
  EZK: "Ezekiel",
  DAN: "Daniel",
  HOS: "Hosea",
  JOL: "Joel",
  AMO: "Amos",
  OBA: "Obadiah",
  JON: "Jonah",
  MIC: "Micah",
  NAM: "Nahum",
  HAB: "Habakkuk",
  ZEP: "Zephaniah",
  HAG: "Haggai",
  ZEC: "Zechariah",
  MAL: "Malachi",
  MAT: "Matthew",
  MRK: "Mark",
  LUK: "Luke",
  JHN: "John",
  ACT: "Acts",
  ROM: "Romans",
  "1CO": "1 Corinthians",
  "2CO": "2 Corinthians",
  GAL: "Galatians",
  EPH: "Ephesians",
  PHP: "Philippians",
  COL: "Colossians",
  "1TH": "1 Thessalonians",
  "2TH": "2 Thessalonians",
  "1TI": "1 Timothy",
  "2TI": "2 Timothy",
  TIT: "Titus",
  PHM: "Philemon",
  HEB: "Hebrews",
  JAS: "James",
  "1PE": "1 Peter",
  "2PE": "2 Peter",
  "1JN": "1 John",
  "2JN": "2 John",
  "3JN": "3 John",
  JUD: "Jude",
  REV: "Revelation",
};

export interface SerializedScriptureNode extends SerializedLexicalNode {
  bookUSFM: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  translation: string;
  isCollapsed: boolean;
  verseText: string;
}

// @ts-ignore
const globalRef = (typeof window !== "undefined" ? window : global) as any;

class _ScriptureNode extends DecoratorNode<React.ReactNode> {
  __bookUSFM: string;
  __chapter: number;
  __verseStart: number;
  __verseEnd: number;
  __translation: string;
  __isCollapsed: boolean;
  __verseText: string;

  static getType(): string {
    return "scripture";
  }

  static clone(node: _ScriptureNode): _ScriptureNode {
    return new ScriptureNode(
      node.__bookUSFM,
      node.__chapter,
      node.__verseStart,
      node.__verseEnd,
      node.__translation,
      node.__isCollapsed,
      node.__verseText,
      node.__key,
    );
  }

  constructor(
    bookUSFM: string,
    chapter: number,
    verseStart: number,
    verseEnd: number,
    translation: string,
    isCollapsed: boolean,
    verseText: string = "",
    key?: NodeKey,
  ) {
    super(key);
    this.__bookUSFM = bookUSFM;
    this.__chapter = chapter;
    this.__verseStart = verseStart;
    this.__verseEnd = verseEnd;
    this.__translation = translation;
    this.__isCollapsed = isCollapsed;
    this.__verseText = verseText;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement("span");
    dom.style.display = "inline-block";
    dom.style.verticalAlign = "middle";
    return dom;
  }

  updateDOM(
    prevNode: _ScriptureNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedLexicalNode): _ScriptureNode {
    const node = serializedNode as SerializedScriptureNode;
    return $createScriptureNode(
      node.bookUSFM,
      node.chapter,
      node.verseStart,
      node.verseEnd,
      node.translation,
      node.isCollapsed,
      node.verseText,
    );
  }

  exportJSON(): SerializedScriptureNode {
    return {
      type: "scripture",
      version: 1,
      bookUSFM: this.__bookUSFM,
      chapter: this.__chapter,
      verseStart: this.__verseStart,
      verseEnd: this.__verseEnd,
      translation: this.__translation,
      isCollapsed: this.__isCollapsed,
      verseText: this.__verseText,
    };
  }

  // Getters & Setters
  getBookUSFM(): string {
    return this.__bookUSFM;
  }
  getChapter(): number {
    return this.__chapter;
  }
  getVerseStart(): number {
    return this.__verseStart;
  }
  getVerseEnd(): number {
    return this.__verseEnd;
  }
  getTranslation(): string {
    return this.__translation;
  }
  getIsCollapsed(): boolean {
    return this.__isCollapsed;
  }
  getVerseText(): string {
    return this.__verseText;
  }

  setIsCollapsed(isCollapsed: boolean): void {
    const writable = this.getWritable();
    writable.__isCollapsed = isCollapsed;
  }

  setVerseText(verseText: string): void {
    const writable = this.getWritable();
    writable.__verseText = verseText;
  }

  isInline(): boolean {
    return true;
  }

  decorate(editor: any, config: EditorConfig): React.ReactNode {
    return (
      <ScriptureBadge
        nodeKey={this.getKey()}
        bookUSFM={this.__bookUSFM}
        chapter={this.__chapter}
        verseStart={this.__verseStart}
        verseEnd={this.__verseEnd}
        translation={this.__translation}
        isCollapsed={this.__isCollapsed}
        verseText={this.__verseText}
      />
    );
  }
}

if (globalRef && !globalRef.__ScriptureNode) {
  globalRef.__ScriptureNode = _ScriptureNode;
}

export const ScriptureNode = globalRef?.__ScriptureNode || _ScriptureNode;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ScriptureNode = _ScriptureNode;

export function $createScriptureNode(
  bookUSFM: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
  translation: string,
  isCollapsed: boolean,
  verseText: string = "",
): _ScriptureNode {
  return new ScriptureNode(
    bookUSFM,
    chapter,
    verseStart,
    verseEnd,
    translation,
    isCollapsed,
    verseText,
  );
}

export function $isScriptureNode(
  node: LexicalNode | null | undefined,
): node is _ScriptureNode {
  return node instanceof ScriptureNode;
}

// React Badge & Card renderer component
interface ScriptureBadgeProps {
  nodeKey: string;
  bookUSFM: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  translation: string;
  isCollapsed: boolean;
  verseText: string;
}

function ScriptureBadge({
  nodeKey,
  bookUSFM,
  chapter,
  verseStart,
  verseEnd,
  translation,
  isCollapsed,
  verseText,
}: ScriptureBadgeProps) {
  const [editor] = useLexicalComposerContext();

  const bookName = USFM_TO_BOOK_NAME[bookUSFM.toUpperCase()] || bookUSFM;
  const refText =
    verseEnd && verseEnd > verseStart
      ? `${bookName} ${chapter}:${verseStart}-${verseEnd}`
      : `${bookName} ${chapter}:${verseStart}`;

  // Fetch scripture text using TanStack Query if not already loaded in the node
  const { data, isError, refetch, isFetching, isLoading } =
    useBiblePassageQuery(translation, bookUSFM, chapter, verseStart, verseEnd, {
      enabled: !verseText,
    });

  const text = verseText || data?.text || "";
  const loading = !verseText && (isLoading || isFetching);

  // When query loads the text successfully, write it back to the Lexical node
  useEffect(() => {
    if (data?.text && !verseText) {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isScriptureNode(node)) {
          node.setVerseText(data.text);
        }
      });
    }
  }, [data, verseText, editor, nodeKey]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isScriptureNode(node)) {
        node.setIsCollapsed(!node.getIsCollapsed());
      }
    });
  };

  return (
    <>
      {isCollapsed ? (
        <span
          contentEditable={false}
          className="scripture-badge-inline"
          onClick={handleToggle}
          title={`Click to expand ${refText}`}
        >
          <span className="scripture-icon-bible">📖</span>
          <span className="scripture-ref-label">
            {refText} ({translation})
          </span>
          <span className="scripture-icon-arrow">▾</span>
        </span>
      ) : (
        <span
          contentEditable={false}
          className="scripture-card-expanded"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="scripture-card-header">
            <span className="scripture-card-title">
              <span className="scripture-icon-bible">📖</span>
              <span>{refText}</span>
            </span>
            <button
              className="scripture-card-toggle"
              onClick={handleToggle}
              title="Click to collapse"
            >
              <span>Collapse</span>
              <span className="scripture-icon-arrow expanded">▾</span>
            </button>
          </span>
          <p className="scripture-card-text">
            {loading ? (
              <span style={{ opacity: 0.6 }}>Loading scripture...</span>
            ) : (
              text || "(No scripture text available)"
            )}
          </p>
          <span className="scripture-card-translation">{translation}</span>
        </span>
      )}

      {isError && !verseText && (
        <div
          className="scripture-toast-error"
          onClick={(e) => e.stopPropagation()}
        >
          <span>Failed to fetch scripture ({translation})</span>
          <button onClick={() => refetch()}>Retry</button>
        </div>
      )}
    </>
  );
}
