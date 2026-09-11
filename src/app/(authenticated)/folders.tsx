import React, { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  Modal,
  Platform,
  TextInput,
  Image,
  // ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { useAuthStore, useNotesStore } from "../../store";
import { useFoldersQuery } from "@/queries/useFolders";

export default function FoldersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    folders: storeFolders,
    notes,
    createFolder,
    renameFolder,
    deleteFolder,
    createNote,
  } = useNotesStore();

  const foldersQuery = useFoldersQuery();
  const queryFolders = foldersQuery?.data?.pages.flatMap((page) => page.data);
  const displayFolders = queryFolders ?? storeFolders;

  const [modalVisible, setModalVisible] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");

  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] =
    useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleOpenDeleteModal = (folder: { id: string; name: string }) => {
    setFolderToDelete(folder);
    setDeleteConfirmModalVisible(true);
  };

  const handleConfirmDeleteFolder = () => {
    if (folderToDelete) {
      deleteFolder(folderToDelete.id);
    }
    setDeleteConfirmModalVisible(false);
    setFolderToDelete(null);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    if (
      isCloseToBottom &&
      foldersQuery.hasNextPage &&
      !foldersQuery.isFetchingNextPage
    ) {
      foldersQuery.fetchNextPage();
    }
  };

  // Calculate note counts
  const totalNotesCount = notes.length;

  const getNoteCount = (folderId: string) => {
    return notes.filter((n) => n.folderId === folderId).length;
  };

  const uncategorizedCount = notes.filter((n) => n.folderId === null).length;

  const handleOpenCreateModal = () => {
    setFolderName("");
    setEditingFolderId(null);
    setValidationError("");
    setModalVisible(true);
  };

  const handleOpenRenameModal = (id: string, currentName: string) => {
    setFolderName(currentName);
    setEditingFolderId(id);
    setValidationError("");
    setModalVisible(true);
  };

  const handleSaveFolder = () => {
    const trimmed = folderName.trim();
    if (!trimmed) {
      setValidationError("Folder name cannot be empty");
      return;
    }
    if (trimmed.length > 30) {
      setValidationError("Folder name must be under 30 characters");
      return;
    }

    if (editingFolderId) {
      renameFolder(editingFolderId, trimmed);
    } else {
      createFolder(trimmed);
    }
    setModalVisible(false);
  };

  const handleCreateNewNote = () => {
    // Creates a note at root/uncategorized level and navigates to it
    const newNote = createNote(null);
    router.push(`/note/${newNote.id}` as any);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "left", "right"]}
    >
      {/* Custom IOS Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <AppText weight="bold" className="text-3xl">
          Folders
        </AppText>
        <Pressable
          onPress={() => router.push("/settings" as any)}
          className="w-10 h-10 rounded-full bg-secondary/80 border border-border items-center justify-center overflow-hidden active:opacity-85"
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} className="w-full h-full" />
          ) : (
            <AppText
              weight="semibold"
              className="text-[#e4b022] dark:text-[#d4af37]"
            >
              {user?.displayName
                ? user.displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "FP"}
            </AppText>
          )}
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-6"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Core Sections */}
        <View className="mt-4 bg-secondary/20 dark:bg-secondary/10 rounded-2xl border border-border overflow-hidden">
          {/* All Notes Row */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/folder/[id]",
                params: { id: "all" },
              } as any)
            }
            className="flex-row items-center justify-between px-4 py-4 border-b border-border active:bg-secondary/40"
          >
            <View className="flex-row items-center">
              <Ionicons
                name="documents-outline"
                size={22}
                className="text-[#e4b022] dark:text-[#d4af37] mr-3"
                color={Platform.OS === "ios" ? "#e4b022" : "#d4af37"}
              />
              <AppText weight="medium" className="text-base text-foreground">
                All Notes
              </AppText>
            </View>
            <View className="flex-row items-center">
              <AppText className="text-muted-foreground mr-1.5">
                {totalNotesCount}
              </AppText>
              <Ionicons
                name="chevron-forward"
                size={16}
                className="text-muted-foreground/60"
                color="hsl(var(--muted-foreground))"
              />
            </View>
          </Pressable>

          {/* Uncategorized Row */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/folder/[id]",
                params: { id: "uncategorized" },
              } as any)
            }
            className="flex-row items-center justify-between px-4 py-4 border-b border-border active:bg-secondary/40"
          >
            <View className="flex-row items-center">
              <Ionicons
                name="folder-open-outline"
                size={22}
                className="text-[#e4b022] dark:text-[#d4af37] mr-3"
                color={Platform.OS === "ios" ? "#e4b022" : "#d4af37"}
              />
              <AppText weight="medium" className="text-base text-foreground">
                Uncategorized
              </AppText>
            </View>
            <View className="flex-row items-center">
              <AppText className="text-muted-foreground mr-1.5">
                {uncategorizedCount}
              </AppText>
              <Ionicons
                name="chevron-forward"
                size={16}
                className="text-muted-foreground/60"
                color="hsl(var(--muted-foreground))"
              />
            </View>
          </Pressable>

          {/* Dynamic Folders */}
          {displayFolders?.map((folder) => (
            <View
              key={folder.id}
              className="border-b border-border flex-row items-center"
            >
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/folder/[id]",
                    params: { id: folder.id },
                  } as any)
                }
                className="flex-1 flex-row items-center justify-between px-4 py-4 active:bg-secondary/40"
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="folder-outline"
                    size={22}
                    className="text-[#e4b022] dark:text-[#d4af37] mr-3"
                    color={Platform.OS === "ios" ? "#e4b022" : "#d4af37"}
                  />
                  <AppText
                    weight="medium"
                    className="text-base text-foreground"
                  >
                    {folder.name}
                  </AppText>
                </View>
                <View className="flex-row items-center">
                  <AppText className="text-muted-foreground mr-1.5">
                    {getNoteCount(folder.id)}
                  </AppText>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    className="text-muted-foreground/60"
                    color="hsl(var(--muted-foreground))"
                  />
                </View>
              </Pressable>

              <View className="flex-row pr-3 gap-x-2">
                <Pressable
                  onPress={() => handleOpenRenameModal(folder.id, folder.name)}
                  className="p-1 active:opacity-60"
                >
                  <Ionicons
                    name="pencil-outline"
                    size={16}
                    className="text-[#e4b022] dark:text-[#d4af37]"
                    color={Platform.OS === "ios" ? "#e4b022" : "#d4af37"}
                  />
                </Pressable>
                <Pressable
                  onPress={() => handleOpenDeleteModal(folder)}
                  className="p-1 active:opacity-60"
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    className="text-destructive"
                    color="red"
                  />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Sync Status Badge */}
        {/* <View className="mt-8 mb-6 flex-row items-center justify-center p-3 rounded-xl bg-[#e4b022]/5 dark:bg-[#d4af37]/5 border border-[#e4b022]/10 dark:border-[#d4af37]/10">
          <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2.5 animate-pulse" />
          <AppText
            weight="medium"
            className="text-xs text-[#e4b022] dark:text-[#d4af37]"
          >
            Synced with Cloud Edge Backend
          </AppText>
        </View> */}
      </ScrollView>

      {/* iOS styled Bottom Toolbar */}
      <View
        className="flex-row items-center justify-between px-6 py-4 bg-background border-t border-border"
        style={{ paddingBottom: Math.max(insets.bottom, 14) }}
      >
        <Pressable
          onPress={handleOpenCreateModal}
          className="flex-row items-center active:opacity-60"
        >
          <Ionicons
            name="folder-open-outline"
            size={24}
            className="text-[#e4b022] dark:text-[#d4af37]"
            color={Platform.OS === "ios" ? "#e4b022" : "#d4af37"}
          />
        </Pressable>

        <AppText className="text-xs text-muted-foreground">
          {totalNotesCount} {totalNotesCount === 1 ? "Note" : "Notes"}
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

      {/* Create / Edit Folder Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <View className="flex-1 bg-black/60 items-center justify-center px-6">
            <View className="w-full bg-card rounded-2xl p-5 border border-border">
              <AppText weight="bold" className="text-lg mb-4 text-center">
                {editingFolderId ? "Rename Folder" : "New Folder"}
              </AppText>

              <TextInput
                value={folderName}
                onChangeText={(txt) => {
                  setFolderName(txt);
                  setValidationError("");
                }}
                placeholder="e.g. Sermon Outlines"
                placeholderTextColor="hsl(var(--muted-foreground))"
                autoFocus
                className="border border-border rounded-xl px-4 py-3 bg-background text-foreground text-base mb-2"
              />

              {validationError ? (
                <AppText className="text-xs text-destructive mb-3">
                  {validationError}
                </AppText>
              ) : null}

              <View className="flex-row gap-x-3 mt-2">
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                  className="flex-1"
                />
                <Button
                  title="Save"
                  variant="gold"
                  onPress={handleSaveFolder}
                  className="flex-1"
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Folder Confirmation Modal */}
      <Modal
        visible={deleteConfirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setDeleteConfirmModalVisible(false);
          setFolderToDelete(null);
        }}
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
              Delete Folder?
            </AppText>

            <AppText className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
              Are you sure you want to delete{" "}
              <AppText weight="bold" className="text-foreground">
                &quot;{folderToDelete?.name || "Untitled Folder"}&quot;
              </AppText>
              ? Contained notes will be moved to Uncategorized.
            </AppText>

            <View className="flex-row gap-x-3 w-full">
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setDeleteConfirmModalVisible(false);
                  setFolderToDelete(null);
                }}
                className="flex-1 py-3.5"
              />
              <Button
                title="Delete"
                variant="destructive"
                onPress={handleConfirmDeleteFolder}
                className="flex-1 py-3.5"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
