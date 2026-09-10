import React, { useImperativeHandle, useState, forwardRef } from "react";
import { View, StyleSheet } from "react-native";
import FaithPadEditorDom, { ActiveFormats } from "./FaithPadEditorDom";

import {
  ScriptureDataPayload,
  ComparisonDataPayload,
} from "./EditorEventsContext";

export type { ActiveFormats, ScriptureDataPayload, ComparisonDataPayload };

export interface FaithPadEditorRef {
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrikethrough: () => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  setTextColor: (color: string) => void;
  setHighlightColor: (color: string) => void;
  insertScripture: (scripture: {
    bookUSFM: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
    translation: any;
    verseText?: string;
  }) => void;
  insertComparison: (comparison: {
    bookUSFM: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
    comparisons: { translation: string; text: string }[];
  }) => void;
  updateScripture: (scripture: {
    nodeKey: string;
    bookUSFM: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
    translation: any;
    verseText?: string;
  }) => void;
  updateComparison: (comparison: {
    nodeKey: string;
    bookUSFM: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
    comparisons: { translation: string; text: string }[];
  }) => void;
}

export interface FaithPadEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onFormatChange?: (formats: ActiveFormats) => void;
  onEditScripture?: (scripture: ScriptureDataPayload) => void;
  onEditComparison?: (comparison: ComparisonDataPayload) => void;
  theme?: "light" | "dark";
}

export const FaithPadEditor = forwardRef<
  FaithPadEditorRef,
  FaithPadEditorProps
>(
  (
    {
      initialContent,
      onChange,
      onFormatChange,
      onEditScripture,
      onEditComparison,
      theme = "light",
    },
    ref,
  ) => {
    const [editorCommand, setEditorCommand] = useState<{
      id: string;
      type: string;
      value?: any;
    } | null>(null);

    useImperativeHandle(ref, () => ({
      toggleBold: () => {
        setEditorCommand({ id: Math.random().toString(), type: "bold" });
      },
      toggleItalic: () => {
        setEditorCommand({ id: Math.random().toString(), type: "italic" });
      },
      toggleUnderline: () => {
        setEditorCommand({ id: Math.random().toString(), type: "underline" });
      },
      toggleStrikethrough: () => {
        setEditorCommand({ id: Math.random().toString(), type: "strikethrough" });
      },
      toggleBulletList: () => {
        setEditorCommand({ id: Math.random().toString(), type: "bullet-list" });
      },
      toggleOrderedList: () => {
        setEditorCommand({ id: Math.random().toString(), type: "ordered-list" });
      },
      setTextColor: (color: string) => {
        setEditorCommand({
          id: Math.random().toString(),
          type: "text-color",
          value: color,
        });
      },
      setHighlightColor: (color: string) => {
        setEditorCommand({
          id: Math.random().toString(),
          type: "highlight-color",
          value: color,
        });
      },
      insertScripture: (scripture) => {
        setEditorCommand({
          id: Math.random().toString(),
          type: "insert-scripture",
          value: scripture,
        });
      },
      insertComparison: (comparison) => {
        setEditorCommand({
          id: Math.random().toString(),
          type: "insert-comparison",
          value: comparison,
        });
      },
      updateScripture: (scripture) => {
        setEditorCommand({
          id: Math.random().toString(),
          type: "update-scripture",
          value: scripture,
        });
      },
      updateComparison: (comparison) => {
        setEditorCommand({
          id: Math.random().toString(),
          type: "update-comparison",
          value: comparison,
        });
      },
    }));

    return (
      <View className="flex-1 w-full">
        <FaithPadEditorDom
          initialContent={initialContent}
          onChange={onChange}
          onFormatChange={onFormatChange}
          onEditScripture={onEditScripture}
          onEditComparison={onEditComparison}
          theme={theme}
          command={editorCommand}
          dom={{
            scrollEnabled: true,
            keyboardDisplayRequiresUserAction: false,
            opaque: false,
            containerStyle: {
              backgroundColor: "transparent",
            },
          }}
          style={styles.webview}
        />
      </View>
    );
  },
);

FaithPadEditor.displayName = "FaithPadEditor";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
