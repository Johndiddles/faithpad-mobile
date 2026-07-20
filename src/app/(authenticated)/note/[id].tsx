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
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotesStore, useAuthStore } from "../../../store";
import { EditorBlock, BlockType } from "../../../lib/types";
import { parseScriptureRef } from "../../../lib/bible";
import { useQueryClient } from "@tanstack/react-query";
import {
  fetchBiblePassage,
  useBibleVersionsQuery,
} from "../../../services/youversion";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { BIBLE_METADATA } from "../../../lib/bible-metadata";
import {
  FaithPadEditor,
  FaithPadEditorRef,
} from "@/components/editor/FaithPadEditor";

const BOOK_NAME_TO_USFM: Record<string, string> = {
  Genesis: "GEN",
  Exodus: "EXD",
  Leviticus: "LEV",
  Numbers: "NUM",
  Deuteronomy: "DEU",
  Joshua: "JOS",
  Judges: "JDG",
  Ruth: "RUT",
  "1 Samuel": "1SA",
  "2 Samuel": "2SA",
  "1 Kings": "1KI",
  "2 Kings": "2KI",
  "1 Chronicles": "1CH",
  "2 Chronicles": "2CH",
  Ezra: "EZR",
  Nehemiah: "NEH",
  Esther: "EST",
  Job: "JOB",
  Psalm: "PSA",
  Psalms: "PSA",
  Proverbs: "PRO",
  Ecclesiastes: "ECC",
  "Song of Solomon": "SNG",
  Isaiah: "ISA",
  Jeremiah: "JER",
  Lamentations: "LAM",
  Ezekiel: "EZK",
  Daniel: "DAN",
  Hosea: "HOS",
  Joel: "JOL",
  Amos: "AMO",
  Obadiah: "OBA",
  Jonah: "JON",
  Micah: "MIC",
  Nahum: "NAM",
  Habakkuk: "HAB",
  Zephaniah: "ZEP",
  Haggai: "HAG",
  Zechariah: "ZEC",
  Malachi: "MAL",
  Matthew: "MAT",
  Mark: "MRK",
  Luke: "LUK",
  John: "JHN",
  Acts: "ACT",
  Romans: "ROM",
  "1 Corinthians": "1CO",
  "2 Corinthians": "2CO",
  Galatians: "GAL",
  Ephesians: "EPH",
  Philippians: "PHP",
  Colossians: "COL",
  "1 Thessalonians": "1TH",
  "2 Thessalonians": "2TH",
  "1 Timothy": "1TI",
  "2 Timothy": "2TI",
  Titus: "TIT",
  Philemon: "PHM",
  Hebrews: "HEB",
  James: "JAS",
  "1 Peter": "1PE",
  "2 Peter": "2PE",
  "1 John": "1JN",
  "2 John": "2JN",
  "3 John": "3JN",
  Jude: "JUD",
  Revelation: "REV",
};

const EMPTY_LEXICAL_STATE = `{"root":{"children":[{"children":[],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}`;

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
const shareSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  permissionLevel: z.enum(["VIEW", "EDIT"]),
});

