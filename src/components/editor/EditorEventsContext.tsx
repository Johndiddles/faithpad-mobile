import { createContext, useContext } from "react";

export interface ScriptureDataPayload {
  nodeKey: string;
  bookUSFM: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  translation: any;
  verseText?: string;
}

export interface ComparisonDataPayload {
  nodeKey: string;
  bookUSFM: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  comparisons: { translation: string; text: string }[];
}

export interface EditorEventsContextValue {
  onEditScripture?: (scripture: ScriptureDataPayload) => void;
  onEditComparison?: (comparison: ComparisonDataPayload) => void;
}

export const EditorEventsContext = createContext<EditorEventsContextValue>({});

export const useEditorEvents = () => useContext(EditorEventsContext);
