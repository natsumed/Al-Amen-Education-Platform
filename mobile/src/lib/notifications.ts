import { Platform } from "react-native"
import Constants from "expo-constants"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { api } from "./api"

const PUSH_TOKEN_KEY = "amenallah_push_token"

/** Lazy-load expo-notifications so a missing native module never blocks login. */
async function getNotifications(): Promise<typeof import("expo-notifications") | null> {
  try {
    return await import("expo-notifications")
  } catch {
    return null
  }
}

let handlerReady = false

async function ensureHandler() {
  if (handlerReady) return
  const Notifications = await getNotifications()
  if (!Notifications) return
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    })
    handlerReady = true
  } catch {
    /* ignore */
  }
}

async function ensureAndroidChannel() {
  const Notifications = await getNotifications()
  if (!Notifications) return
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("learning", {
      name: "Amenallah Learning",
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }
}

export async function enableLearningNotifications() {
  try {
    await ensureHandler()
    await ensureAndroidChannel()
    const Notifications = await getNotifications()
    if (!Notifications) return false
    const permission = await Notifications.requestPermissionsAsync()
    return permission.granted
  } catch {
    return false
  }
}

function getProjectId(): string | undefined {
  return (
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ||
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  )
}

/**
 * Best-effort remote push registration. No-ops safely when EAS projectId is
 * unset or permission is denied (e.g. Expo Go / simulator), so login never fails.
 */
export async function registerPushToken(authToken: string): Promise<void> {
  try {
    const projectId = getProjectId()
    if (!projectId) return
    await ensureHandler()
    await ensureAndroidChannel()
    const Notifications = await getNotifications()
    if (!Notifications) return
    const existing = await Notifications.getPermissionsAsync()
    const granted = existing.granted || (await Notifications.requestPermissionsAsync()).granted
    if (!granted) return
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, data)
    await api.registerPushToken(authToken, data)
  } catch {
    /* best effort */
  }
}

export async function unregisterPushToken(authToken: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(PUSH_TOKEN_KEY)
    if (!stored) return
    await api.unregisterPushToken(authToken, stored)
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY)
  } catch {
    /* best effort */
  }
}

export async function scheduleSubscriptionReminder(endDate: string, language: "fr" | "ar") {
  try {
    await ensureHandler()
    const Notifications = await getNotifications()
    if (!Notifications) return
    const end = new Date(endDate)
    const reminder = new Date(end.getTime() - 3 * 86_400_000)
    if (reminder.getTime() <= Date.now()) return

    await Notifications.scheduleNotificationAsync({
      content: {
        title: language === "ar" ? "أمان الله" : "Amenallah",
        body:
          language === "ar"
            ? "سينتهي اشتراكك خلال 3 أيام."
            : "Votre abonnement expire dans 3 jours.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder,
        channelId: "learning",
      },
    })
  } catch {
    /* best effort */
  }
}
