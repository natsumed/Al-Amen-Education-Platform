import React, { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { ErrorBanner } from "../../components/EmptyState"
import { GradeChip } from "../../components/GradeChip"
import { PrimaryButton } from "../../components/PrimaryButton"
import { Screen } from "../../components/Screen"
import { TextField } from "../../components/TextField"
import { api } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import type { RootStackParamList } from "../../navigation/types"
import { colors, spacing, typography } from "../../theme"

type Props = NativeStackScreenProps<RootStackParamList, "Register">
type Role = "STUDENT" | "TEACHER" | "PARENT"

export function RegisterScreen({ navigation }: Props) {
  const { language, login } = useAuth()
  const [role, setRole] = useState<Role>("STUDENT")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [studentPublicId, setStudentPublicId] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const roleLabel = (value: Role) =>
    value === "STUDENT" ? t("student", language) : value === "TEACHER" ? t("teacher", language) : t("parent", language)

  const submit = async () => {
    if (password !== confirm) {
      setError(language === "ar" ? "كلمتا المرور غير متطابقتين" : "Les mots de passe ne correspondent pas")
      return
    }
    if (role === "PARENT" && !/^\d{8}$/.test(studentPublicId.trim())) {
      setError(language === "ar" ? "رقم التلميذ يجب أن يكون 8 أرقام" : "Le n° élève doit comporter 8 chiffres")
      return
    }
    setBusy(true)
    setError("")
    try {
      await api.register({
        fullName,
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
        studentPublicId: role === "PARENT" ? studentPublicId.trim() : undefined,
      })
      // Register does not return a token — sign in immediately for a seamless flow.
      await login(email.trim(), password)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t("register", language)}</Text>
        {error ? <ErrorBanner message={error} /> : null}

        <Text style={styles.groupLabel}>{t("chooseRole", language)}</Text>
        <View style={styles.roles}>
          {(["STUDENT", "TEACHER", "PARENT"] as Role[]).map((value) => (
            <GradeChip key={value} label={roleLabel(value)} active={role === value} onPress={() => setRole(value)} />
          ))}
        </View>

        <TextField label={t("fullName", language)} value={fullName} onChangeText={setFullName} />
        <TextField
          label={t("email", language)}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextField label={t("phone", language)} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        {role === "PARENT" ? (
          <TextField
            label={t("studentIdOptional", language)}
            value={studentPublicId}
            onChangeText={setStudentPublicId}
            keyboardType="number-pad"
            maxLength={8}
          />
        ) : null}
        <TextField label={t("password", language)} value={password} onChangeText={setPassword} secureTextEntry />
        <TextField
          label={t("confirmPassword", language)}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />
        <PrimaryButton label={t("createAccount", language)} onPress={submit} loading={busy} />
        <PrimaryButton
          label={t("backToLogin", language)}
          variant="ghost"
          onPress={() => navigation.replace("Login")}
          style={styles.back}
        />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  content: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.lg },
  groupLabel: { ...typography.tiny, color: colors.muted, marginBottom: spacing.sm },
  roles: { flexDirection: "row", marginBottom: spacing.lg },
  back: { marginTop: spacing.md },
})
