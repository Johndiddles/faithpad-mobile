import {
  DecoratorNode,
  NodeKey,
  SerializedLexicalNode,
  EditorConfig,
  LexicalNode,
  $getNodeByKey,
} from 'lexical';
import React, { useState, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export const USFM_TO_BOOK_NAME: Record<string, string> = {
  GEN: 'Genesis', EXD: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy',
  JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles',
  EZR: 'Ezra', NEH: 'Nehemiah', EST: 'Esther', JOB: 'Job', PSA: 'Psalm',
  PRO: 'Proverbs', ECC: 'Ecclesiastes', SNG: 'Song of Solomon', ISA: 'Isaiah',
  JER: 'Jeremiah', LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel',
  HOS: 'Hosea', JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah',
  MIC: 'Micah', NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah', HAG: 'Haggai',
  ZEC: 'Zechariah', MAL: 'Malachi', MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke',
  JHN: 'John', ACT: 'Acts', ROM: 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians',
  GAL: 'Galatians', EPH: 'Ephesians', PHP: 'Philippians', COL: 'Colossians',
  '1TH': '1 Thessalonians', '2TH': '2 Thessalonians', '1TI': '1 Timothy',
  '2TI': '2 Timothy', TIT: 'Titus', PHM: 'Philemon', HEB: 'Hebrews',
  JAS: 'James', '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John',
  '2JN': '2 John', '3JN': '3 John', JUD: 'Jude', REV: 'Revelation'
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

export class ScriptureNode extends DecoratorNode<React.ReactNode> {
  __bookUSFM: string;
  __chapter: number;
  __verseStart: number;
  __verseEnd: number;
  __translation: string;
  __isCollapsed: boolean;
  __verseText: string;

  static getType(): string {
    return 'scripture';
  }

  static clone(node: ScriptureNode): ScriptureNode {
    return new ScriptureNode(
      node.__bookUSFM,
      node.__chapter,
      node.__verseStart,
      node.__verseEnd,
      node.__translation,
      node.__isCollapsed,
      node.__verseText,
      node.__key
    );
  }

  constructor(
    bookUSFM: string,
    chapter: number,
    verseStart: number,
    verseEnd: number,
    translation: string,
    isCollapsed: boolean,
    verseText: string = '',
    key?: NodeKey
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
    const dom = document.createElement('span');
    dom.style.display = 'inline-block';
    dom.style.verticalAlign = 'middle';
    return dom;
  }

  updateDOM(prevNode: ScriptureNode, dom: HTMLElement, config: EditorConfig): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedLexicalNode): ScriptureNode {
    const node = serializedNode as SerializedScriptureNode;
    return $createScriptureNode(
      node.bookUSFM,
      node.chapter,
      node.verseStart,
      node.verseEnd,
      node.translation,
      node.isCollapsed,
      node.verseText
    );
  }

  exportJSON(): SerializedScriptureNode {
    return {
      type: 'scripture',
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

export function $createScriptureNode(
  bookUSFM: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
  translation: string,
  isCollapsed: boolean,
  verseText: string = ''
): ScriptureNode {
  return new ScriptureNode(
    bookUSFM,
    chapter,
    verseStart,
    verseEnd,
    translation,
    isCollapsed,
    verseText
  );
}

export function $isScriptureNode(
  node: LexicalNode | null | undefined
): node is ScriptureNode {
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
  const [fetchedText, setFetchedText] = useState('');
  const [loading, setLoading] = useState(!verseText);

  const bookName = USFM_TO_BOOK_NAME[bookUSFM.toUpperCase()] || bookUSFM;
  const refText =
    verseEnd && verseEnd > verseStart
      ? `${bookName} ${chapter}:${verseStart}-${verseEnd}`
      : `${bookName} ${chapter}:${verseStart}`;

  const text = verseText || fetchedText;

  // Fetch scripture text if not already loaded
  useEffect(() => {
    if (!verseText) {
      import('../../../lib/bible')
        .then(({ resolveStandardReference, fetchScripture }) => {
          const ref = resolveStandardReference(bookName, chapter, verseStart, verseEnd);
          return fetchScripture(ref, translation);
        })
        .then((data) => {
          if (data && data.text) {
            setFetchedText(data.text);
            editor.update(() => {
              const node = $getNodeByKey(nodeKey);
              if ($isScriptureNode(node)) {
                node.setVerseText(data.text);
              }
            });
          }
        })
        .catch((err) => {
          console.error('Failed to load scripture text inside node:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [verseText, bookName, chapter, verseStart, verseEnd, translation, editor, nodeKey]);

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

  if (isCollapsed) {
    return (
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
    );
  }

  return (
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
          text || '(No scripture text available)'
        )}
      </p>
      <span className="scripture-card-translation">{translation}</span>
    </span>
  );
}
