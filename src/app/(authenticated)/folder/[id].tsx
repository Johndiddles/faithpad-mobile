import React, { useState, useMemo } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { useNotesStore } from "../../../store";
import { Note } from "../../../lib/types";
import { useNotesQuery } from "@/queries/useNotes";
import {
  formatNoteDate,
  getNoteSnippet,
  getPlainTextFromLexical,
} from "@/lib/utils";

export default function FolderNotesListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const folderId = params.id;

  const { folders, notes, deletedNoteIds, deleteNote, createNote, moveNote } =
    useNotesStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] =
    useState(false);

  const folder = folders.find((f) => f.id === folderId);
  const folderTitle =
    folderId === "all"
      ? "All Notes"
      : folderId === "uncategorized"
        ? "Uncategorized"
        : folder?.name || "Notes";

  const targetFolderId =
    folderId === "all" || folderId === "uncategorized"
      ? undefined
      : (folderId as string);

  const {
    data: notesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useNotesQuery(targetFolderId);

  const fetchedNotes = useMemo(() => {
    if (!notesData?.pages) return [];
    return notesData.pages.flatMap((page) => page.data || []);
  }, [notesData]);

  const combinedNotes = useMemo(() => {
    const deletedSet = new Set(deletedNoteIds);
    const storeMap = new Map(notes.map((n) => [n.id, n]));

    const updatedFetchedNotes = fetchedNotes
      .filter((fn) => !deletedSet.has(fn.id))
      .map((fn) => storeMap.get(fn.id) || fn);

    const fetchedIdSet = new Set(fetchedNotes.map((fn) => fn.id));
    const storeOnlyNotes = notes.filter(
      (sn) => !fetchedIdSet.has(sn.id) && !deletedSet.has(sn.id),
    );

    return [...storeOnlyNotes, ...updatedFetchedNotes];
  }, [fetchedNotes, notes, deletedNoteIds]);

  const filteredNotes = useMemo(() => {
    return combinedNotes.filter((note) => {
      if (folderId === "uncategorized") {
        if (note.folderId !== null) return false;
      } else if (folderId !== "all") {
        if (note.folderId !== folderId) return false;
      }

      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const titleMatches = note.title?.toLowerCase().includes(query) || false;
        const contentMatches = note.blocks.some((b) => {
          const content = b.content.startsWith('{"root":')
            ? getPlainTextFromLexical(b.content)
            : b.content;
          return (
            content.toLowerCase().includes(query) ||
            b.items?.some((i) => i.toLowerCase().includes(query)) ||
            false
          );
        });
        return titleMatches || contentMatches;
      }

      return true;
    });
  }, [combinedNotes, folderId, searchQuery]);

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

  const handleDeleteNoteClick = () => {
    setOptionsModalVisible(false);
    setDeleteConfirmModalVisible(true);
  };

  const handleConfirmDeleteNote = () => {
    if (!selectedNote) return;
    deleteNote(selectedNote.id);
    setDeleteConfirmModalVisible(false);
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
        <View className="w-16" />
      </View>

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
            className="flex-1 text-base text-foreground p-0 m-0"
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
      <View className="flex-1 px-6 pt-2">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="hsl(var(--primary))" />
          </View>
        ) : (
          <FlashList<Note>
            data={filteredNotes}
            keyExtractor={(item) => item.id}
            estimatedItemSize={72}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.3}
            refreshing={isRefetching}
            onRefresh={refetch}
            ItemSeparatorComponent={() => <View className="h-2" />}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item: note }) => (
              <View className="border-b border-border/60 bg-secondary/15 dark:bg-secondary/5 rounded-xl overflow-hidden border border-border/40">
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
            )}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="py-4 items-center">
                  <ActivityIndicator
                    size="small"
                    color={Platform.OS === "ios" ? "#e4b022" : "#d4af37"}
                  />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !isLoading ? (
                <View className="flex-1 items-center justify-center mt-20">
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
              ) : null
            }
            extraData={filteredNotes}
          />
        )}
      </View>

      {/* iOS styled Bottom Toolbar */}
      <View
        className="flex-row items-center justify-between px-6 py-4 bg-background border-t border-border"
        style={{ paddingBottom: Platform.OS === "ios" ? 24 : 16 }}
      >
        <View className="w-6" />
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
                onPress={handleDeleteNoteClick}
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

      {/* Delete Confirmation Modal Screen */}
      <Modal
        visible={deleteConfirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-card w-full max-w-sm rounded-3xl p-6 border border-border shadow-2xl items-center">
            <View className="w-14 h-14 rounded-full bg-red-500/15 dark:bg-red-500/20 justify-center items-center mb-4">
              <Ionicons name="trash-outline" size={28} color="#ef4444" />
            </View>

            <AppText
              weight="bold"
              className="text-xl text-center text-foreground mb-2"
            >
              Delete Note?
            </AppText>

            <AppText className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
              Are you sure you want to delete{" "}
              <AppText weight="bold" className="text-foreground">
                &quot;{selectedNote?.title || "Untitled Note"}&quot;
              </AppText>
              ? This action is irreversible and cannot be undone.
            </AppText>

            <View className="flex-row gap-x-3 w-full">
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setDeleteConfirmModalVisible(false);
                  setSelectedNote(null);
                }}
                className="flex-1 py-3.5"
              />
              <Button
                title="Delete"
                variant="destructive"
                onPress={handleConfirmDeleteNote}
                className="flex-1 py-3.5"
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
