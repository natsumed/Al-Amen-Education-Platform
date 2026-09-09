import React from "react"
import { Linking, Text, View } from "react-native"
import { Screen } from "../components/Screen"
import { PrimaryButton } from "../components/PrimaryButton"
import { useAuth } from "../lib/auth-context"
import { useColors } from "../theme"

export function UpdateRequiredScreen() {
  const { language } = useAuth()
  const colors = useColors()
  return <Screen><View style={{ flex: 1, justifyContent: "center", gap: 16 }}><Text style={{ color: colors.text, fontSize: 24, fontWeight: "700", textAlign: "center" }}>{language === "ar" ? "التحديث مطلوب" : "Mise à jour requise"}</Text><Text style={{ color: colors.muted, textAlign: "center" }}>{language === "ar" ? "حدّث التطبيق لمتابعة استخدام المحتوى المحمي." : "Mettez à jour l’application pour continuer à utiliser le contenu protégé."}</Text><PrimaryButton label={language === "ar" ? "تحديث التطبيق" : "Mettre à jour"} onPress={() => { void Linking.openURL("https://amanallahedition.com/app") }} /></View></Screen>
}
