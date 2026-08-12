import React from "react"
import { Ionicons } from "@expo/vector-icons"
import { colors } from "../theme"

type Props = {
  name: React.ComponentProps<typeof Ionicons>["name"]
  size?: number
  color?: string
}

export function Icon({ name, size = 22, color = colors.text }: Props) {
  return <Ionicons name={name} size={size} color={color} />
}
