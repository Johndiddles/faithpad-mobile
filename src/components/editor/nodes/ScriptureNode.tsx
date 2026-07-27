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
import { formatScriptureRef } from "@/constants/bible";
import { useBiblePassageQuery } from "@/queries/useBiblePassage";

export interface SerializedScriptureNode extends SerializedLexicalNode {
  bookUSFM: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  translation: number;
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
  __translation: number;
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
    translation: number,
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
  getTranslation(): number {
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
  translation: number,
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
  translation: number;
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

  const refText = formatScriptureRef(bookUSFM, chapter, verseStart, verseEnd);

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
              {/* <span>Collapse</span> */}
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
