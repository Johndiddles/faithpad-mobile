import React, { useState, useRef } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Entypo, Ionicons } from "@expo/vector-icons";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { useNotesStore, useAuthStore } from "../../../store";
import { EditorBlock, BlockType } from "../../../lib/types";
import { parseScriptureRef } from "../../../lib/bible";
import { useQueryClient } from "@tanstack/react-query";
import { fetchBiblePassage } from "../../../services/youversion";
// import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { BIBLE_METADATA } from "../../../lib/bible-metadata";
import {
  FaithPadEditor,
  FaithPadEditorRef,
} from "@/components/editor/FaithPadEditor";
import { BOOK_NAME_TO_USFM, EMPTY_LEXICAL_STATE } from "@/constants/bible";
import { useBibleVersionsQuery } from "@/queries/useBibleVersions";

function migrateBlocksToLexical(oldBlocks: EditorBlock[]): string {
  if (oldBlocks.length === 1 && oldBlocks[0].content.startsWith('{"root":')) {
    return oldBlocks[0].content;
  }

  const children: any[] = [];

  for (const block of oldBlocks) {
    if (block.type === "paragraph" || block.type === "header") {
      const type = block.type === "header" ? "heading" : "paragraph";
      const headingTag = block.type === "header" ? "h2" : undefined;
      children.push({
        type,
        ...(headingTag ? { tag: headingTag } : {}),
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: block.content,
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        version: 1,
      });
    } else if (block.type === "bullet-list" && block.items) {
      children.push({
        type: "list",
        listType: "bullet",
        tag: "ul",
        start: 1,
        children: block.items.map((item) => ({
          type: "listitem",
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: item,
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          version: 1,
        })),
        direction: "ltr",
        format: "",
        indent: 0,
        version: 1,
      });
    } else if (block.type === "scripture") {
      const match = parseScriptureRef(block.scriptureRef || block.content);
      const usfm = match ? BOOK_NAME_TO_USFM[match.book] || "JHN" : "JHN";
      const chapter = match ? match.chapter : 1;
      const verseStart = match ? match.verseStart : 1;
      const verseEnd = match ? match.verseEnd || match.verseStart : 1;

      children.push({
        type: "paragraph",
        children: [
          {
            type: "scripture",
            version: 1,
            bookUSFM: usfm,
            chapter,
            verseStart,
            verseEnd,
            translation: block.translation || "ESV",
            isCollapsed: block.isCollapsed ?? true,
            verseText: block.verseText || "",
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        version: 1,
      });
    } else if (block.type === "comparison" && block.comparisons) {
      const match = parseScriptureRef(block.scriptureRef || block.content);
      const usfm = match ? BOOK_NAME_TO_USFM[match.book] || "JHN" : "JHN";
      const chapter = match ? match.chapter : 1;
      const verseStart = match ? match.verseStart : 1;
      const verseEnd = match ? match.verseEnd || match.verseStart : 1;

      children.push({
        type: "paragraph",
        children: [
          {
            type: "comparison",
            version: 1,
            bookUSFM: usfm,
            chapter,
            verseStart,
            verseEnd,
            comparisons: block.comparisons,
            isCollapsed: block.isCollapsed ?? true,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        version: 1,
      });
    }
  }

  if (children.length === 0) {
    return EMPTY_LEXICAL_STATE;
  }

  const lexicalState = {
    root: {
      type: "root",
      version: 1,
      direction: "ltr",
      format: "",
      indent: 0,
      children,
    },
  };

  return JSON.stringify(lexicalState);
}

// Sharing Zod Validation Schema
// const shareSchema = z.object({
//   email: z.email({ error: "Please enter a valid email address" }),
//   permissionLevel: z.enum(["VIEW", "EDIT"]),
// });

export default function SingleNoteEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const noteId = params.id;

  const {
    notes,
    updateNote,
    noteShares,
    //  shareNote, removeShare
  } = useNotesStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const note = notes.find((n) => n.id === noteId);

  // Local state - declared before conditional return to satisfy hook rules
  const [blocks, setBlocks] = useState<EditorBlock[]>(note?.blocks || []);
  const [noteTitle, setNoteTitle] = useState(note?.title || "");
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing">("synced");

  // Debounce and sync refs
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTitleRef = useRef<string>(note?.title || "");
  const latestBlocksRef = useRef<EditorBlock[]>(note?.blocks || []);
  const isDirtyRef = useRef<boolean>(false);

  // Modals state
  // const [shareModalVisible, setShareModalVisible] = useState(false);
  const [manualBibleModalVisible, setManualBibleModalVisible] = useState(false);
  const [insertModalVisible, setInsertModalVisible] = useState(false);
  const [textColorModalVisible, setTextColorModalVisible] = useState(false);
  const [highlightColorModalVisible, setHighlightColorModalVisible] =
    useState(false);

  // Scripture Selection state
  const [bibleBook, setBibleBook] = useState("John");
  const [bibleChapter, setBibleChapter] = useState("3");
  const [bibleVerse, setBibleVerse] = useState("16");
  const [bibleVerseEnd, setBibleVerseEnd] = useState("16");
  const [bibleVersion, setBibleVersion] = useState<string>("ESV");
  const [comparisonVersion, setComparisonVersion] = useState<string>("AMP");
  const [isInsertingComparison, setIsInsertingComparison] = useState(false);

  // Theme & Lexical Editor State Refs
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";
  const editorRef = useRef<FaithPadEditorRef>(null);

  const textColors =
    theme === "dark"
      ? [
          { name: "Default", value: "inherit" },
          { name: "Red", value: "#EC7063" },
          { name: "Gold", value: "#D4AF37" },
          { name: "Green", value: "#58D68D" },
          { name: "Blue", value: "#5DADE2" },
        ]
      : [
          { name: "Default", value: "inherit" },
          { name: "Red", value: "#C0392B" },
          { name: "Gold", value: "#B8860B" },
          { name: "Green", value: "#27AE60" },
          { name: "Blue", value: "#2980B9" },
        ];

  const highlightColors = [
    { name: "Clear", value: "transparent" },
    { name: "Gold", value: "rgba(212, 175, 55, 0.3)" },
    { name: "Green", value: "rgba(46, 204, 113, 0.3)" },
    { name: "Blue", value: "rgba(52, 152, 219, 0.3)" },
    { name: "Red", value: "rgba(231, 76, 60, 0.3)" },
  ];
  const initialEditorContent = React.useMemo(() => {
    return migrateBlocksToLexical(note?.blocks || []);
  }, [note?.blocks]);

  // Sharing form
  // const {
  //   control: shareControl,
  //   handleSubmit: handleShareSubmit,
  //   formState: { errors: shareErrors },
  //   reset: resetShareForm,
  // } = useForm({
  //   defaultValues: { email: "", permissionLevel: "VIEW" as "VIEW" | "EDIT" },
  //   resolver: async (data) => {
  //     try {
  //       const values = shareSchema.parse(data);
  //       return { values, errors: {} };
  //     } catch (err: any) {
  //       const errors: any = {};
  //       if (err instanceof z.ZodError) {
  //         err.issues.forEach((e: any) => {
  //           errors[e.path.join(".")] = { message: e.message };
  //         });
  //       }
  //       return { values: {}, errors };
  //     }
  //   },
  // });

  const { data: versionsData } = useBibleVersionsQuery();

  // Set default bible version based on user preference or first item
  React.useEffect(() => {
    if (user?.globalDefaultTranslation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBibleVersion(user.globalDefaultTranslation);
    } else if (versionsData && versionsData.length > 0) {
      setBibleVersion(versionsData[0].abbreviation);
    }
  }, [user?.globalDefaultTranslation, versionsData]);

  React.useEffect(() => {
    if (versionsData && versionsData.length > 1) {
      const other = versionsData.find((v) => v.abbreviation !== bibleVersion);
      if (other) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setComparisonVersion(other.abbreviation);
      }
    }
  }, [versionsData, bibleVersion]);

  // Flush pending changes on unmount or noteId change
  React.useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      if (isDirtyRef.current && noteId) {
        updateNote(noteId, {
          title: latestTitleRef.current || null,
          blocks: latestBlocksRef.current,
        });
        isDirtyRef.current = false;
      }
    };
  }, [noteId, updateNote]);

  if (!note) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <AppText weight="bold" className="text-lg">
          Note not found
        </AppText>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          className="mt-4"
        />
      </SafeAreaView>
    );
  }

  // Check if we have edit rights (owner or shared with EDIT access)
  const isOwner = note.userId === user?.id;
  const sharedRecord = noteShares.find(
    (s) => s.noteId === note.id && s.sharedWithEmail === user?.email,
  );
  const isShared = !!sharedRecord;
  const canEdit =
    isOwner || (isShared && sharedRecord.permissionLevel === "EDIT");

  // Sync state changes back to store (debounced 2 seconds of inactivity)
  const scheduleDebouncedSync = (
    updatedBlocks: EditorBlock[],
    titleString: string,
  ) => {
    latestBlocksRef.current = updatedBlocks;
    latestTitleRef.current = titleString;
    isDirtyRef.current = true;
    setSyncStatus("syncing");

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(() => {
      if (isDirtyRef.current && note.id) {
        updateNote(note.id, {
          title: latestTitleRef.current || null,
          blocks: latestBlocksRef.current,
        });
        isDirtyRef.current = false;
        setTimeout(() => {
          setSyncStatus("synced");
        }, 300);
      }
      syncTimerRef.current = null;
    }, 2000);
  };

  const handleTitleChange = (text: string) => {
    setNoteTitle(text);
    scheduleDebouncedSync(blocks, text);
  };

  const handleEditorChange = (lexicalJson: string) => {
    if (!canEdit) return;
    const updated: EditorBlock[] = [
      {
        id: "lexical_content",
        type: "paragraph" as BlockType,
        content: lexicalJson,
      },
    ];
    setBlocks(updated);
    scheduleDebouncedSync(updated, noteTitle);
  };

  // Manual Scripture Insertion
  const handleInsertManualScripture = async () => {
    const startV = parseInt(bibleVerse, 10);
    const endV = parseInt(bibleVerseEnd, 10);
    const chap = parseInt(bibleChapter, 10);
    const chosenTranslation = bibleVersion;
    const usfm = BOOK_NAME_TO_USFM[bibleBook] || "JHN";

    setManualBibleModalVisible(false);

    const fetchSingle = async (trans: string) => {
      return queryClient.fetchQuery({
        queryKey: ["biblePassage", trans, usfm, chap, startV, endV],
        queryFn: () => fetchBiblePassage(trans, usfm, chap, startV, endV),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
      });
    };

    const executeFetch = async () => {
      try {
        if (isInsertingComparison) {
          // Comparison block inserts a responsive comparison block containing two translations
          const [result1, result2] = await Promise.all([
            fetchSingle(chosenTranslation),
            fetchSingle(comparisonVersion),
          ]);

          editorRef.current?.insertComparison({
            bookUSFM: usfm,
            chapter: chap,
            verseStart: startV,
            verseEnd: endV,
            comparisons: [
              { translation: chosenTranslation, text: result1.text },
              { translation: comparisonVersion, text: result2.text },
            ],
          });
        } else {
          // Collapsible card block
          const result = await fetchSingle(chosenTranslation);

          editorRef.current?.insertScripture({
            bookUSFM: usfm,
            chapter: chap,
            verseStart: startV,
            verseEnd: endV,
            translation: chosenTranslation,
            verseText: result.text,
          });
        }
      } catch (err: any) {
        console.error("Failed to insert scripture manually:", err);
        Alert.alert(
          "Scripture Fetch Failed",
          `Could not fetch the bible passage from YouVersion REST API. ${err?.message || ""}`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Retry",
              onPress: () => {
                executeFetch();
              },
            },
          ],
        );
      }
    };

    await executeFetch();
  };

  // Share handlers
  // const handleShareSubmitForm = (data: any) => {
  //   shareNote(note.id, data.email, data.permissionLevel);
  //   resetShareForm({ email: "", permissionLevel: "VIEW" });
  //   Alert.alert("Success", `Note shared successfully with ${data.email}`);
  // };

  // const handleRemoveShare = (shareId: string) => {
  //   removeShare(shareId);
  // };

  // const sharedUsers = noteShares.filter((s) => s.noteId === note.id);

  const versionOptions = versionsData
    ? versionsData.map((v) => ({
        label: `${v.abbreviation} - ${v.name}`,
        value: v.abbreviation,
      }))
    : [
        { label: "ESV", value: "ESV" },
        { label: "NIV", value: "NIV" },
        { label: "NLT", value: "NLT" },
        { label: "AMP", value: "AMP" },
        { label: "KJV", value: "KJV" },
      ];

  // Book Options
  const bookOptions = BIBLE_METADATA.map((meta) => ({
    label: meta.book,
    value: meta.book,
  }));

  // Selected book metadata
  const selectedBookMeta = BIBLE_METADATA.find((m) => m.book === bibleBook);
  const chapterCount = selectedBookMeta ? selectedBookMeta.chapters.length : 1;

  // Chapter options
  const chapterOptions = Array.from({ length: chapterCount }, (_, i) => ({
    label: `${i + 1}`,
    value: `${i + 1}`,
  }));

  // Verse count
  const currentChapterIdx = parseInt(bibleChapter, 10) - 1;
  const verseCount =
    selectedBookMeta && selectedBookMeta.chapters[currentChapterIdx]
      ? selectedBookMeta.chapters[currentChapterIdx]
      : 1;

  // Start Verse options
  const startVerseOptions = Array.from({ length: verseCount }, (_, i) => ({
    label: `${i + 1}`,
    value: `${i + 1}`,
  }));

  // End Verse options (starts at the start verse)
  const startVerseNum = parseInt(bibleVerse, 10);
  const endVerseOptions = Array.from(
    { length: verseCount - startVerseNum + 1 },
    (_, i) => {
      const v = startVerseNum + i;
      return {
        label: `${v}`,
        value: `${v}`,
      };
    },
  );

  const handleSelectBook = (book: string) => {
    setBibleBook(book);
    setBibleChapter("1");
    setBibleVerse("1");
    setBibleVerseEnd("1");
  };

  const handleSelectChapter = (chapter: string) => {
    setBibleChapter(chapter);
    setBibleVerse("1");
    setBibleVerseEnd("1");
  };

  const handleSelectVerse = (verse: string) => {
    setBibleVerse(verse);
    if (parseInt(verse, 10) > parseInt(bibleVerseEnd, 10)) {
      setBibleVerseEnd(verse);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "left", "right"]}
    >
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-border/10">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center p-2 active:opacity-60"
        >
          <Ionicons
            name="chevron-back"
            size={22}
            className="text-[#e4b022] dark:text-[#d4af37]"
            color={Platform.OS === "ios" ? "#e4b022" : "#d4af37"}
          />
          <AppText
            weight="medium"
            className="text-base text-[#e4b022] dark:text-[#d4af37]"
          >
            Notes
          </AppText>
        </Pressable>

        <View className="flex-row items-center gap-x-3.5">
          <View className="flex-row items-center">
            {syncStatus === "syncing" ? (
              <ActivityIndicator
                size="small"
                color="#e4b022"
                className="mr-1.5"
              />
            ) : (
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
            )}
            <AppText className="text-[10px] text-muted-foreground uppercase tracking-widest">
              {syncStatus === "syncing" ? "Syncing" : "Synced"}
            </AppText>
          </View>

          {/* {isOwner && (
            <Pressable
              onPress={() => setShareModalVisible(true)}
              className="p-2 bg-secondary/80 rounded-full active:opacity-60"
            >
              <Ionicons
                name="people-outline"
                size={18}
                className="text-[#e4b022] dark:text-[#d4af37]"
                color={Platform.OS === "ios" ? "#e4b022" : "#d4af37"}
              />
            </Pressable>
          )} */}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View className="flex-1 px-6 pt-4">
          <TextInput
            value={noteTitle}
            onChangeText={handleTitleChange}
            editable={canEdit}
            placeholder="Title"
            placeholderTextColor="hsl(var(--muted-foreground))"
            className="text-xl font-bold text-foreground mb-4 p-0"
          />

          <View className="flex-1">
            <FaithPadEditor
              ref={editorRef}
              initialContent={initialEditorContent}
              onChange={handleEditorChange}
              theme={theme}
            />
          </View>
        </View>

        {canEdit && (
          <View className="flex-row items-center px-4 py-2.5 bg-secondary/85 dark:bg-secondary/40 border-t border-border">
            {/* Docked Insert/Attachment Button on the Left */}
            <Pressable
              onPress={() => setInsertModalVisible(true)}
              className="p-1.5 pr-3 border-r border-border/80 active:opacity-60 justify-center items-center"
            >
              <Entypo
                name="attachment"
                size={16}
                color={theme === "dark" ? "#d4af37" : "#e4b022"}
              />
            </Pressable>

            {/* Scrollable Formatting Options on the Right */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: "center",
                paddingLeft: 12,
                paddingRight: 8,
                columnGap: 16,
              }}
            >
              {/* Bold */}
              <Pressable
                onPress={() => editorRef.current?.toggleBold()}
                className="w-8 h-8 justify-center items-center rounded active:bg-muted"
              >
                <AppText weight="bold" className="text-foreground text-lg">
                  B
                </AppText>
              </Pressable>

              {/* Italic */}
              <Pressable
                onPress={() => editorRef.current?.toggleItalic()}
                className="w-8 h-8 justify-center items-center rounded active:bg-muted"
              >
                <AppText
                  weight="medium"
                  style={{ fontStyle: "italic" }}
                  className="text-foreground text-lg"
                >
                  I
                </AppText>
              </Pressable>

              {/* Underline */}
              <Pressable
                onPress={() => editorRef.current?.toggleUnderline()}
                className="w-8 h-8 justify-center items-center rounded active:bg-muted"
              >
                <AppText
                  weight="medium"
                  style={{ textDecorationLine: "underline" }}
                  className="text-foreground text-lg"
                >
                  U
                </AppText>
              </Pressable>

              {/* Strikethrough */}
              <Pressable
                onPress={() => editorRef.current?.toggleStrikethrough()}
                className="w-8 h-8 justify-center items-center rounded active:bg-muted"
              >
                <AppText
                  weight="medium"
                  style={{ textDecorationLine: "line-through" }}
                  className="text-foreground text-lg"
                >
                  S
                </AppText>
              </Pressable>

              {/* Bullet List */}
              <Pressable
                onPress={() => editorRef.current?.toggleBulletList()}
                className="w-8 h-8 justify-center items-center rounded active:bg-muted"
              >
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={theme === "dark" ? "#e5e5ea" : "#2c2a29"}
                />
              </Pressable>

              {/* Ordered List */}
              <Pressable
                onPress={() => editorRef.current?.toggleOrderedList()}
                className="w-8 h-8 justify-center items-center rounded active:bg-muted"
              >
                <Ionicons
                  name="list-circle-outline"
                  size={21}
                  color={theme === "dark" ? "#e5e5ea" : "#2c2a29"}
                />
              </Pressable>

              {/* Text Color */}
              <Pressable
                onPress={() => setTextColorModalVisible(true)}
                className="w-8 h-8 justify-center items-center rounded active:bg-muted"
              >
                <View className="items-center justify-center">
                  <AppText
                    weight="bold"
                    className="text-foreground text-[15px] leading-none"
                  >
                    A
                  </AppText>
                  <View className="w-4 h-[3px] bg-[#e4b022] dark:bg-[#d4af37] rounded-sm mt-0.5" />
                </View>
              </Pressable>

              {/* Highlight Color */}
              <Pressable
                onPress={() => setHighlightColorModalVisible(true)}
                className="w-8 h-8 justify-center items-center rounded active:bg-muted"
              >
                <Ionicons
                  name="brush-outline"
                  size={18}
                  color={theme === "dark" ? "#d4af37" : "#e4b022"}
                />
              </Pressable>
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Insert Options Bottom Drawer Modal */}
      <Modal
        visible={insertModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInsertModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-3xl p-6 border-t border-border max-h-[85%] pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <AppText weight="bold" className="text-xl">
                Insert
              </AppText>
              <Pressable
                onPress={() => setInsertModalVisible(false)}
                className="p-1.5"
              >
                <Ionicons
                  name="close"
                  size={24}
                  className="text-foreground"
                  color={theme === "dark" ? "#ffffff" : "#000000"}
                />
              </Pressable>
            </View>

            <View className="space-y-3">
              {/* Option 1: Scripture */}
              <Pressable
                onPress={() => {
                  setInsertModalVisible(false);
                  setIsInsertingComparison(false);
                  setTimeout(() => {
                    setManualBibleModalVisible(true);
                  }, 100);
                }}
                className="flex-row items-center justify-between p-4 bg-secondary/30 dark:bg-secondary/15 rounded-xl border border-border/60 active:bg-secondary/50"
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="w-10 h-10 rounded-full bg-[#e4b022]/15 dark:bg-[#d4af37]/15 justify-center items-center mr-3.5">
                    <Ionicons
                      name="book-outline"
                      size={20}
                      className="text-[#e4b022] dark:text-[#d4af37]"
                      color={theme === "dark" ? "#d4af37" : "#e4b022"}
                    />
                  </View>
                  <View className="flex-1">
                    <AppText weight="bold" className="text-sm text-foreground">
                      Bible Scripture
                    </AppText>
                    <AppText className="text-[11px] text-muted-foreground mt-0.5">
                      Insert a verse or passage
                    </AppText>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={16}
                  className="text-muted-foreground"
                  color="gray"
                />
              </Pressable>

              {/* Option 2: Comparison */}
              <Pressable
                onPress={() => {
                  setInsertModalVisible(false);
                  setIsInsertingComparison(true);
                  setTimeout(() => {
                    setManualBibleModalVisible(true);
                  }, 100);
                }}
                className="flex-row items-center justify-between p-4 bg-secondary/30 dark:bg-secondary/15 rounded-xl border border-border/60 active:bg-secondary/50"
              >
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="w-10 h-10 rounded-full bg-[#e4b022]/15 dark:bg-[#d4af37]/15 justify-center items-center mr-3.5">
                    <Ionicons
                      name="git-compare-outline"
                      size={20}
                      className="text-[#e4b022] dark:text-[#d4af37]"
                      color={theme === "dark" ? "#d4af37" : "#e4b022"}
                    />
                  </View>
                  <View className="flex-1">
                    <AppText weight="bold" className="text-sm text-foreground">
                      Translation Comparison
                    </AppText>
                    <AppText className="text-[11px] text-muted-foreground mt-0.5">
                      Compare translations side-by-side
                    </AppText>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={16}
                  className="text-muted-foreground"
                  color="gray"
                />
              </Pressable>

              {/* Option 3: Photo & Media (Coming Soon) */}
              {/* <View className="flex-row items-center justify-between p-4 bg-secondary/10 dark:bg-secondary/5 rounded-xl border border-border/30 opacity-50">
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="w-10 h-10 rounded-full bg-muted justify-center items-center mr-3.5">
                    <Ionicons
                      name="image-outline"
                      size={20}
                      className="text-muted-foreground"
                      color="gray"
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <AppText
                        weight="bold"
                        className="text-sm text-foreground"
                      >
                        Photo & Media
                      </AppText>
                      <View className="ml-2 bg-muted px-1.5 py-0.5 rounded">
                        <AppText className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">
                          Soon
                        </AppText>
                      </View>
                    </View>
                    <AppText className="text-[11px] text-muted-foreground mt-0.5">
                      Insert images, illustrations, or audio recordings
                    </AppText>
                  </View>
                </View>
              </View> */}

              {/* Option 4: Document File (Coming Soon) */}
              {/* <View className="flex-row items-center justify-between p-4 bg-secondary/10 dark:bg-secondary/5 rounded-xl border border-border/30 opacity-50">
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="w-10 h-10 rounded-full bg-muted justify-center items-center mr-3.5">
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      className="text-muted-foreground"
                      color="gray"
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <AppText
                        weight="bold"
                        className="text-sm text-foreground"
                      >
                        Document File
                      </AppText>
                      <View className="ml-2 bg-muted px-1.5 py-0.5 rounded">
                        <AppText className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">
                          Soon
                        </AppText>
                      </View>
                    </View>
                    <AppText className="text-[11px] text-muted-foreground mt-0.5">
                      Attach external study guides, PDFs, or slides
                    </AppText>
                  </View>
                </View>
              </View> */}
            </View>
          </View>
        </View>
      </Modal>

      {/* Text Color Selection Drawer */}
      <Modal
        visible={textColorModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTextColorModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-3xl p-6 border-t border-border pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <AppText weight="bold" className="text-xl">
                Text Color
              </AppText>
              <Pressable
                onPress={() => setTextColorModalVisible(false)}
                className="p-1.5"
              >
                <Ionicons
                  name="close"
                  size={24}
                  className="text-foreground"
                  color={theme === "dark" ? "#ffffff" : "#000000"}
                />
              </Pressable>
            </View>

            <View className="flex-row justify-around items-center">
              {textColors.map((color) => (
                <Pressable
                  key={color.name}
                  onPress={() => {
                    editorRef.current?.setTextColor(color.value);
                    setTextColorModalVisible(false);
                  }}
                  className="items-center active:opacity-60"
                >
                  <View
                    className={`w-12 h-12 rounded-full justify-center items-center border border-border shadow-sm ${
                      color.value === "inherit" ? "bg-secondary/45" : ""
                    }`}
                    style={{
                      backgroundColor:
                        color.value === "inherit" ? "transparent" : color.value,
                    }}
                  >
                    {color.value === "inherit" && (
                      <AppText className="text-xs font-bold text-foreground">
                        Default
                      </AppText>
                    )}
                  </View>
                  <AppText className="text-xs text-muted-foreground mt-2 font-medium">
                    {color.name}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Highlight Color Selection Drawer */}
      <Modal
        visible={highlightColorModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHighlightColorModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-3xl p-6 border-t border-border pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <AppText weight="bold" className="text-xl">
                Highlight Color
              </AppText>
              <Pressable
                onPress={() => setHighlightColorModalVisible(false)}
                className="p-1.5"
              >
                <Ionicons
                  name="close"
                  size={24}
                  className="text-foreground"
                  color={theme === "dark" ? "#ffffff" : "#000000"}
                />
              </Pressable>
            </View>

            <View className="flex-row justify-around items-center">
              {highlightColors.map((color) => (
                <Pressable
                  key={color.name}
                  onPress={() => {
                    editorRef.current?.setHighlightColor(color.value);
                    setHighlightColorModalVisible(false);
                  }}
                  className="items-center active:opacity-60"
                >
                  <View
                    className={`w-12 h-12 rounded-full justify-center items-center border border-border shadow-sm overflow-hidden ${
                      color.value === "transparent" ? "bg-secondary/45" : ""
                    }`}
                    style={{
                      backgroundColor:
                        color.value === "transparent"
                          ? "transparent"
                          : color.value,
                    }}
                  >
                    {color.value === "transparent" && (
                      <View className="w-12 h-[2px] bg-destructive rotate-45" />
                    )}
                  </View>
                  <AppText className="text-xs text-muted-foreground mt-2 font-medium">
                    {color.name}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Sharing Panel Bottom Sheet Modal */}
      {/* <Modal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-3xl p-6 border-t border-border max-h-[85%]">
            <View className="flex-row justify-between items-center mb-6">
              <AppText weight="bold" className="text-xl">
                Share Note Settings
              </AppText>
              <Pressable
                onPress={() => setShareModalVisible(false)}
                className="p-1.5"
              >
                <Ionicons
                  name="close"
                  size={24}
                  className="text-foreground"
                  color="hsl(var(--foreground))"
                />
              </Pressable>
            </View>

            <AppText
              weight="semibold"
              className="text-sm text-muted-foreground uppercase tracking-widest mb-3"
            >
              Shared Collaborators
            </AppText>

            {sharedUsers.length === 0 ? (
              <AppText className="text-sm text-muted-foreground italic mb-6">
                This note is not shared with anyone yet.
              </AppText>
            ) : (
              <View className="bg-secondary/15 rounded-xl border border-border/80 p-3 mb-6">
                {sharedUsers.map((share) => (
                  <View
                    key={share.id}
                    className="flex-row justify-between items-center py-2.5 border-b border-border/40 last:border-b-0"
                  >
                    <View>
                      <AppText weight="medium" className="text-sm">
                        {share.sharedWithEmail}
                      </AppText>
                      <AppText className="text-[10px] text-muted-foreground font-semibold mt-0.5 tracking-wider">
                        PERMISSION: {share.permissionLevel}
                      </AppText>
                    </View>
                    <Pressable
                      onPress={() => handleRemoveShare(share.id)}
                      className="p-2 active:opacity-50"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        className="text-destructive"
                        color="red"
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <AppText
              weight="semibold"
              className="text-sm text-muted-foreground uppercase tracking-widest mb-3"
            >
              Add New Collaborator
            </AppText>

            <Controller
              control={shareControl}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="e.g. pastor@gracefellowship.org"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={shareErrors.email?.message}
                />
              )}
            />

            <View className="mb-4">
              <AppText weight="medium" className="text-sm mb-1.5">
                Permission Level
              </AppText>
              <Controller
                control={shareControl}
                name="permissionLevel"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row bg-secondary/50 rounded-xl p-1 border border-border">
                    <Pressable
                      onPress={() => onChange("VIEW")}
                      className={cn(
                        "flex-1 py-2.5 items-center rounded-lg",
                        value === "VIEW" && "bg-card shadow-sm",
                      )}
                    >
                      <AppText
                        weight={value === "VIEW" ? "bold" : "medium"}
                        className={
                          value === "VIEW"
                            ? "text-[#e4b022] dark:text-[#d4af37]"
                            : "text-muted-foreground"
                        }
                      >
                        View Only
                      </AppText>
                    </Pressable>
                    <Pressable
                      onPress={() => onChange("EDIT")}
                      className={cn(
                        "flex-1 py-2.5 items-center rounded-lg",
                        value === "EDIT" && "bg-card shadow-sm",
                      )}
                    >
                      <AppText
                        weight={value === "EDIT" ? "bold" : "medium"}
                        className={
                          value === "EDIT"
                            ? "text-[#e4b022] dark:text-[#d4af37]"
                            : "text-muted-foreground"
                        }
                      >
                        Can Edit
                      </AppText>
                    </Pressable>
                  </View>
                )}
              />
            </View>

            <Button
              title="Add Collaborator"
              variant="gold"
              onPress={handleShareSubmit(handleShareSubmitForm)}
              className="w-full py-3.5 mb-6"
            />
          </View>
        </View>
      </Modal> */}

      {/* Manual Bible Selection bottom drawer modal */}
      <Modal
        visible={manualBibleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setManualBibleModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-3xl p-6 border-t border-border max-h-[85%]">
            <View className="flex-row justify-between items-center mb-6">
              <AppText weight="bold" className="text-xl">
                {isInsertingComparison
                  ? "Insert Translation Comparison"
                  : "Insert Bible Card"}
              </AppText>
              <Pressable
                onPress={() => setManualBibleModalVisible(false)}
                className="p-1.5"
              >
                <Ionicons
                  name="close"
                  size={24}
                  className="text-foreground"
                  color="hsl(var(--foreground))"
                />
              </Pressable>
            </View>

            <ScrollView className="space-y-4">
              <Dropdown
                label="Book"
                value={bibleBook}
                options={bookOptions}
                onSelect={handleSelectBook}
                searchable
                searchPlaceholder="Search books..."
                placeholder="Select Book"
              />

              <Dropdown
                label="Chapter"
                value={bibleChapter}
                options={chapterOptions}
                onSelect={handleSelectChapter}
                placeholder="Select Chapter"
              />

              <View className="flex-row gap-x-4 mb-4">
                <View className="flex-1">
                  <Dropdown
                    label="Start Verse"
                    value={bibleVerse}
                    options={startVerseOptions}
                    onSelect={handleSelectVerse}
                    placeholder="Start"
                  />
                </View>

                <View className="flex-1">
                  <Dropdown
                    label="End Verse"
                    value={bibleVerseEnd}
                    options={endVerseOptions}
                    onSelect={setBibleVerseEnd}
                    placeholder="End"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Dropdown
                  label={isInsertingComparison ? "Base Translation" : "Version"}
                  value={bibleVersion}
                  options={versionOptions}
                  onSelect={setBibleVersion}
                  placeholder="Select Version"
                />
              </View>

              {isInsertingComparison && (
                <View className="mb-6">
                  <Dropdown
                    label="Compare With"
                    value={comparisonVersion}
                    options={versionOptions.filter(
                      (opt) => opt.value !== bibleVersion,
                    )}
                    onSelect={setComparisonVersion}
                    placeholder="Select Version to Compare"
                  />
                </View>
              )}

              <Button
                title={
                  isInsertingComparison
                    ? "Insert Side-by-Side Comparison"
                    : "Insert Scripture Card"
                }
                variant="gold"
                onPress={handleInsertManualScripture}
                className="w-full py-4 mt-2"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
