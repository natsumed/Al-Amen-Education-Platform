import React, { useMemo } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { GradeChip } from "./GradeChip"
import { PrimaryButton } from "./PrimaryButton"
import { t, type Language } from "../lib/i18n"
import {
  CONTENT_TYPES,
  GRADES,
  SUBJECTS,
  contentTypeLabel,
  gradeLabel,
  subjectLabel,
} from "../lib/labels"
import { radius, shadow, spacing, typography, useColors, type ThemeColors } from "../theme"

export type Filters = {
  grade: string
  subject: string
  contentType: string
  freeOnly: boolean
}

type Props = {
  visible: boolean
  language: Language
  value: Filters
  onChange: (next: Filters) => void
  onApply: () => void
  onClear: () => void
  onClose: () => void
}

export function FilterSheet({ visible, language, value, onChange, onApply, onClear, onClose }: Props) {
  const colors = useColors()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, shadow.floating]}>
        <View style={styles.grabber} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t("filters", language)}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.muted} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.groupLabel}>{t("grade", language)}</Text>
          <View style={styles.chips}>
            {GRADES.map((g) => (
              <GradeChip
                key={g || "all-grades"}
                label={g ? gradeLabel(g, language) : t("allGrades", language)}
                active={value.grade === g}
                onPress={() => onChange({ ...value, grade: g })}
              />
            ))}
          </View>

          <Text style={styles.groupLabel}>{t("allSubjects", language)}</Text>
          <View style={styles.chips}>
            {SUBJECTS.map((s) => (
              <GradeChip
                key={s || "all-subjects"}
                label={s ? subjectLabel(s, language) : t("allSubjects", language)}
                active={value.subject === s}
                onPress={() => onChange({ ...value, subject: s })}
              />
            ))}
          </View>

          <Text style={styles.groupLabel}>{t("allTypes", language)}</Text>
          <View style={styles.chips}>
            {CONTENT_TYPES.map((c) => (
              <GradeChip
                key={c || "all-types"}
                label={c ? contentTypeLabel(c, language) : t("allTypes", language)}
                active={value.contentType === c}
                onPress={() => onChange({ ...value, contentType: c })}
              />
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t("freeOnly", language)}</Text>
            <Switch
              value={value.freeOnly}
              onValueChange={(freeOnly) => onChange({ ...value, freeOnly })}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={t("clearFilters", language)}
            variant="outline"
            onPress={onClear}
            style={styles.footerBtn}
          />
          <PrimaryButton label={t("applyFilters", language)} onPress={onApply} style={styles.footerBtn} />
        </View>
      </View>
    </Modal>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.4)" },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      maxHeight: "82%",
    },
    grabber: {
      alignSelf: "center",
      width: 44,
      height: 5,
      borderRadius: radius.full,
      backgroundColor: colors.border,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    title: { ...typography.h2, color: colors.text },
    groupLabel: {
      ...typography.tiny,
      color: colors.muted,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    chips: { flexDirection: "row", flexWrap: "wrap" },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    switchLabel: { ...typography.body, color: colors.text },
    footer: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
    footerBtn: { flex: 1 },
  })
}
