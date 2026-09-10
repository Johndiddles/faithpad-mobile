import { Ionicons } from "@expo/vector-icons";
import { Modal, View, useColorScheme } from "react-native";
import { AppText } from "../ui/app-text";
import { Dropdown } from "../ui/dropdown";
import { useState } from "react";
import { Button } from "../ui/button";
import { useBibleVersionsQuery } from "@/queries/useBibleVersions";

const DefaultTranslationModal = ({
  isOpen = false,
  onConfirm,
  initialValue,
  savingTranslation,
}: {
  isOpen: boolean;
  onConfirm: (value: string) => void;
  initialValue?: string;
  savingTranslation: boolean;
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [selectedTranslation, setSelectedTranslation] = useState<string>(
    initialValue || "",
  );
  const { data: versionsData } = useBibleVersionsQuery();
  const versionOptions = versionsData
    ? versionsData.map((v) => ({
        label: `${v.abbreviation} - ${v.name}`,
        value: v.abbreviation,
      }))
    : [];

  const accentColor = isDark ? "#d4af37" : "#e4b022";

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <View className="flex-1 bg-black/60 dark:bg-black/80 items-center justify-center px-6">
        <View className="w-full bg-card border border-border rounded-3xl p-6 shadow-2xl">
          <View className="items-center mb-5">
            <View className="w-14 h-14 bg-[#e4b022]/15 dark:bg-[#e4b022]/20 rounded-2xl items-center justify-center mb-3">
              <Ionicons name="book-outline" size={30} color={accentColor} />
            </View>
            <AppText weight="bold" className="text-2xl text-foreground text-center">
              Welcome to Faith Pad!
            </AppText>
            <AppText
              weight="normal"
              className="text-sm text-muted-foreground text-center mt-2"
            >
              Set your default Bible translation to personalize your sermon
              notes and scripture study.
            </AppText>
          </View>

          <View className="my-2">
            <AppText
              weight="medium"
              className="text-xs text-muted-foreground uppercase tracking-wider mb-2"
            >
              Default Bible Translation
            </AppText>
            <Dropdown
              value={selectedTranslation}
              options={versionOptions}
              onSelect={(val) => setSelectedTranslation(val)}
              placeholder="Select Translation"
              searchable
              searchPlaceholder="Search translations..."
            />
          </View>

          <Button
            title="Set Default & Continue"
            variant="gold"
            size="lg"
            loading={savingTranslation}
            onPress={() => onConfirm(selectedTranslation)}
            className="w-full mt-4 shadow-lg shadow-gold/20"
          />
        </View>
      </View>
    </Modal>
  );
};

export default DefaultTranslationModal;
