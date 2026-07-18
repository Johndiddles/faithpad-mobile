"use dom";
// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import { $patchStyleText } from '@lexical/selection';

import { ScriptureNode, $createScriptureNode } from './nodes/ScriptureNode';
import './FaithPadEditor.css';

// Selection Formatting Constants
const TEXT_COLORS_LIGHT = [
  { name: 'Default', value: 'inherit' },
  { name: 'Red', value: '#C0392B' },
  { name: 'Gold', value: '#B8860B' },
  { name: 'Green', value: '#27AE60' },
  { name: 'Blue', value: '#2980B9' },
];

const TEXT_COLORS_DARK = [
  { name: 'Default', value: 'inherit' },
  { name: 'Red', value: '#EC7063' },
  { name: 'Gold', value: '#D4AF37' },
  { name: 'Green', value: '#58D68D' },
  { name: 'Blue', value: '#5DADE2' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Clear', value: 'transparent' },
  { name: 'Gold', value: 'rgba(212, 175, 55, 0.3)' },
  { name: 'Green', value: 'rgba(46, 204, 113, 0.3)' },
  { name: 'Blue', value: 'rgba(52, 152, 219, 0.3)' },
  { name: 'Red', value: 'rgba(231, 76, 60, 0.3)' },
];

// 1. Initial Content Loader Plugin
interface InitialContentPluginProps {
  content?: string;
}

function InitialContentPlugin({ content }: InitialContentPluginProps) {
  const [editor] = useLexicalComposerContext();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (content && !isInitialized.current) {
      isInitialized.current = true;
      try {
        // Try parsing as Lexical State AST JSON
        const parsedState = editor.parseEditorState(content);
        editor.setEditorState(parsedState);
      } catch (e) {
        console.error('Failed to parse initial content in Lexical, falling back to text:', e);
        // Fallback: Populate as a single paragraph if it is plain text
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(content));
          root.append(paragraph);
        });
      }
    }
  }, [editor, content]);

  return null;
}

// 2. Formatting Bridge Plugin
interface BridgePluginProps {
  registerApi?: (api: any) => void;
}

function BridgePlugin({ registerApi }: BridgePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (registerApi) {
      registerApi({
        toggleBold: () => {
          editor.focus();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        },
        toggleItalic: () => {
          editor.focus();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        },
        setTextColor: (color: string) => {
          editor.focus();
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $patchStyleText(selection, { color });
            }
          });
        },
        setHighlightColor: (color: string) => {
          editor.focus();
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $patchStyleText(selection, { 'background-color': color });
            }
          });
        },
        insertScripture: (scripture: {
          bookUSFM: string;
          chapter: number;
          verseStart: number;
          verseEnd?: number;
          translation: string;
          verseText?: string;
        }) => {
          editor.focus();
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const node = $createScriptureNode(
                scripture.bookUSFM,
                scripture.chapter,
                scripture.verseStart,
                scripture.verseEnd || scripture.verseStart,
                scripture.translation,
                true, // default collapsed badge
                scripture.verseText || ''
              );
              selection.insertNodes([node]);
            }
          });
        },
      });
    }
  }, [editor, registerApi]);

  return null;
}

// 2.5. Imperative Command Listener Plugin
interface CommandPluginProps {
  command?: { id: string; type: string; value?: any } | null;
}

function CommandPlugin({ command }: CommandPluginProps) {
  const [editor] = useLexicalComposerContext();
  const lastCommandId = useRef<string | null>(null);

  useEffect(() => {
    if (command && command.id !== lastCommandId.current) {
      lastCommandId.current = command.id;
      editor.focus();

      switch (command.type) {
        case 'bold':
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          break;
        case 'italic':
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          break;
        case 'text-color':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $patchStyleText(selection, { color: command.value });
            }
          });
          break;
        case 'highlight-color':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $patchStyleText(selection, { 'background-color': command.value });
            }
          });
          break;
        case 'insert-scripture':
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const node = $createScriptureNode(
                command.value.bookUSFM,
                command.value.chapter,
                command.value.verseStart,
                command.value.verseEnd || command.value.verseStart,
                command.value.translation,
                true, // starts collapsed
                command.value.verseText || ''
              );
              selection.insertNodes([node]);
            }
          });
          break;
        default:
          break;
      }
    }
  }, [editor, command]);

  return null;
}

// 3. Floating Toolbar Plugin (rendered inside the webview)
interface FloatingToolbarPluginProps {
  theme: 'light' | 'dark';
}

