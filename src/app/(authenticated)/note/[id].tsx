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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BibleCard, BibleComparison } from "@/components/ui/bible-card";
import { useNotesStore, useAuthStore } from "../../../store";
import { EditorBlock, BlockType } from "../../../lib/types";
import {
  parseScriptureRef,
  fetchScripture,
  resolveStandardReference,
} from "../../../lib/bible";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { BIBLE_METADATA } from "../../../lib/bible-metadata";

// Sharing Zod Validation Schema
const shareSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  permissionLevel: z.enum(["VIEW", "EDIT"]),
});

// Helper function to generate unique block IDs outside of render
const generateUniqueBlockId = (prefix: string = "b") => {
  return `${prefix}_${Math.random().toString(36).substring(7)}`;
};

export default function SingleNoteEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const noteId = params.id;

  const { notes, updateNote, noteShares, shareNote, removeShare } =
    useNotesStore();
  const { user } = useAuthStore();

  const note = notes.find((n) => n.id === noteId);

  // Local state - declared before conditional return to satisfy hook rules
  const [blocks, setBlocks] = useState<EditorBlock[]>(note?.blocks || []);
  const [noteTitle, setNoteTitle] = useState(note?.title || "");
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing">("synced");

  console.log(JSON.stringify(blocks, null, 2));

  // Modals state
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [manualBibleModalVisible, setManualBibleModalVisible] = useState(false);

  // Scripture Selection state
  const [bibleBook, setBibleBook] = useState("John");
  const [bibleChapter, setBibleChapter] = useState("3");
  const [bibleVerse, setBibleVerse] = useState("16");
  const [bibleVerseEnd, setBibleVerseEnd] = useState("16");
  const [bibleVersion, setBibleVersion] = useState<
    "ESV" | "NIV" | "NLT" | "AMP" | "KJV"
  >("ESV");
  const [comparisonVersion, setComparisonVersion] = useState<
    "ESV" | "NIV" | "NLT" | "AMP" | "KJV"
  >("AMP");
  const [isInsertingComparison, setIsInsertingComparison] = useState(false);

  // Dynamic refs for text input navigation
  const inputRefs = useRef<Record<string, any>>({});

  // Debounce ref for AI Smart Detection
  const parseDebounceTimeout = useRef<any>(null);

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

  // Block handlers
  const handleUpdateBlockText = (blockId: string, text: string) => {
    if (!canEdit) return;

    const updated = blocks.map((b) =>
      b.id === blockId ? { ...b, content: text } : b,
    );
    setBlocks(updated);
    syncToCloud(updated, noteTitle);

    // Trigger AI Smart Detection if active
    if (user?.aiDetectionEnabled) {
      triggerAIScriptureDetection(blockId, text);
    }
  };

  const handleUpdateListItem = (
    blockId: string,
    itemIdx: number,
    text: string,
  ) => {
    if (!canEdit) return;

    const updated = blocks.map((b) => {
      if (b.id === blockId && b.items) {
        const newItems = [...b.items];
        newItems[itemIdx] = text;
        return { ...b, items: newItems };
      }
      return b;
    });
    setBlocks(updated);
    syncToCloud(updated, noteTitle);
  };

  const handleAddListItem = (blockId: string, currentIndex?: number) => {
    if (!canEdit) return;

    let targetIdx = -1;
    const updated = blocks.map((b) => {
      if (b.id === blockId && b.items) {
        const newItems = [...b.items];
        const insertAt =
          currentIndex !== undefined ? currentIndex + 1 : newItems.length;
        newItems.splice(insertAt, 0, "");
        targetIdx = insertAt;
        return { ...b, items: newItems };
      }
      return b;
    });

    setBlocks(updated);
    syncToCloud(updated, noteTitle);

    if (targetIdx !== -1) {
      setTimeout(() => {
        inputRefs.current[`${blockId}_${targetIdx}`]?.focus();
      }, 100);
    }
  };

  const handleRemoveListItem = (blockId: string, itemIdx: number) => {
    if (!canEdit) return;

    const updated = blocks.map((b) => {
      if (b.id === blockId && b.items) {
        const newItems = b.items.filter((_, idx) => idx !== itemIdx);
        return { ...b, items: newItems.length === 0 ? [""] : newItems };
      }
      return b;
    });
    setBlocks(updated);
    syncToCloud(updated, noteTitle);

    const prevIdx = Math.max(0, itemIdx - 1);
    setTimeout(() => {
      inputRefs.current[`${blockId}_${prevIdx}`]?.focus();
    }, 100);
  };

  const handleListItemSubmit = (blockId: string, itemIdx: number) => {
    if (!canEdit) return;
    const block = blocks.find((b) => b.id === blockId);
    if (!block || !block.items) return;

    const itemText = block.items[itemIdx];
    if (itemText.trim() === "") {
      // Exit bullet list since the item is empty
      const newItems = block.items.filter((_, idx) => idx !== itemIdx);

      let updated = blocks.map((b) => {
        if (b.id === blockId) {
          return { ...b, items: newItems.length === 0 ? [""] : newItems };
        }
        return b;
      });

      const listIndex = updated.findIndex((b) => b.id === blockId);
      let targetParagraphId = "";

      const nextBlock = updated[listIndex + 1];
      if (nextBlock && nextBlock.type === "paragraph") {
        targetParagraphId = nextBlock.id;
      } else {
        targetParagraphId = generateUniqueBlockId("b");
        updated.splice(listIndex + 1, 0, {
          id: targetParagraphId,
          type: "paragraph",
          content: "",
        });
      }

      if (newItems.length === 0) {
        updated = updated.filter((b) => b.id !== blockId);
      }

      setBlocks(updated);
      syncToCloud(updated, noteTitle);
      setActiveBlockId(targetParagraphId);

      setTimeout(() => {
        inputRefs.current[targetParagraphId]?.focus();
      }, 100);
    } else {
      handleAddListItem(blockId, itemIdx);
    }
  };

  const handleListItemBackspace = (blockId: string, itemIdx: number) => {
    if (!canEdit) return;
    const block = blocks.find((b) => b.id === blockId);
    if (!block || !block.items) return;

    if (block.items.length === 1) {
      // Convert block to paragraph
      const updated = blocks.map((b) => {
        if (b.id === blockId) {
          return {
            id: blockId,
            type: "paragraph" as BlockType,
            content: "",
          };
        }
        return b;
      });
      setBlocks(updated);
      syncToCloud(updated, noteTitle);
      setActiveBlockId(blockId);

      setTimeout(() => {
        inputRefs.current[blockId]?.focus();
      }, 100);
    } else {
      // Remove item and focus previous
      handleRemoveListItem(blockId, itemIdx);
    }
  };

  const handleAddBlock = (type: BlockType) => {
    if (!canEdit) return;

    const newBlock: EditorBlock = {
      id: generateUniqueBlockId("b"),
      type,
      content: "",
      ...(type === "bullet-list" ? { items: [""] } : {}),
    };

    let updated = [...blocks];
    const activeIdx = blocks.findIndex((b) => b.id === activeBlockId);

    if (activeIdx !== -1) {
      updated.splice(activeIdx + 1, 0, newBlock);
    } else {
      updated.push(newBlock);
    }

    setBlocks(updated);
    setActiveBlockId(newBlock.id);

    if (type === "bullet-list") {
      setTimeout(() => {
        inputRefs.current[`${newBlock.id}_0`]?.focus();
      }, 150);
    } else {
      setTimeout(() => {
        inputRefs.current[newBlock.id]?.focus();
      }, 150);
    }
    syncToCloud(updated, noteTitle);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!canEdit) return;
    if (blocks.length === 1) return; // Keep at least one block

    const updated = blocks.filter((b) => b.id !== blockId);
    setBlocks(updated);
    syncToCloud(updated, noteTitle);
  };

  const handleParagraphBackspace = (blockId: string) => {
    if (!canEdit) return;
    if (blocks.length === 1) return;

    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;

    if (index > 0) {
      const prevBlock = blocks[index - 1];

      if (prevBlock.type === "scripture" || prevBlock.type === "comparison") {
        // Delete the scripture/comparison block above the current block
        const updated = blocks.filter((b) => b.id !== prevBlock.id);
        setBlocks(updated);
        syncToCloud(updated, noteTitle);
      } else {
        // Delete the current empty block and focus the previous block
        const updated = blocks.filter((b) => b.id !== blockId);
        setBlocks(updated);
        syncToCloud(updated, noteTitle);

        setActiveBlockId(prevBlock.id);
        if (prevBlock.type === "bullet-list" && prevBlock.items) {
          const lastIdx = prevBlock.items.length - 1;
          setTimeout(() => {
            inputRefs.current[`${prevBlock.id}_${lastIdx}`]?.focus();
          }, 100);
        } else {
          setTimeout(() => {
            inputRefs.current[prevBlock.id]?.focus();
          }, 100);
        }
      }
    }
  };

  const handleToggleBlockType = (blockId: string) => {
    if (!canEdit) return;

    const updated = blocks.map((b) => {
      if (b.id === blockId) {
        const nextType: BlockType =
          b.type === "paragraph" ? "header" : "paragraph";
        return { ...b, type: nextType };
      }
      return b;
    });
    setBlocks(updated);
    syncToCloud(updated, noteTitle);
  };

  // AI Smart Detection debouncer
  const triggerAIScriptureDetection = (blockId: string, text: string) => {
    if (parseDebounceTimeout.current) {
      clearTimeout(parseDebounceTimeout.current);
    }

    parseDebounceTimeout.current = setTimeout(async () => {
      const parsed = parseScriptureRef(text);
      if (parsed) {
        // Scripture detected!
        // Fetch text
        const chosenTranslation =
          parsed.translationOverride || user?.globalDefaultTranslation || "ESV";
        const scripture = await fetchScripture(
          parsed.standardReference,
          chosenTranslation,
        );

        // Remove scripture reference text from the paragraph so it's clean
        const cleanedText = text.replace(parsed.raw, "").trim();

        const newScriptureBlock: EditorBlock = {
          id: generateUniqueBlockId("b_scr"),
          type: "scripture",
          content: parsed.standardReference,
          scriptureRef: parsed.standardReference,
          verseText: scripture.text,
          translation: chosenTranslation,
          isCollapsed: false,
        };

        // Insert scripture block directly below the active paragraph block
        const index = blocks.findIndex((b) => b.id === blockId);
        const updated = [...blocks];

        // Update current text block
        updated[index] = { ...updated[index], content: cleanedText };
        // Insert scripture card
        updated.splice(index + 1, 0, newScriptureBlock);

        // Check if there is already a paragraph below
        const nextBlock = updated[index + 2];
        let nextBlockId = "";
        if (!nextBlock || nextBlock.type !== "paragraph") {
          nextBlockId = generateUniqueBlockId("b");
          updated.splice(index + 2, 0, {
            id: nextBlockId,
            type: "paragraph",
            content: "",
          });
        } else {
          nextBlockId = nextBlock.id;
        }

        setBlocks(updated);
        syncToCloud(updated, noteTitle);

        // Focus the subsequent paragraph block so typing continues uninterrupted
        setActiveBlockId(nextBlockId);
        setTimeout(() => {
          inputRefs.current[nextBlockId]?.focus();
        }, 150);
      }
    }, 1500); // 1.5 seconds debounce
  };

  // Manual Scripture Insertion
  const handleInsertManualScripture = async () => {
    setManualBibleModalVisible(false);
    const startV = parseInt(bibleVerse, 10);
    const endV = parseInt(bibleVerseEnd, 10);
    const standardRef = resolveStandardReference(
      bibleBook,
      parseInt(bibleChapter, 10),
      startV,
      endV,
    );
    const chosenTranslation = bibleVersion;

    let targetBlock: EditorBlock;
    if (isInsertingComparison) {
      // Comparison block
      const result1 = await fetchScripture(standardRef, chosenTranslation);
      const result2 = await fetchScripture(standardRef, comparisonVersion);

      targetBlock = {
        id: generateUniqueBlockId("b_comp"),
        type: "comparison",
        content: `${standardRef} Comparison`,
        scriptureRef: standardRef,
        comparisons: [
          { translation: chosenTranslation, text: result1.text },
          { translation: comparisonVersion, text: result2.text },
        ],
      };
    } else {
      // Collapsible card block
      const result = await fetchScripture(standardRef, chosenTranslation);

      targetBlock = {
        id: generateUniqueBlockId("b_scr"),
        type: "scripture",
        content: standardRef,
        scriptureRef: standardRef,
        verseText: result.text,
        translation: chosenTranslation,
        isCollapsed: false,
      };
    }

    // Insert block inline below the active block, and focus a paragraph below it
    const activeIdx = blocks.findIndex((b) => b.id === activeBlockId);
    let updated = [...blocks];

    if (activeIdx !== -1) {
      updated.splice(activeIdx + 1, 0, targetBlock);

      const nextBlock = updated[activeIdx + 2];
      let newParagraphId = "";
      if (!nextBlock || nextBlock.type !== "paragraph") {
        newParagraphId = generateUniqueBlockId("b");
        updated.splice(activeIdx + 2, 0, {
          id: newParagraphId,
          type: "paragraph",
          content: "",
        });
      } else {
        newParagraphId = nextBlock.id;
      }

      setBlocks(updated);
      syncToCloud(updated, noteTitle);

      setActiveBlockId(newParagraphId);
      setTimeout(() => {
        inputRefs.current[newParagraphId]?.focus();
      }, 150);
    } else {
      const newParagraphId = generateUniqueBlockId("b");
      updated.push(targetBlock);
      updated.push({
        id: newParagraphId,
        type: "paragraph",
        content: "",
      });

      setBlocks(updated);
      syncToCloud(updated, noteTitle);

      setActiveBlockId(newParagraphId);
      setTimeout(() => {
        inputRefs.current[newParagraphId]?.focus();
      }, 150);
    }
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

  const TRANSLATIONS: ("ESV" | "NIV" | "NLT" | "AMP" | "KJV")[] = [
    "ESV",
    "NIV",
    "NLT",
    "AMP",
    "KJV",
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
      {/* IOS-style Header Bar */}
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

        {/* Dynamic Sync & Share Indicators */}
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
        <ScrollView
          className="flex-1 px-6 pt-4"
          keyboardShouldPersistTaps="always"
        >
          {/* Note Title */}
          <TextInput
            value={noteTitle}
            onChangeText={handleTitleChange}
            editable={canEdit}
            placeholder="Title"
            placeholderTextColor="hsl(var(--muted-foreground))"
            className="text-2xl font-sans font-bold text-foreground mb-4 p-0"
          />

          {/* Note Editor Blocks */}
          <View className="pb-40">
            {blocks.map((block) => {
              if (block.type === "paragraph" || block.type === "header") {
                return (
                  <View key={block.id} className="relative group">
                    <TextInput
                      ref={(ref) => {
                        if (ref) {
                          inputRefs.current[block.id] = ref;
                        } else {
                          delete inputRefs.current[block.id];
                        }
                      }}
                      value={block.content}
                      onChangeText={(txt) =>
                        handleUpdateBlockText(block.id, txt)
                      }
                      onFocus={() => setActiveBlockId(block.id)}
                      editable={canEdit}
                      multiline
                      scrollEnabled={false}
                      placeholder={
                        block.type === "header"
                          ? "Header..."
                          : "Type notes, reference John 3:16..."
                      }
                      placeholderTextColor="hsl(var(--muted-foreground)/60)"
                      className={cn(
                        "text-foreground p-0 m-0 font-sans leading-7",
                        block.type === "header"
                          ? "text-xl font-bold tracking-tight text-foreground mb-2 mt-2"
                          : "text-base",
                        activeBlockId === block.id && "pl-2",
                      )}
                      onKeyPress={({ nativeEvent }) => {
                        if (
                          nativeEvent.key === "Backspace" &&
                          block.content === ""
                        ) {
                          handleParagraphBackspace(block.id);
                        }
                      }}
                    />

                    {canEdit &&
                      activeBlockId === block.id &&
                      block.content === "" &&
                      blocks.length > 1 && (
                        <Pressable
                          onPress={() => handleDeleteBlock(block.id)}
                          className="absolute right-0 top-0.5 p-1 active:opacity-60"
                        >
                          <Ionicons
                            name="trash-outline"
                            size={14}
                            className="text-destructive"
                            color="red"
                          />
                        </Pressable>
                      )}
                  </View>
                );
              }

              if (block.type === "bullet-list") {
                return (
                  <View key={block.id} className="mb-3 pl-2">
                    {block.items?.map((item, idx) => (
                      <View key={idx} className="flex-row items-center mb-1.5">
                        <AppText className="text-[#e4b022] dark:text-[#d4af37] mr-2 text-base">
                          •
                        </AppText>
                        <TextInput
                          ref={(ref) => {
                            if (ref) {
                              inputRefs.current[`${block.id}_${idx}`] = ref;
                            } else {
                              delete inputRefs.current[`${block.id}_${idx}`];
                            }
                          }}
                          value={item}
                          onChangeText={(txt) =>
                            handleUpdateListItem(block.id, idx, txt)
                          }
                          onSubmitEditing={() =>
                            handleListItemSubmit(block.id, idx)
                          }
                          onKeyPress={({ nativeEvent }) => {
                            if (
                              nativeEvent.key === "Backspace" &&
                              item === ""
                            ) {
                              handleListItemBackspace(block.id, idx);
                            }
                          }}
                          editable={canEdit}
                          placeholder="List item..."
                          placeholderTextColor="hsl(var(--muted-foreground)/50)"
                          className="flex-1 text-base text-foreground font-sans p-0 m-0 leading-7"
                        />
                        {canEdit && (
                          <View className="flex-row gap-x-2">
                            <Pressable
                              onPress={() =>
                                handleListItemSubmit(block.id, idx)
                              }
                              className="p-1 active:opacity-60"
                            >
                              <Ionicons
                                name="add-circle-outline"
                                size={16}
                                className="text-[#e4b022] dark:text-[#d4af37]"
                                color="gold"
                              />
                            </Pressable>
                            {block.items!.length > 1 && (
                              <Pressable
                                onPress={() =>
                                  handleRemoveListItem(block.id, idx)
                                }
                                className="p-1 active:opacity-60"
                              >
                                <Ionicons
                                  name="remove-circle-outline"
                                  size={16}
                                  className="text-destructive"
                                  color="red"
                                />
                              </Pressable>
                            )}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                );
              }

              if (block.type === "scripture") {
                return (
                  <View key={block.id} className="relative mb-2">
                    <BibleCard
                      reference={block.scriptureRef || "Bible Reference"}
                      verseText={block.verseText}
                      translation={block.translation}
                      isInitiallyCollapsed={block.isCollapsed}
                    />
                    {canEdit && (
                      <Pressable
                        onPress={() => handleDeleteBlock(block.id)}
                        className="absolute right-3 top-3 p-1 bg-black/40 dark:bg-black/60 rounded-full active:opacity-60 z-10"
                      >
                        <Ionicons name="close" size={14} color="white" />
                      </Pressable>
                    )}
                  </View>
                );
              }

              if (block.type === "comparison") {
                return (
                  <View key={block.id} className="relative mb-2">
                    <BibleComparison
                      reference={block.scriptureRef || "Bible Reference"}
                      comparisons={block.comparisons || []}
                    />
                    {canEdit && (
                      <Pressable
                        onPress={() => handleDeleteBlock(block.id)}
                        className="absolute right-3 top-3 p-1 bg-black/40 dark:bg-black/60 rounded-full active:opacity-60 z-10"
                      >
                        <Ionicons name="close" size={14} color="white" />
                      </Pressable>
                    )}
                  </View>
                );
              }

              return null;
            })}
          </View>
        </ScrollView>

        {/* Floating Custom Tool Keyboard Accessory (Apple Notes style) */}
        {canEdit && (
          <View className="flex-row items-center justify-between px-4 py-3 bg-secondary/80 dark:bg-secondary/40 border-t border-border">
            <View className="flex-row gap-x-4">
              <Pressable
                onPress={() =>
                  activeBlockId && handleToggleBlockType(activeBlockId)
                }
                className="p-1.5 active:opacity-60"
              >
                <AppText weight="bold" className="text-foreground text-sm">
                  Aa
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => handleAddBlock("bullet-list")}
                className="p-1.5 active:opacity-60"
              >
                <Ionicons
                  name="list-outline"
                  size={20}
                  className="text-foreground"
                  color="hsl(var(--foreground))"
                />
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

            <Pressable
              onPress={() => handleAddBlock("paragraph")}
              className="p-1.5 active:opacity-60"
            >
              <Ionicons
                name="add-circle"
                size={24}
                className="text-[#e4b022] dark:text-[#d4af37]"
                color="gold"
              />
            </Pressable>
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

            {/* Existing Collaborators List */}
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

            {/* Share Form */}
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
              {/* Book Select Dropdown */}
              <Dropdown
                label="Book"
                value={bibleBook}
                options={bookOptions}
                onSelect={handleSelectBook}
                searchable
                searchPlaceholder="Search books..."
                placeholder="Select Book"
              />

              {/* Chapter Select Dropdown */}
              <Dropdown
                label="Chapter"
                value={bibleChapter}
                options={chapterOptions}
                onSelect={handleSelectChapter}
                placeholder="Select Chapter"
              />

              {/* Start & End Verse Dropdowns */}
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

              {/* Translation Versions Select */}
              <View className="mb-4">
                <AppText
                  weight="semibold"
                  className="text-xs text-muted-foreground uppercase mb-2 tracking-wider"
                >
                  {isInsertingComparison ? "Base Translation" : "Version"}
                </AppText>
                <View className="flex-row gap-2">
                  {TRANSLATIONS.map((version) => (
                    <Pressable
                      key={version}
                      onPress={() => setBibleVersion(version)}
                      className={cn(
                        "flex-1 py-2 rounded-lg border items-center",
                        bibleVersion === version
                          ? "bg-[#e4b022] dark:bg-[#d4af37] border-[#e4b022] dark:border-[#d4af37]"
                          : "bg-secondary/40 border-border",
                      )}
                    >
                      <AppText
                        weight="semibold"
                        className={
                          bibleVersion === version
                            ? "text-white dark:text-black"
                            : "text-foreground"
                        }
                      >
                        {version}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Comparison Version Select (only if comparing) */}
              {isInsertingComparison && (
                <View className="mb-6">
                  <AppText
                    weight="semibold"
                    className="text-xs text-muted-foreground uppercase mb-2 tracking-wider"
                  >
                    Compare With
                  </AppText>
                  <View className="flex-row gap-2">
                    {TRANSLATIONS.map((version) => (
                      <Pressable
                        key={version}
                        disabled={bibleVersion === version}
                        onPress={() => setComparisonVersion(version)}
                        className={cn(
                          "flex-1 py-2 rounded-lg border items-center",
                          comparisonVersion === version
                            ? "bg-[#e4b022] dark:bg-[#d4af37] border-[#e4b022] dark:border-[#d4af37]"
                            : "bg-secondary/40 border-border",
                          bibleVersion === version && "opacity-25",
                        )}
                      >
                        <AppText
                          weight="semibold"
                          className={
                            comparisonVersion === version
                              ? "text-white dark:text-black"
                              : "text-foreground"
                          }
                        >
                          {version}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
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
