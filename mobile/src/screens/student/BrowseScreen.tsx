import React, { useCallback, useState } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { api, type ContentItem } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import { Screen } from "../../components/Screen"
import { AppHeader } from "../../components/AppHeader"
import { GradeChip } from "../../components/GradeChip"
import { ContentCard } from "../../components/ContentCard"
import { EmptyState } from "../../components/EmptyState"
import { colors, spacing } from "../../theme"
import type { CatalogueStackParamList } from "../../navigation/types"

type Props = NativeStackScreenProps<CatalogueStackParamList, "Browse">

const GRADES = ["", "GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4", "GRADE_5", "GRADE_6"]

export function BrowseScreen({ navigation }: Props) {
  const { token, language, setLanguage, logout } = useAuth()
  const [items, setItems] = useState<ContentItem[]>([])
  const [grade, setGrade] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      setError("")
      const data = await api.listContent({ grade: grade || undefined, limit: 40 }, token)
      setItems(data.items || [])
    } catch {
      setItems([])
      setError(t("apiDown", language))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [grade, token, language])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      load()
    }, [load])
  )

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <View style={styles.pad}>
        <AppHeader
          title={t("catalogue", language)}
          language={language}
          onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
          onLogout={logout}
        />
        <View style={styles.filters}>
          {GRADES.map((g) => {
            const label = g
              ? `${t("grade", language)} ${g.replace("GRADE_", "")}`
              : t("allGrades", language)
            return (
              <GradeChip
                key={g || "all"}
                label={label}
                active={grade === g}
                onPress={() => setGrade(g)}
              />
            )
          })}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
          ListEmptyComponent={
            <EmptyState
              title={error || t("emptyContent", language)}
              subtitle={error ? undefined : undefined}
            />
          }
          renderItem={({ item }) => (
            <ContentCard
              item={item}
              language={language}
              onPress={() => navigation.navigate("ContentDetail", { id: item.id })}
            />
          )}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: spacing.lg },
  filters: { flexDirection: "row", flexWrap: "wrap", marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
})
