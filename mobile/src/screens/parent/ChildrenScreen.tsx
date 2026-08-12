import React, { useCallback, useState } from "react"
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { api } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import { Screen } from "../../components/Screen"
import { AppHeader } from "../../components/AppHeader"
import { EmptyState } from "../../components/EmptyState"
import { CardSkeletonList } from "../../components/Skeleton"
import { TextField } from "../../components/TextField"
import { PrimaryButton } from "../../components/PrimaryButton"
import { colors, radius, shadow, spacing, typography } from "../../theme"
import type { ChildrenStackParamList } from "../../navigation/types"

type ChildLink = {
  id: string
  status: string
  student: { fullName: string; email: string; publicId?: string }
}

export function ParentChildrenScreen() {
  const { token, language, setLanguage, logout } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<ChildrenStackParamList>>()
  const [links, setLinks] = useState<ChildLink[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [childIdentifier, setChildIdentifier] = useState("")
  const [linkMessage, setLinkMessage] = useState("")

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
      void load()
    }, [load])
  )

  const linkChild = async () => {
    if (!token || !childIdentifier.trim()) return
    try {
      await api.linkChild(token, childIdentifier.trim())
      setChildIdentifier("")
      setLinkMessage(t("invitationSent", language))
      await load()
    } catch (e) {
      setLinkMessage(e instanceof Error ? e.message : "Error")
    }
  }

  const statusColor = (status: string) =>
    status === "ACCEPTED" ? colors.success : status === "REJECTED" ? colors.danger : colors.muted

  return (
    <Screen style={styles.screen}>
      <View style={styles.pad}>
        <AppHeader
          title={t("children", language)}
          language={language}
          onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
          onLogout={logout}
        />
        <TextField
          label={t("childIdentifier", language)}
          value={childIdentifier}
          onChangeText={setChildIdentifier}
          autoCapitalize="none"
        />
        <PrimaryButton label={t("linkChild", language)} onPress={linkChild} />
        {linkMessage ? <Text style={styles.linkMessage}>{linkMessage}</Text> : null}
      </View>
      {loading ? (
        <CardSkeletonList count={3} />
      ) : (
        <FlatList
          data={links}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
          ListEmptyComponent={<EmptyState icon="people-outline" title={t("noChildren", language)} />}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, shadow.card]}
              onPress={() => navigation.navigate("ChildDetail", { linkId: item.id })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>{item.student.fullName.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.student.fullName}</Text>
                {item.student.publicId ? <Text style={styles.pid}>#{item.student.publicId}</Text> : null}
                <Text style={[styles.status, { color: statusColor(item.status) }]}>{item.status}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          )}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  pad: { paddingHorizontal: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  linkMessage: { ...typography.caption, color: colors.primary, marginVertical: spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: "#fff", fontFamily: "Cairo_700Bold", fontSize: 18 },
  info: { flex: 1 },
  name: { ...typography.bodyBold, color: colors.text },
  pid: { ...typography.caption, color: colors.primary, marginTop: 2 },
  status: { ...typography.tiny, marginTop: 2 },
})
