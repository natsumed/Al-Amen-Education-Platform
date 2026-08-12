import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TextInput,
  ScrollView,
  Text,
  Pressable,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { api, type ContentItem } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import { GRADES, gradeLabel } from "../../lib/labels"
import { Screen } from "../../components/Screen"
import { AppHeader } from "../../components/AppHeader"
import { GradeChip } from "../../components/GradeChip"
import { ContentCard } from "../../components/ContentCard"
import { EmptyState } from "../../components/EmptyState"
import { CardSkeletonList } from "../../components/Skeleton"
import { FilterSheet, type Filters } from "../../components/FilterSheet"
import { fonts, radius, spacing, typography, useColors, type ThemeColors } from "../../theme"
import type { CatalogueStackParamList } from "../../navigation/types"

type Props = NativeStackScreenProps<CatalogueStackParamList, "Browse">

const CACHE_KEY = "amenallah_catalog_cache"
const PAGE_SIZE = 20

const emptyFilters: Filters = { grade: "", subject: "", contentType: "", freeOnly: false }

export function BrowseScreen({ navigation, route }: Props) {
  const { token, language, setLanguage, logout } = useAuth()
  const colors = useColors()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [items, setItems] = useState<ContentItem[]>([])
  const [filters, setFilters] = useState<Filters>({
    ...emptyFilters,
    grade: route.params?.grade || "",
    subject: route.params?.subject || "",
  })
  const [draftFilters, setDraftFilters] = useState<Filters>(filters)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const loadingMoreRef = useRef(false)

  const query = useCallback(
    (pageNum: number) => ({
      grade: filters.grade || undefined,
      subject: filters.subject || undefined,
      contentType: filters.contentType || undefined,
      isFree: filters.freeOnly ? "true" : undefined,
      search: deferredSearch.trim() || undefined,
      page: pageNum,
      limit: PAGE_SIZE,
    }),
    [filters, deferredSearch]
  )

  const load = useCallback(async () => {
    try {
      setError("")
      const data = await api.listContent(query(1), token)
      setItems(data.items || [])
      setPage(1)
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data.items || []))
    } catch {
      const cached = await AsyncStorage.getItem(CACHE_KEY)
      setItems(cached ? JSON.parse(cached) : [])
      setError(cached ? t("offlineData", language) : t("apiDown", language))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [query, token, language])

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || page >= totalPages) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const next = page + 1
      const data = await api.listContent(query(next), token)
      setItems((current) => [...current, ...(data.items || [])])
      setPage(next)
    } catch {
      /* keep current list */
    } finally {
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }, [page, totalPages, query, token])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  const activeCount =
    (filters.grade ? 1 : 0) +
    (filters.subject ? 1 : 0) +
    (filters.contentType ? 1 : 0) +
    (filters.freeOnly ? 1 : 0)

  const openSheet = () => {
    setDraftFilters(filters)
    setSheetOpen(true)
  }
  const applyFilters = () => {
    setFilters(draftFilters)
    setSheetOpen(false)
  }
  const clearFilters = () => {
    setDraftFilters(emptyFilters)
    setFilters(emptyFilters)
    setSheetOpen(false)
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.pad}>
        <AppHeader
          title={t("explore", language)}
          language={language}
          onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
          onLogout={logout}
        />
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("search", language)}
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {search ? (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable style={styles.filterBtn} onPress={openSheet}>
            <Ionicons name="options-outline" size={20} color={colors.primary} />
            {activeCount ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {GRADES.map((g) => (
            <GradeChip
              key={g || "all"}
              label={g ? gradeLabel(g, language) : t("allGrades", language)}
              active={filters.grade === g}
              onPress={() => setFilters((current) => ({ ...current, grade: g }))}
            />
          ))}
        </ScrollView>

        {!loading && !error ? (
          <Text style={styles.count}>
            {total} {t("results", language)}
          </Text>
        ) : null}
        {error ? <Text style={styles.warning}>{error}</Text> : null}
      </View>

      {loading ? (
        <CardSkeletonList />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                void load()
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title={error || t("emptyContent", language)}
            />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footerLoader} /> : null
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

      <FilterSheet
        visible={sheetOpen}
        language={language}
        value={draftFilters}
        onChange={setDraftFilters}
        onApply={applyFilters}
        onClear={clearFilters}
        onClose={() => setSheetOpen(false)}
      />
    </Screen>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  pad: { paddingHorizontal: spacing.lg },
  searchRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, fontFamily: fonts.regular },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: { ...typography.tiny, color: "#fff", fontSize: 10 },
  quickRow: { paddingRight: spacing.lg, marginBottom: spacing.sm },
  count: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm },
  warning: { ...typography.tiny, color: colors.warning, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  footerLoader: { marginVertical: spacing.lg },
})
}
