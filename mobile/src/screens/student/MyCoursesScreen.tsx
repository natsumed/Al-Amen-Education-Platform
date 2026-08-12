import React from "react"
import { SectionList, StyleSheet, Text, View } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { AppHeader } from "../../components/AppHeader"
import { EmptyState } from "../../components/EmptyState"
import { CardSkeletonList } from "../../components/Skeleton"
import { ProgressCourseCard } from "../../components/ProgressCourseCard"
import { Screen } from "../../components/Screen"
import { OfflineBanner } from "../../components/OfflineBanner"
import { useProgress } from "../../features/progress/use-progress"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import type { LearnerTabParamList } from "../../navigation/types"
import type { ProgressItem } from "../../lib/api"
import { colors, spacing, typography } from "../../theme"

export function MyCoursesScreen() {
  const { user, language, setLanguage, logout } = useAuth()
  const { items, loading, offline } = useProgress()
  const navigation = useNavigation<BottomTabNavigationProp<LearnerTabParamList>>()
  const isTeacher = user?.role === "TEACHER"

  const inProgress = items.filter((item) => !item.completed)
  const completed = items.filter((item) => item.completed)

  const sections: Array<{ title: string; data: ProgressItem[] }> = []
  if (inProgress.length) sections.push({ title: t("continueSection", language), data: inProgress })
  if (completed.length) sections.push({ title: t("completedSection", language), data: completed })

  const openContent = (contentId: string) =>
    navigation.navigate("CatalogueTab", { screen: "ContentDetail", params: { id: contentId } })

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <AppHeader
          title={isTeacher ? t("library", language) : t("myCourses", language)}
          language={language}
          onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
          onLogout={logout}
        />
        <OfflineBanner visible={offline} language={language} />
      </View>
      {loading ? (
        <CardSkeletonList />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="book-outline"
              title={t("noCourses", language)}
              actionLabel={t("browseEmptyCta", language)}
              onAction={() => navigation.navigate("CatalogueTab")}
            />
          }
          renderItem={({ item }) => (
            <ProgressCourseCard
              item={item}
              language={language}
              onPress={() => openContent(item.contentId)}
            />
          )}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  header: { paddingHorizontal: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
})
