#!/usr/bin/env node
const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim()
if (apiUrl !== "https://amanallahedition.com") {
  throw new Error("EXPO_PUBLIC_API_URL must be exactly https://amanallahedition.com")
}

const googleEnabled = process.env.MOBILE_GOOGLE_ENABLED === "true"
const platform = process.env.MOBILE_RELEASE_PLATFORM || "android"
const required = (name) => {
  if (!process.env[name]?.trim()) throw new Error(`${name} is required when Google sign-in is enabled`)
}

if (googleEnabled) {
  required("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID")
  if (platform === "android") required("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID")
  if (platform === "ios") required("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID")
}

const forbidden = ["localhost", "127.0.0.1", "10.0.2.2", "REPLACE_WITH_YOUR_API_HOST"]
for (const value of [apiUrl, process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID, process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID]) {
  if (value && forbidden.some((fragment) => value.includes(fragment))) {
    throw new Error(`Release configuration contains forbidden development value: ${value}`)
  }
}

console.log(JSON.stringify({ apiUrl, platform, googleEnabled }))
