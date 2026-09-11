"use dom";
// @ts-nocheck
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode } from "@lexical/rich-text";
import {
  ListNode,
  ListItemNode,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
} from "lexical";
import {
  $patchStyleText,
  $getSelectionStyleValueForProperty,
} from "@lexical/selection";

import { ScriptureNode, $createScriptureNode, $isScriptureNode } from "./nodes/ScriptureNode";
import { ComparisonNode, $createComparisonNode, $isComparisonNode } from "./nodes/ComparisonNode";
import {
  EditorEventsContext,
  ScriptureDataPayload,
  ComparisonDataPayload,
} from "./EditorEventsContext";
import "./FaithPadEditor.css";

export interface ActiveFormats {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isBulletList: boolean;
  isOrderedList: boolean;
  textColor?: string;
  highlightColor?: string;
}

// Selection Formatting Constants
const TEXT_COLORS_LIGHT = [
  { name: "Default", value: "inherit" },
  { name: "Red", value: "#C0392B" },
  { name: "Gold", value: "#B8860B" },
  { name: "Green", value: "#27AE60" },
  { name: "Blue", value: "#2980B9" },
];

const TEXT_COLORS_DARK = [
  { name: "Default", value: "inherit" },
  { name: "Red", value: "#EC7063" },
  { name: "Gold", value: "#D4AF37" },
  { name: "Green", value: "#58D68D" },
  { name: "Blue", value: "#5DADE2" },
];

const HIGHLIGHT_COLORS = [
  { name: "Clear", value: "transparent" },
  { name: "Gold", value: "rgba(212, 175, 55, 0.3)" },
  { name: "Green", value: "rgba(46, 204, 113, 0.3)" },
  { name: "Blue", value: "rgba(52, 152, 219, 0.3)" },
  { name: "Red", value: "rgba(231, 76, 60, 0.3)" },
];

// 1. Initial Content Loader Plugin
interface InitialContentPluginProps {
  content?: string;
}

function InitialContentPlugin({ content }: InitialContentPluginProps) {
  const [editor] = useLexicalComposerContext();
  const isInitialized = useRef(false);

  useLayoutEffect(() => {
    if (content && !isInitialized.current) {
      isInitialized.current = true;
      try {
        // Try parsing as Lexical State AST JSON
        // const parsedState = editor.parseEditorState(content);
        // editor.setEditorState(parsedState);
        queueMicrotask(() => {
          const editorState = editor.parseEditorState(content);
          editor.setEditorState(editorState);
        });
      } catch (e) {
        console.error(
          "Failed to parse initial content in Lexical, falling back to text:",
          e,
        );
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
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        },
        toggleItalic: () => {
          editor.focus();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
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
              $patchStyleText(selection, { "background-color": color });
            }
          });
        },
        insertScripture: (scripture: {
          bookUSFM: string;
          chapter: number;
          verseStart: number;
          verseEnd?: number;
          translation: any;
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
                scripture.verseText || "",
              );
              selection.insertNodes([node]);
            }
          });
        },
        insertComparison: (comparison: {
          bookUSFM: string;
          chapter: number;
          verseStart: number;
          verseEnd?: number;
          comparisons: { translation: string; text: string }[];
        }) => {
          editor.focus();
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const node = $createComparisonNode(
                comparison.bookUSFM,
                comparison.chapter,
                comparison.verseStart,
                comparison.verseEnd || comparison.verseStart,
                comparison.comparisons,
                true, // starts collapsed
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
        case "bold":
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
          break;
        case "italic":
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
          break;
        case "underline":
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
          break;
        case "strikethrough":
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
          break;
        case "bullet-list":
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          break;
        case "ordered-list":
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          break;
        case "text-color":
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $patchStyleText(selection, { color: command.value });
            }
          });
          break;
        case "highlight-color":
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $patchStyleText(selection, { "background-color": command.value });
            }
          });
          break;
        case "insert-scripture":
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
                command.value.verseText || "",
              );
              selection.insertNodes([node]);
            }
          });
          break;
        case "insert-comparison":
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const node = $createComparisonNode(
                command.value.bookUSFM,
                command.value.chapter,
                command.value.verseStart,
                command.value.verseEnd || command.value.verseStart,
                command.value.comparisons,
                true, // starts collapsed
              );
              selection.insertNodes([node]);
            }
          });
          break;
        case "update-scripture":
          editor.update(() => {
            const node = $getNodeByKey(command.value.nodeKey);
            if ($isScriptureNode(node)) {
              const isCollapsed = node.getIsCollapsed();
              const newNode = $createScriptureNode(
                command.value.bookUSFM,
                command.value.chapter,
                command.value.verseStart,
                command.value.verseEnd || command.value.verseStart,
                command.value.translation,
                isCollapsed,
                command.value.verseText || "",
              );
              node.replace(newNode);
            }
          });
          break;
        case "update-comparison":
          editor.update(() => {
            const node = $getNodeByKey(command.value.nodeKey);
            if ($isComparisonNode(node)) {
              const isCollapsed = node.getIsCollapsed();
              const newNode = $createComparisonNode(
                command.value.bookUSFM,
                command.value.chapter,
                command.value.verseStart,
                command.value.verseEnd || command.value.verseStart,
                command.value.comparisons,
                isCollapsed,
              );
              node.replace(newNode);
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

// 2.7. Selection & Format Tracker Plugin
interface FormatTrackerPluginProps {
  onFormatChange?: (formats: ActiveFormats) => void;
}

function FormatTrackerPlugin({ onFormatChange }: FormatTrackerPluginProps) {
  const [editor] = useLexicalComposerContext();

  const updateFormats = useCallback(() => {
    if (!onFormatChange) return;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const isBold = selection.hasFormat("bold");
        const isItalic = selection.hasFormat("italic");
        const isUnderline = selection.hasFormat("underline");
        const isStrikethrough = selection.hasFormat("strikethrough");

        let isBulletList = false;
        let isOrderedList = false;
        const anchorNode = selection.anchor.getNode();
        let parent: any = anchorNode;
        while (parent !== null) {
          if ($isListNode(parent)) {
            const listType = parent.getListType();
            if (listType === "bullet") {
              isBulletList = true;
            } else if (listType === "number") {
              isOrderedList = true;
            }
            break;
          }
          parent = parent.getParent();
        }

        const textColor = $getSelectionStyleValueForProperty(
          selection,
          "color",
          "",
        );
        const highlightColor = $getSelectionStyleValueForProperty(
          selection,
          "background-color",
          "",
        );

        onFormatChange({
          isBold,
          isItalic,
          isUnderline,
          isStrikethrough,
          isBulletList,
          isOrderedList,
          textColor,
          highlightColor,
        });
      } else {
        onFormatChange({
          isBold: false,
          isItalic: false,
          isUnderline: false,
          isStrikethrough: false,
          isBulletList: false,
          isOrderedList: false,
        });
      }
    });
  }, [editor, onFormatChange]);

  useEffect(() => {
    const handleSelectionChange = () => {
      updateFormats();
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [updateFormats]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      updateFormats();
    });
  }, [editor, updateFormats]);

  return null;
}

