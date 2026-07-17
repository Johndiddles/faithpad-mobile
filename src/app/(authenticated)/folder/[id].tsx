import React, { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { useNotesStore } from "../../../store";
import { Note } from "../../../lib/types";

// Helper to format date like Apple Notes
function formatNoteDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  // Reset hours to compare calendar days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const checkDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (checkDate.getTime() === today.getTime()) {
    // Return time e.g., 2:30 PM
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (checkDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else if (today.getTime() - checkDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
    // Within last week: return day name e.g., Tuesday
    return date.toLocaleDateString([], { weekday: "long" });
  } else {
    // Older: return short date e.g., 7/15/26
    return date.toLocaleDateString([], {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    });
  }
}

// Helper to get preview snippet from note blocks
function getNoteSnippet(note: Note): string {
  const textBlock = note.blocks.find(
    (b) => b.type === "paragraph" && b.content.trim() !== "",
  );
  if (textBlock) {
    return textBlock.content.length > 60
      ? textBlock.content.substring(0, 60) + "..."
      : textBlock.content;
  }
  return "No additional text";
}

export default function FolderNotesListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const folderId = params.id;

  const { folders, notes, deleteNote, createNote, moveNote } = useNotesStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);

  // Resolve Folder Title
  const folder = folders.find((f) => f.id === folderId);
  const folderTitle =
    folderId === "all"
      ? "All Notes"
      : folderId === "uncategorized"
        ? "Uncategorized"
        : folder?.name || "Notes";

  // Filter notes based on folder & search query
  const filteredNotes = notes.filter((note) => {
    // Folder filter
    if (folderId === "uncategorized") {
      if (note.folderId !== null) return false;
    } else if (folderId !== "all") {
      if (note.folderId !== folderId) return false;
    }

    // Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const titleMatches = note.title?.toLowerCase().includes(query) || false;
      const contentMatches = note.blocks.some(
        (b) =>
          b.content.toLowerCase().includes(query) ||
          b.items?.some((i) => i.toLowerCase().includes(query)),
      );
      return titleMatches || contentMatches;
    }

    return true;
  });

  const handleCreateNewNote = () => {
    const activeFolder =
      folderId === "all" || folderId === "uncategorized" ? null : folderId;
    const newNote = createNote(activeFolder);
    router.push(`/note/${newNote.id}` as any);
  };

  const handleOpenOptions = (note: Note) => {
    setSelectedNote(note);
    setOptionsModalVisible(true);
  };

  const handleDeleteNote = () => {
    if (!selectedNote) return;
    deleteNote(selectedNote.id);
    setOptionsModalVisible(false);
    setSelectedNote(null);
  };

  const handleOpenMoveNote = () => {
    setOptionsModalVisible(false);
    setMoveModalVisible(true);
  };

  const handleMoveNoteTo = (targetFolderId: string | null) => {
    if (!selectedNote) return;
    moveNote(selectedNote.id, targetFolderId);
    setMoveModalVisible(false);
    setSelectedNote(null);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "left", "right"]}
    >
      {/* Custom navigation bar */}
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-border/10">
        <Pressable
          onPress={() => router.replace("/folders")}
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
            className="text-base text-[#e4b022] dark:text-[#d4af37] ml-0.5"
          >
            Folders
          </AppText>
        </Pressable>
        <AppText weight="semibold" className="text-lg text-foreground">
          {folderTitle}
        </AppText>
        <View className="w-16" /> {/* Spacer to center title */}
      </View>

      {/* iOS Search Bar */}
      <View className="px-6 pt-3 pb-2">
        <View className="flex-row items-center bg-secondary/60 dark:bg-secondary/20 rounded-xl px-3.5 py-2.5">
          <Ionicons
            name="search-outline"
            size={18}
            className="text-muted-foreground mr-2.5"
            color="hsl(var(--muted-foreground))"
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes, scriptures, blocks"
            placeholderTextColor="hsl(var(--muted-foreground))"
            className="flex-1 text-base text-foreground font-sans p-0 m-0"
          />
          {searchQuery ? (
            <Pressable
              onPress={() => setSearchQuery("")}
              className="p-1 active:opacity-60"
            >
              <Ionicons
                name="close-circle"
                size={16}
                className="text-muted-foreground"
                color="hsl(var(--muted-foreground))"
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Notes List */}
      <ScrollView className="flex-1 px-6">
        {filteredNotes.length === 0 ? (
          <View className="items-center justify-center mt-20">
            <Ionicons
              name="document-text-outline"
              size={64}
              className="text-muted-foreground/30"
              color="rgba(128,128,128,0.2)"
            />
            <AppText
              weight="medium"
              className="text-base text-muted-foreground mt-4"
            >
              No notes found
            </AppText>
          </View>
        ) : (
          <View className="mt-4 bg-secondary/15 dark:bg-secondary/5 border border-border/80 rounded-2xl overflow-hidden mb-6">
            {filteredNotes.map((note, idx) => (
              <View key={note.id} className="border-b border-border/60">
                <Pressable
                  onPress={() => router.push(`/note/${note.id}` as any)}
                  className="flex-row items-center justify-between px-4 py-4 active:bg-secondary/30"
                >
                  <View className="flex-1 pr-4">
                    <AppText
                      weight="bold"
                      className="text-base text-foreground mb-1"
                      numberOfLines={1}
                    >
                      {note.title || "Untitled Note"}
                    </AppText>
                    <View className="flex-row items-center">
                      <AppText className="text-xs text-muted-foreground mr-2">
                        {formatNoteDate(note.updatedAt)}
                      </AppText>
                      <AppText
                        className="text-xs text-muted-foreground/80 flex-1"
                        numberOfLines={1}
                      >
                        {getNoteSnippet(note)}
                      </AppText>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleOpenOptions(note)}
                    className="p-2 rounded-full active:bg-secondary/50"
                  >
                    <Ionicons
                      name="ellipsis-horizontal-circle"
                      size={20}
                      className="text-[#e4b022] dark:text-[#d4af37]"
                      color={Platform.OS === "ios" ? "#e4b022" : "#d4af37"}
                    />
                  </Pressable>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* iOS styled Bottom Toolbar */}
      <View
        className="flex-row items-center justify-between px-6 py-4 bg-background border-t border-border"
        style={{ paddingBottom: Platform.OS === "ios" ? 24 : 16 }}
      >
        <View className="w-6" /> {/* Spacer */}
        <AppText className="text-xs text-muted-foreground">
          {filteredNotes.length} {filteredNotes.length === 1 ? "Note" : "Notes"}
        </AppText>
        <Pressable onPress={handleCreateNewNote} className="active:opacity-60">
          <Ionicons
            name="create-outline"
            size={24}
            className="text-[#e4b022] dark:text-[#d4af37]"
            color={Platform.OS === "ios" ? "#e4b022" : "#d4af37"}
          />
        </Pressable>
      </View>

      {/* Options Menu Modal Sheet */}
      <Modal
        visible={optionsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-card rounded-t-3xl p-6 border-t border-border">
            <AppText
              weight="bold"
              className="text-lg text-center mb-6"
              numberOfLines={1}
            >
              Note: {selectedNote?.title || "Untitled Note"}
            </AppText>

            <View className="gap-y-3">
              <Button
                title="Move to Folder"
                variant="secondary"
                icon={
                  <Ionicons
                    name="folder-open-outline"
                    size={20}
                    className="text-foreground"
                    color="hsl(var(--foreground))"
                  />
                }
                onPress={handleOpenMoveNote}
                className="w-full justify-start py-3.5"
                textClassName="ml-2"
              />
              <Button
                title="Delete Note"
                variant="destructive"
                icon={
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    className="text-white"
                    color="white"
                  />
                }
                onPress={handleDeleteNote}
                className="w-full justify-start py-3.5"
                textClassName="ml-2"
              />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setOptionsModalVisible(false)}
                className="w-full py-3.5 mt-2"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Move Note Modal Screen */}
      <Modal
        visible={moveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMoveModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-card rounded-2xl p-5 border border-border max-h-[70%]">
            <AppText weight="bold" className="text-lg text-center mb-4">
              Move to Folder
            </AppText>

            <ScrollView className="mb-4">
              <Pressable
                onPress={() => handleMoveNoteTo(null)}
                className="flex-row items-center p-3.5 border-b border-border active:bg-secondary/40"
              >
                <Ionicons
                  name="folder-outline"
                  size={20}
                  className="text-muted-foreground mr-3"
                  color="hsl(var(--muted-foreground))"
                />
                <AppText weight="medium" className="text-base text-foreground">
                  Uncategorized
                </AppText>
              </Pressable>

              {folders.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => handleMoveNoteTo(f.id)}
                  className="flex-row items-center p-3.5 border-b border-border active:bg-secondary/40"
                >
                  <Ionicons
                    name="folder-outline"
                    size={20}
                    className="text-muted-foreground mr-3"
                    color="hsl(var(--muted-foreground))"
                  />
                  <AppText
                    weight="medium"
                    className="text-base text-foreground"
                  >
                    {f.name}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>

            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => {
                setMoveModalVisible(false);
                setSelectedNote(null);
              }}
              className="w-full py-3"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