function FloatingToolbarPlugin({ theme }: FloatingToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  
  // Palette states
  const [showTextPalette, setShowTextPalette] = useState(false);
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);

  const textColors = theme === 'dark' ? TEXT_COLORS_DARK : TEXT_COLORS_LIGHT;

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const domSelection = window.getSelection();

      if (
        $isRangeSelection(selection) &&
        domSelection &&
        !selection.isCollapsed() &&
        domSelection.rangeCount > 0
      ) {
        const range = domSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

        // Position toolbar centered, 54px above selection rect
        setCoords({
          top: rect.top + scrollTop - 58,
          left: rect.left + scrollLeft + rect.width / 2,
        });

        setIsBold(selection.hasFormat('bold'));
        setIsItalic(selection.hasFormat('italic'));
        setShowToolbar(true);
      } else {
        setShowToolbar(false);
        setShowTextPalette(false);
        setShowHighlightPalette(false);
      }
    });
  }, [editor]);

  useEffect(() => {
    const handleSelectionChange = () => {
      updateToolbar();
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateToolbar]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      updateToolbar();
    });
  }, [editor, updateToolbar]);

  const toggleBold = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const toggleItalic = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const handleTextColor = (e: React.MouseEvent, color: string) => {
    e.preventDefault();
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { color });
      }
    });
    setShowTextPalette(false);
  };

  const handleHighlightColor = (e: React.MouseEvent, color: string) => {
    e.preventDefault();
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { 'background-color': color });
      }
    });
    setShowHighlightPalette(false);
  };

  if (!showToolbar) return null;

  return (
    <div
      className="floating-toolbar visible"
      style={{
        position: 'absolute',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggleBold}
        className={`tb-btn ${isBold ? 'active' : ''}`}
        title="Bold"
      >
        <span style={{ fontWeight: 'bold', fontSize: '15px' }}>B</span>
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggleItalic}
        className={`tb-btn ${isItalic ? 'active' : ''}`}
        title="Italic"
      >
        <span style={{ fontStyle: 'italic', fontSize: '15px', fontFamily: 'serif', fontWeight: 'bold' }}>I</span>
      </button>

      <div className="tb-divider" />

      {/* Text Color Dropdown */}
      <div className="tb-color-dropdown">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            setShowTextPalette(!showTextPalette);
            setShowHighlightPalette(false);
          }}
          className={`tb-btn ${showTextPalette ? 'active' : ''}`}
          title="Text Color"
        >
          <span style={{ fontSize: '15px', textDecoration: 'underline', fontWeight: 'bold' }}>A</span>
        </button>
        <div className={`tb-color-palette ${showTextPalette ? 'visible' : ''}`}>
          {textColors.map((color) => (
            <div
              key={color.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => handleTextColor(e, color.value)}
              className="color-dot"
              style={{
                backgroundColor: color.value === 'inherit' ? (theme === 'dark' ? '#fff' : '#000') : color.value,
                boxShadow: '0 0 2px rgba(0,0,0,0.2)',
              }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Highlight Color Dropdown */}
      <div className="tb-color-dropdown">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            setShowHighlightPalette(!showHighlightPalette);
            setShowTextPalette(false);
          }}
          className={`tb-btn ${showHighlightPalette ? 'active' : ''}`}
          title="Highlight Color"
        >
          <span style={{ fontSize: '14px', background: 'rgba(212, 175, 55, 0.4)', padding: '2px 4px', borderRadius: '3px' }}>✎</span>
        </button>
        <div className={`tb-color-palette ${showHighlightPalette ? 'visible' : ''}`}>
          {HIGHLIGHT_COLORS.map((color) => (
            <div
              key={color.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => handleHighlightColor(e, color.value)}
              className="color-dot"
              style={{
                backgroundColor: color.value === 'transparent' ? '#fff' : color.value,
                backgroundImage: color.value === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                backgroundSize: color.value === 'transparent' ? '6px 6px' : 'auto',
                backgroundPosition: color.value === 'transparent' ? '0 0, 0 3px, 3px -3px, -3px 0px' : 'auto',
                boxShadow: '0 0 2px rgba(0,0,0,0.2)',
              }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// 4. Main Editor Entry Point (Expo DOM Component)
interface FaithPadEditorDomProps {
  initialContent?: string;
  onChange?: (json: string) => void;
  theme?: 'light' | 'dark';
  registerApi?: (api: any) => void;
  command?: { id: string; type: string; value?: any } | null;
  dom?: any;
  style?: any;
}

export default function FaithPadEditorDom({
  initialContent,
  onChange,
  theme = 'light',
  registerApi,
  command,
}: FaithPadEditorDomProps) {
  // Config matching Lexical AST
  const initialConfig = {
    namespace: 'FaithPadEditor',
    theme: {
      paragraph: 'editor-paragraph',
      text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
      },
    },
    nodes: [ScriptureNode, HeadingNode, ListNode, ListItemNode],
    onError: (error: Error) => {
      console.error('[Lexical] Error:', error);
    },
  };

  const handleEditorChange = (editorState: any) => {
    if (onChange) {
      const stateJson = JSON.stringify(editorState.toJSON());
      onChange(stateJson);
    }
  };

  return (
    <div className={`editor-container theme-${theme}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-scroll">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={
              <div className="editor-placeholder">
                Type notes, or reference scriptures...
              </div>
            }
            ErrorBoundary={({ children }: any) => <>{children}</>}
          />
          <HistoryPlugin />
          <InitialContentPlugin content={initialContent} />
          {onChange && <OnChangePlugin onChange={handleEditorChange} />}
          <BridgePlugin registerApi={registerApi} />
          <CommandPlugin command={command} />
          <FloatingToolbarPlugin theme={theme} />
        </div>
      </LexicalComposer>
    </div>
  );
}