export default function SingleNoteEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const noteId = params.id;

  const { notes, updateNote, noteShares, shareNote, removeShare } =
    useNotesStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const note = notes.find((n) => n.id === noteId);

  // Local state - declared before conditional return to satisfy hook rules
  const [blocks, setBlocks] = useState<EditorBlock[]>(note?.blocks || []);
  const [noteTitle, setNoteTitle] = useState(note?.title || "");
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing">("synced");

  // Modals state
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [manualBibleModalVisible, setManualBibleModalVisible] = useState(false);

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
  const initialEditorContent = React.useMemo(() => {
    return migrateBlocksToLexical(note?.blocks || []);
  }, [note?.blocks]);

  // Sharing form
  const {
    control: shareControl,
    handleSubmit: handleShareSubmit,
    formState: { errors: shareErrors },
    reset: resetShareForm,
  } = useForm({
    defaultValues: { email: "", permissionLevel: "VIEW" as "VIEW" | "EDIT" },
    resolver: async (data) => {
      try {
        const values = shareSchema.parse(data);
        return { values, errors: {} };
      } catch (err: any) {
        const errors: any = {};
        if (err instanceof z.ZodError) {
          err.issues.forEach((e: any) => {
            errors[e.path.join(".")] = { message: e.message };
          });
        }
        return { values: {}, errors };
      }
    },
  });

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

  // Local state initialized above

  // Sync state changes back to store
  const syncToCloud = (updatedBlocks: EditorBlock[], titleString: string) => {
    setSyncStatus("syncing");
    updateNote(note.id, {
      title: titleString || null,
      blocks: updatedBlocks,
    });
    // Simulate cloud sync lag
    setTimeout(() => {
      setSyncStatus("synced");
    }, 600);
  };

  const handleTitleChange = (text: string) => {
    setNoteTitle(text);
    syncToCloud(blocks, text);
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
    syncToCloud(updated, noteTitle);
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
          // Comparison block inserts two version badges side-by-side
          const [result1, result2] = await Promise.all([
            fetchSingle(chosenTranslation),
            fetchSingle(comparisonVersion),
          ]);

          editorRef.current?.insertScripture({
            bookUSFM: usfm,
            chapter: chap,
            verseStart: startV,
            verseEnd: endV,
            translation: chosenTranslation,
            verseText: result1.text,
          });

          editorRef.current?.insertScripture({
            bookUSFM: usfm,
            chapter: chap,
            verseStart: startV,
            verseEnd: endV,
            translation: comparisonVersion,
            verseText: result2.text,
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
  const handleShareSubmitForm = (data: any) => {
    shareNote(note.id, data.email, data.permissionLevel);
    resetShareForm({ email: "", permissionLevel: "VIEW" });
    Alert.alert("Success", `Note shared successfully with ${data.email}`);
  };

  const handleRemoveShare = (shareId: string) => {
    removeShare(shareId);
  };

  const sharedUsers = noteShares.filter((s) => s.noteId === note.id);

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
    label: `Chapter ${i + 1}`,
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

          {isOwner && (
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
          )}
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
            className="text-2xl font-sans font-bold text-foreground mb-4 p-0"
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
          <View className="flex-row items-center justify-between px-4 py-3 bg-secondary/80 dark:bg-secondary/40 border-t border-border">
            <View className="flex-row gap-x-4">
              <Pressable
                onPress={() => editorRef.current?.toggleBold()}
                className="w-8 h-8 justify-center items-center rounded active:bg-muted"
              >
                <AppText weight="bold" className="text-foreground text-lg">
                  B
                </AppText>
              </Pressable>

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

              <Pressable
                onPress={() => {
                  setIsInsertingComparison(false);
                  setManualBibleModalVisible(true);
                }}
                className="flex-row items-center gap-x-1 p-1 bg-[#e4b022]/15 dark:bg-[#d4af37]/15 px-2.5 py-1 rounded-lg border border-[#e4b022]/20 active:opacity-80"
              >
                <Ionicons
                  name="book-outline"
                  size={14}
                  className="text-[#e4b022] dark:text-[#d4af37]"
                  color="gold"
                />
                <AppText
                  weight="semibold"
                  className="text-[11px] text-[#e4b022] dark:text-[#d4af37]"
                >
                  + Scripture
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => {
                  setIsInsertingComparison(true);
                  setManualBibleModalVisible(true);
                }}
                className="flex-row items-center gap-x-1 p-1 bg-[#e4b022]/15 dark:bg-[#d4af37]/15 px-2.5 py-1 rounded-lg border border-[#e4b022]/20 active:opacity-80"
              >
                <Ionicons
                  name="git-compare-outline"
                  size={14}
                  className="text-[#e4b022] dark:text-[#d4af37]"
                  color="gold"
                />
                <AppText
                  weight="semibold"
                  className="text-[11px] text-[#e4b022] dark:text-[#d4af37]"
                >
                  + Compare
                </AppText>
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Sharing Panel Bottom Sheet Modal */}
      <Modal
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
      </Modal>

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
