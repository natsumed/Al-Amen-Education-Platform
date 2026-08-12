import { prisma } from "@/lib/prisma"

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send"

type PushMessage = {
  title: string
  body: string
  data?: Record<string, unknown>
}

/**
 * Send a push notification to every device registered for a user via the Expo
 * Push API. Best-effort: never throws into the caller's request flow.
 */
export async function sendPushToUser(userId: string, message: PushMessage): Promise<void> {
  try {
    const devices = await prisma.deviceToken.findMany({ where: { userId }, select: { token: true } })
    if (devices.length === 0) return

    const messages = devices.map((device) => ({
      to: device.token,
      sound: "default",
      title: message.title,
      body: message.body,
      data: message.data ?? {},
      channelId: "learning",
    }))

    await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    })
  } catch (error) {
    console.error("sendPushToUser error:", error)
  }
}
