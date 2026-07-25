/** Amenallah mobile design tokens — native only (not for Expo web product UI). */

export const colors = {
  primary: "#2040e0",
  primaryDark: "#1630b0",
  primarySoft: "#e8ecfc",
  bg: "#f4f6fb",
  surface: "#ffffff",
  text: "#0f172a",
  textSecondary: "#475569",
  muted: "#64748b",
  border: "#e2e8f0",
  success: "#166534",
  successBg: "#dcfce7",
  warning: "#92400e",
  warningBg: "#fef3c7",
  danger: "#b91c1c",
  dangerBg: "#fee2e2",
  amber: "#f59e0b",
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
}

export const typography = {
  brand: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: "700" as const },
  h2: { fontSize: 18, fontWeight: "700" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  bodyBold: { fontSize: 16, fontWeight: "600" as const },
  caption: { fontSize: 13, fontWeight: "500" as const },
  tiny: { fontSize: 11, fontWeight: "600" as const },
}
