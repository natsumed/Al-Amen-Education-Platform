import AsyncStorage from "@react-native-async-storage/async-storage"
import { api } from "./api"

const QUEUE_KEY = "amenallah_progress_queue"

type PendingProgress = { contentId: string; progressPercent: number }

async function readQueue(): Promise<PendingProgress[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as PendingProgress[]) : []
  } catch {
    return []
  }
}

async function writeQueue(items: PendingProgress[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items))
}

async function enqueue(item: PendingProgress): Promise<void> {
  const queue = await readQueue()
  const existing = queue.find((entry) => entry.contentId === item.contentId)
  if (existing) {
    existing.progressPercent = Math.max(existing.progressPercent, item.progressPercent)
  } else {
    queue.push(item)
  }
  await writeQueue(queue)
}

/** Write progress now; if the network fails, queue it to flush when back online. */
export async function submitProgress(
  token: string,
  contentId: string,
  progressPercent: number
): Promise<void> {
  try {
    await api.updateProgress(token, contentId, progressPercent)
  } catch {
    await enqueue({ contentId, progressPercent })
  }
}

export async function flushProgressQueue(token: string): Promise<void> {
  const queue = await readQueue()
  if (queue.length === 0) return
  const remaining: PendingProgress[] = []
  for (const item of queue) {
    try {
      await api.updateProgress(token, item.contentId, item.progressPercent)
    } catch {
      remaining.push(item)
    }
  }
  await writeQueue(remaining)
}
