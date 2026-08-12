/** Amenallah mobile design tokens — native only (not for Expo web product UI). */

export { lightColors, darkColors, type ThemeColors } from "./palettes"
export { ThemeProvider, useAppTheme, useColors } from "./theme-context"

/** @deprecated Prefer `useColors()` for theme-reactive UI. Kept as light default for static StyleSheets. */
export { lightColors as colors } from "./palettes"

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

export const fonts = {
  regular: "Cairo_400Regular",
  medium: "Cairo_500Medium",
  semibold: "Cairo_600SemiBold",
  bold: "Cairo_700Bold",
  extrabold: "Cairo_800ExtraBold",
}

export const typography = {
  brand: { fontFamily: fonts.extrabold, fontSize: 28, letterSpacing: -0.5 },
  h1: { fontFamily: fonts.bold, fontSize: 24 },
  h2: { fontFamily: fonts.bold, fontSize: 18 },
  h3: { fontFamily: fonts.semibold, fontSize: 16 },
  body: { fontFamily: fonts.regular, fontSize: 16 },
  bodyBold: { fontFamily: fonts.semibold, fontSize: 16 },
  caption: { fontFamily: fonts.medium, fontSize: 13 },
  tiny: { fontFamily: fonts.semibold, fontSize: 11 },
}

/** Subtle single-layer shadow for cards (avoid heavy multi-layer stacks). */
export const shadow = {
  card: {
    shadowColor: "#1e293b",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: "#1e293b",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
}
