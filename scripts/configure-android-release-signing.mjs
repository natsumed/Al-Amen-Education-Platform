#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises"

const gradlePath = process.argv[2]
if (!gradlePath) throw new Error("Usage: configure-android-release-signing.mjs <app-build.gradle>")

let source = await readFile(gradlePath, "utf8")
if (!source.includes("amenallahRelease")) {
  const signingMarker = "    }\n    buildTypes {"
  const signingBlock = `    }
        amenallahRelease {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storeType "PKCS12"
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    buildTypes {`
  if (!source.includes(signingMarker)) throw new Error("Could not locate generated Android signing block")
  source = source.replace(signingMarker, signingBlock)
}

const releaseMarker = `        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`
if (source.includes(releaseMarker)) {
  source = source.replace(releaseMarker, releaseMarker.replace("signingConfigs.debug", "signingConfigs.amenallahRelease"))
} else if (!source.includes("signingConfig signingConfigs.amenallahRelease")) {
  throw new Error("Could not locate generated Android release signing configuration")
}

await writeFile(gradlePath, source)