// 3. Floating Toolbar Plugin (rendered inside the webview)
interface FloatingToolbarPluginProps {
  theme: "light" | "dark";
}

function FloatingToolbarPlugin({ theme }: FloatingToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Palette states
  const [showTextPalette, setShowTextPalette] = useState(false);
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);

  const textColors = theme === "dark" ? TEXT_COLORS_DARK : TEXT_COLORS_LIGHT;

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
        const scrollLeft =
          window.scrollX || document.documentElement.scrollLeft;

        // Position toolbar centered, 54px above selection rect
        setCoords({
          top: rect.top + scrollTop - 58,
          left: rect.left + scrollLeft + rect.width / 2,
        });

        setIsBold(selection.hasFormat("bold"));
        setIsItalic(selection.hasFormat("italic"));
        setIsUnderline(selection.hasFormat("underline"));
        setIsStrikethrough(selection.hasFormat("strikethrough"));
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
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [updateToolbar]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      updateToolbar();
    });
  }, [editor, updateToolbar]);

  const toggleBold = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  };

  const toggleItalic = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  };

  const toggleUnderline = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
  };

  const toggleStrikethrough = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
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
        $patchStyleText(selection, { "background-color": color });
      }
    });
    setShowHighlightPalette(false);
  };

  if (!showToolbar) return null;

  return (
    <div
      className="floating-toolbar visible"
      style={{
        position: "absolute",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggleBold}
        className={`tb-btn ${isBold ? "active" : ""}`}
        title="Bold"
      >
        <span style={{ fontWeight: "bold", fontSize: "15px" }}>B</span>
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggleItalic}
        className={`tb-btn ${isItalic ? "active" : ""}`}
        title="Italic"
      >
        <span
          style={{
            fontStyle: "italic",
            fontSize: "15px",
            fontFamily: "serif",
            fontWeight: "bold",
          }}
        >
          I
        </span>
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggleUnderline}
        className={`tb-btn ${isUnderline ? "active" : ""}`}
        title="Underline"
      >
        <span
          style={{
            textDecoration: "underline",
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          U
        </span>
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggleStrikethrough}
        className={`tb-btn ${isStrikethrough ? "active" : ""}`}
        title="Strikethrough"
      >
        <span
          style={{
            textDecoration: "line-through",
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          S
        </span>
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
          className={`tb-btn ${showTextPalette ? "active" : ""}`}
          title="Text Color"
        >
          <span
            style={{
              fontSize: "15px",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
          >
            A
          </span>
        </button>
        <div className={`tb-color-palette ${showTextPalette ? "visible" : ""}`}>
          {textColors.map((color) => (
            <div
              key={color.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => handleTextColor(e, color.value)}
              className="color-dot"
              style={{
                backgroundColor:
                  color.value === "inherit"
                    ? theme === "dark"
                      ? "#fff"
                      : "#000"
                    : color.value,
                boxShadow: "0 0 2px rgba(0,0,0,0.2)",
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
          className={`tb-btn ${showHighlightPalette ? "active" : ""}`}
          title="Highlight Color"
        >
          <span
            style={{
              fontSize: "14px",
              background: "rgba(212, 175, 55, 0.4)",
              padding: "2px 4px",
              borderRadius: "3px",
            }}
          >
            ✎
          </span>
        </button>
        <div
          className={`tb-color-palette ${showHighlightPalette ? "visible" : ""}`}
        >
          {HIGHLIGHT_COLORS.map((color) => (
            <div
              key={color.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => handleHighlightColor(e, color.value)}
              className="color-dot"
              style={{
                backgroundColor:
                  color.value === "transparent" ? "#fff" : color.value,
                backgroundImage:
                  color.value === "transparent"
                    ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                    : "none",
                backgroundSize:
                  color.value === "transparent" ? "6px 6px" : "auto",
                backgroundPosition:
                  color.value === "transparent"
                    ? "0 0, 0 3px, 3px -3px, -3px 0px"
                    : "auto",
                boxShadow: "0 0 2px rgba(0,0,0,0.2)",
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
  onFormatChange?: (formats: ActiveFormats) => void;
  onEditScripture?: (scripture: ScriptureDataPayload) => void;
  onEditComparison?: (comparison: ComparisonDataPayload) => void;
  theme?: "light" | "dark";
  registerApi?: (api: any) => void;
  command?: { id: string; type: string; value?: any } | null;
  dom?: any;
  style?: any;
}

export default function FaithPadEditorDom({
  initialContent,
  onChange,
  onFormatChange,
  onEditScripture,
  onEditComparison,
  theme = "light",
  registerApi,
  command,
}: FaithPadEditorDomProps) {
  // Config matching Lexical AST
  const initialConfig = {
    namespace: "FaithPadEditor",
    theme: {
      paragraph: "editor-paragraph",
      text: {
        bold: "editor-text-bold",
        italic: "editor-text-italic",
        underline: "editor-text-underline",
        strikethrough: "editor-text-strikethrough",
        underlineStrikethrough: "editor-text-underline-strikethrough",
      },
    },
    nodes: [ScriptureNode, ComparisonNode, HeadingNode, ListNode, ListItemNode],
    onError: (error: Error) => {
      console.error("[Lexical] Error:", error);
    },
  };

  const handleEditorChange = (editorState: any) => {
    if (onChange) {
      const stateJson = JSON.stringify(editorState.toJSON());
      onChange(stateJson);
    }
  };

  // Create local QueryClient instance inside the DOM component environment
  const [localQueryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={localQueryClient}>
      <div className={`editor-container theme-${theme}`}>
        <EditorEventsContext.Provider
          value={{ onEditScripture, onEditComparison }}
        >
          <LexicalComposer initialConfig={initialConfig}>
            <div className="flex-1">
              <RichTextPlugin
                contentEditable={<ContentEditable className="editor-input" />}
                placeholder={
                  <div className="editor-placeholder">
                    Type notes, or reference scriptures...
                  </div>
                }
                ErrorBoundary={({ children }: any) => <>{children}</>}
              />
            </div>
            <HistoryPlugin />
            <ListPlugin />
            <InitialContentPlugin content={initialContent} />
            {onChange && <OnChangePlugin onChange={handleEditorChange} />}
            <BridgePlugin registerApi={registerApi} />
            <CommandPlugin command={command} />
            <FormatTrackerPlugin onFormatChange={onFormatChange} />
            <FloatingToolbarPlugin theme={theme} />
          </LexicalComposer>
        </EditorEventsContext.Provider>
      </div>
    </QueryClientProvider>
  );
}
