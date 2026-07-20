import {
  DecoratorNode,
  NodeKey,
  SerializedLexicalNode,
  EditorConfig,
  LexicalNode,
  $getNodeByKey,
} from "lexical";
import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { formatScriptureRef } from "@/constants/bible";

export interface SerializedComparisonNode extends SerializedLexicalNode {
  bookUSFM: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  comparisons: { translation: string; text: string }[];
  isCollapsed: boolean;
}

// @ts-ignore
const globalRef = (typeof window !== "undefined" ? window : global) as any;

class _ComparisonNode extends DecoratorNode<React.ReactNode> {
  __bookUSFM: string;
  __chapter: number;
  __verseStart: number;
  __verseEnd: number;
  __comparisons: { translation: string; text: string }[];
  __isCollapsed: boolean;

  static getType(): string {
    return "comparison";
  }

  static clone(node: _ComparisonNode): _ComparisonNode {
    return new ComparisonNode(
      node.__bookUSFM,
      node.__chapter,
      node.__verseStart,
      node.__verseEnd,
      node.__comparisons,
      node.__isCollapsed,
      node.__key,
    );
  }

  constructor(
    bookUSFM: string,
    chapter: number,
    verseStart: number,
    verseEnd: number,
    comparisons: { translation: string; text: string }[],
    isCollapsed: boolean,
    key?: NodeKey,
  ) {
    super(key);
    this.__bookUSFM = bookUSFM;
    this.__chapter = chapter;
    this.__verseStart = verseStart;
    this.__verseEnd = verseEnd;
    this.__comparisons = comparisons;
    this.__isCollapsed = isCollapsed;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement("span");
    dom.style.display = "inline-block";
    dom.style.verticalAlign = "middle";
    return dom;
  }

  updateDOM(
    prevNode: _ComparisonNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedLexicalNode): _ComparisonNode {
    const node = serializedNode as SerializedComparisonNode;
    return $createComparisonNode(
      node.bookUSFM,
      node.chapter,
      node.verseStart,
      node.verseEnd,
      node.comparisons,
      node.isCollapsed,
    );
  }

  exportJSON(): SerializedComparisonNode {
    return {
      type: "comparison",
      version: 1,
      bookUSFM: this.__bookUSFM,
      chapter: this.__chapter,
      verseStart: this.__verseStart,
      verseEnd: this.__verseEnd,
      comparisons: this.__comparisons,
      isCollapsed: this.__isCollapsed,
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
  getComparisons(): { translation: string; text: string }[] {
    return this.__comparisons;
  }
  getIsCollapsed(): boolean {
    return this.__isCollapsed;
  }

  setIsCollapsed(isCollapsed: boolean): void {
    const writable = this.getWritable();
    writable.__isCollapsed = isCollapsed;
  }

  setComparisons(comparisons: { translation: string; text: string }[]): void {
    const writable = this.getWritable();
    writable.__comparisons = comparisons;
  }

  isInline(): boolean {
    return true;
  }

  decorate(editor: any, config: EditorConfig): React.ReactNode {
    return (
      <ComparisonBadge
        nodeKey={this.getKey()}
        bookUSFM={this.__bookUSFM}
        chapter={this.__chapter}
        verseStart={this.__verseStart}
        verseEnd={this.__verseEnd}
        comparisons={this.__comparisons}
        isCollapsed={this.__isCollapsed}
      />
    );
  }
}

if (globalRef && !globalRef.__ComparisonNode) {
  globalRef.__ComparisonNode = _ComparisonNode;
}

export const ComparisonNode = globalRef?.__ComparisonNode || _ComparisonNode;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ComparisonNode = _ComparisonNode;

export function $createComparisonNode(
  bookUSFM: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
  comparisons: { translation: string; text: string }[],
  isCollapsed: boolean,
): _ComparisonNode {
  return new ComparisonNode(
    bookUSFM,
    chapter,
    verseStart,
    verseEnd,
    comparisons,
    isCollapsed,
  );
}

export function $isComparisonNode(
  node: LexicalNode | null | undefined,
): node is _ComparisonNode {
  return node instanceof ComparisonNode;
}

interface ComparisonBadgeProps {
  nodeKey: string;
  bookUSFM: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  comparisons: { translation: string; text: string }[];
  isCollapsed: boolean;
}

function ComparisonBadge({
  nodeKey,
  bookUSFM,
  chapter,
  verseStart,
  verseEnd,
  comparisons,
  isCollapsed,
}: ComparisonBadgeProps) {
  const [editor] = useLexicalComposerContext();

  const refText = formatScriptureRef(bookUSFM, chapter, verseStart, verseEnd);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isComparisonNode(node)) {
        node.setIsCollapsed(!node.getIsCollapsed());
      }
    });
  };

  const translationsLabel = comparisons.map((c) => c.translation).join(" / ");

  return (
    <>
      {isCollapsed ? (
        <span
          contentEditable={false}
          className="scripture-badge-inline"
          onClick={handleToggle}
          title={`Click to expand comparison ${refText}`}
        >
          <span className="scripture-icon-bible">📚</span>
          <span className="scripture-ref-label">
            {refText} ({translationsLabel})
          </span>
          <span className="scripture-icon-arrow">▾</span>
        </span>
      ) : (
        <span
          contentEditable={false}
          className="comparison-card-expanded"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="scripture-card-header">
            <span className="scripture-card-title">
              <span className="scripture-icon-bible">📚</span>
              <span>{refText} Comparison</span>
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
          <div className="comparison-grid">
            {comparisons.map((comp, idx) => (
              <div key={idx} className="comparison-item">
                <div className="comparison-item-header">
                  <span className="comparison-translation-badge">
                    {comp.translation}
                  </span>
                </div>
                <p className="scripture-card-text">
                  {'"'}
                  {comp.text}
                  {'"'}
                </p>
              </div>
            ))}
          </div>
        </span>
      )}
    </>
  );
}
