// app/(tabs)/settings.tsx
//
// ─── SETTINGS SCREEN ─────────────────────────────────────────────────────────
//
// Handles:
//   - Data export (share as JSON)
//   - Data reset (clear all entries)
//   - Privacy information
//   - App version info
//   - Re-view onboarding
//
// ─────────────────────────────────────────────────────────────────────────────

import { useCheckins } from "@/hooks/useCheckins";
import { colors, textStyles } from "@/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ONBOARDING_KEY } from "../onboarding";

// ─── Setting Row Component ────────────────────────────────────────────────────
// A single tappable row — used for every setting item.
// Consistent appearance, reusable pattern.

type SettingRowProps = {
  label: string;
  description?: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean; // red color for dangerous actions
  disabled?: boolean;
};

function SettingRow({
  label,
  description,
  value,
  onPress,
  destructive = false,
  disabled = false,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, disabled && styles.rowDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
    >
      <View style={styles.rowLeft}>
        <Text
          style={[
            styles.rowLabel,
            destructive && styles.rowLabelDestructive,
            disabled && styles.rowLabelDisabled,
          ]}
        >
          {label}
        </Text>
        {description && (
          <Text style={styles.rowDescription}>{description}</Text>
        )}
      </View>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {!value && <Text style={styles.rowChevron}>›</Text>}
    </TouchableOpacity>
  );
}

// ─── Section Component ────────────────────────────────────────────────────────

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { checkins, clearAll } = useCheckins();

  // ─── Export Data ──────────────────────────────────────────────────
  // Converts all check-ins to JSON and opens the system share sheet.
  // User can save to Files, email to themselves, send to Notes, etc.
  // This is the full data portability feature.

  const handleExport = async () => {
    if (checkins.length === 0) {
      Alert.alert(
        "No data to export",
        "Record some check-ins first before exporting.",
      );
      return;
    }

    const exportData = {
      app: "Human Pattern Detector",
      exportDate: new Date().toISOString(),
      version: 1,
      totalEntries: checkins.length,
      checkins: checkins.map((c) => ({
        id: c.id,
        date: new Date(c.timestamp).toISOString(),
        mood: c.mood,
        focus: c.focus,
      })),
    };

    try {
      await Share.share({
        title: "HPD Data Export",
        message: JSON.stringify(exportData, null, 2),
      });
    } catch (error) {
      Alert.alert("Export failed", "Could not export data. Please try again.");
    }
  };

  // ─── Reset Data ───────────────────────────────────────────────────
  // Two-step confirmation before deleting.
  // First Alert: "Are you sure?"
  // Second Alert: final confirmation — prevents accidental deletion.

  const handleReset = () => {
    Alert.alert(
      "Reset All Data",
      `This will permanently delete all ${checkins.length} check-in entries. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "All your behavioral data will be lost forever.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    await clearAll();
                    Alert.alert("Done", "All data has been deleted.");
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  // ─── Reset Onboarding ─────────────────────────────────────────────
  const handleResetOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    router.replace("/onboarding");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>CONFIGURATION</Text>
          <Text style={styles.screenTitle}>Settings</Text>
          <View style={styles.divider} />
        </View>

        {/* Data section */}
        <Section title="DATA">
          <SettingRow
            label="Export Data"
            description="Share your check-in history as JSON"
            onPress={handleExport}
            disabled={checkins.length === 0}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            label="Total Entries"
            value={checkins.length.toString()}
            onPress={() => {}}
            disabled
          />
          {checkins.length > 0 && (
            <>
              <View style={styles.rowDivider} />
              <SettingRow
                label="First Entry"
                value={new Date(
                  Math.min(...checkins.map((c) => c.timestamp)),
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                onPress={() => {}}
                disabled
              />
            </>
          )}
        </Section>

        {/* Privacy section */}
        <Section title="PRIVACY">
          <View style={styles.privacyCard}>
            <Text style={styles.privacyTitle}>100% Local Storage</Text>
            <Text style={styles.privacyBody}>
              All your data lives exclusively on this device. Nothing is sent to
              any server. No account required. No tracking. No analytics sent
              externally.
            </Text>
            <Text style={styles.privacyBody}>
              Deleting the app permanently removes all data. Use Export to keep
              a backup before uninstalling.
            </Text>
          </View>
        </Section>

        {/* App section */}
        <Section title="APP">
          <SettingRow
            label="View Introduction"
            description="Replay the onboarding screens"
            onPress={handleResetOnboarding}
          />
        </Section>

        {/* Danger zone */}
        <Section title="DANGER ZONE">
          <SettingRow
            label="Delete All Data"
            description={`Permanently remove all ${checkins.length} entries`}
            onPress={handleReset}
            destructive
            disabled={checkins.length === 0}
          />
        </Section>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoSymbol}>◈</Text>
          <Text style={styles.appInfoName}>Human Pattern Detector</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoTagline}>
            Small data points → meaningful behavioral insights.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLabel: {
    ...textStyles.label,
    color: colors.text.muted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  screenTitle: {
    ...textStyles.screenTitle,
    color: colors.text.primary,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },

  // Section
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 8,
  },
  sectionTitle: {
    ...textStyles.label,
    color: colors.text.muted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionContent: {
    backgroundColor: colors.surface.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 10,
    overflow: "hidden",
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    ...textStyles.body,
    color: colors.text.primary,
  },
  rowLabelDestructive: {
    color: colors.signal.declining,
  },
  rowLabelDisabled: {
    color: colors.text.secondary,
  },
  rowDescription: {
    ...textStyles.caption,
    color: colors.text.muted,
    letterSpacing: 0.3,
  },
  rowValue: {
    ...textStyles.caption,
    color: colors.text.muted,
  },
  rowChevron: {
    color: colors.text.muted,
    fontSize: 20,
    lineHeight: 22,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginHorizontal: 16,
  },

  // Privacy card
  privacyCard: {
    padding: 16,
    gap: 10,
  },
  privacyTitle: {
    ...textStyles.caption,
    color: colors.accent.green,
    letterSpacing: 1,
    fontWeight: "600",
  },
  privacyBody: {
    ...textStyles.caption,
    color: colors.text.muted,
    lineHeight: 18,
    letterSpacing: 0.3,
  },

  // App info
  appInfo: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 24,
    gap: 6,
  },
  appInfoSymbol: {
    fontSize: 32,
    color: colors.text.muted,
    opacity: 0.3,
    marginBottom: 4,
  },
  appInfoName: {
    ...textStyles.caption,
    color: colors.text.muted,
    letterSpacing: 1,
  },
  appInfoVersion: {
    ...textStyles.hint,
    color: colors.text.muted,
    letterSpacing: 1,
  },
  appInfoTagline: {
    ...textStyles.hint,
    color: colors.text.muted,
    opacity: 0.5,
    textAlign: "center",
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
