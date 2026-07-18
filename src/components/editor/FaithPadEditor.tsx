import React, { useImperativeHandle, useState, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import FaithPadEditorDom from './FaithPadEditorDom';

export interface FaithPadEditorRef {
  toggleBold: () => void;
  toggleItalic: () => void;
  setTextColor: (color: string) => void;
  setHighlightColor: (color: string) => void;
  insertScripture: (scripture: {
    bookUSFM: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
    translation: string;
    verseText?: string;
  }) => void;
}

export interface FaithPadEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  theme?: 'light' | 'dark';
}

export const FaithPadEditor = forwardRef<FaithPadEditorRef, FaithPadEditorProps>(
  ({ initialContent, onChange, theme = 'light' }, ref) => {
    const [editorCommand, setEditorCommand] = useState<{
      id: string;
      type: string;
      value?: any;
    } | null>(null);

    useImperativeHandle(ref, () => ({
      toggleBold: () => {
        setEditorCommand({ id: Math.random().toString(), type: 'bold' });
      },
      toggleItalic: () => {
        setEditorCommand({ id: Math.random().toString(), type: 'italic' });
      },
      setTextColor: (color: string) => {
        setEditorCommand({ id: Math.random().toString(), type: 'text-color', value: color });
      },
      setHighlightColor: (color: string) => {
        setEditorCommand({ id: Math.random().toString(), type: 'highlight-color', value: color });
      },
      insertScripture: (scripture) => {
        setEditorCommand({ id: Math.random().toString(), type: 'insert-scripture', value: scripture });
      },
    }));

    return (
      <View style={styles.container}>
        <FaithPadEditorDom
          initialContent={initialContent}
          onChange={onChange}
          theme={theme}
          command={editorCommand}
          dom={{
            scrollEnabled: false,
            keyboardDisplayRequiresUserAction: false,
          }}
          style={styles.webview}
        />
      </View>
    );
  }
);

FaithPadEditor.displayName = 'FaithPadEditor';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
