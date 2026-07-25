import React, { useCallback, useState } from "react"
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { api } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import { Screen } from "../../components/Screen"
import { AppHeader } from "../../components/AppHeader"
import { EmptyState } from "../../components/EmptyState"
import { colors, radius, spacing, typography } from "../../theme"

export function ParentHomeScreen() {
  const { user, language, setLanguage, logout } = useAuth()

  return (
    <Screen scroll>
      <AppHeader
        title={t("brand", language)}
        subtitle={user?.fullName}
        language={language}
        onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
        onLogout={logout}
      />
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>{t("parentWelcome", language)}</Text>
        <Text style={styles.bannerSub}>{t("parentNoCourses", language)}</Text>
      </View>
    </Screen>
  )
}

export function ParentChildrenScreen() {
  const { token, language, setLanguage, logout } = useAuth()
  const [links, setLinks] = useState<
    Array<{
      id: string
      status: string
      student: { fullName: string; email: string; publicId?: string }
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      if (!token) return
      const data = await api.parentChildren(token)
      setLinks(data.links || [])
    } catch {
      setLinks([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      load()
    }, [load])
  )

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <AppHeader
          title={t("children", language)}
          language={language}
          onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
          onLogout={logout}
        />
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={links}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                load()
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={<EmptyState title={language === "ar" ? "لا أطفال مرتبطون" : "Aucun enfant lié"} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.student.fullName}</Text>
              <Text style={styles.email}>{item.student.email}</Text>
              {item.student.publicId ? (
                <Text style={styles.pid}>#{item.student.publicId}</Text>
              ) : null}
              <Text style={styles.status}>{item.status}</Text>
            </View>
          )}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  bannerTitle: { ...typography.h2, color: colors.warning },
  bannerSub: { ...typography.body, color: colors.warning, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { ...typography.bodyBold, color: colors.text },
  email: { ...typography.caption, color: colors.muted, marginTop: 2 },
  pid: { ...typography.caption, color: colors.primary, marginTop: spacing.sm },
  status: { ...typography.tiny, color: colors.muted, marginTop: spacing.sm },
})
