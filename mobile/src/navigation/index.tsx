import React from "react"
import { NavigationContainer, DefaultTheme, DarkTheme, type LinkingOptions } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import * as Linking from "expo-linking"
import { ActivityIndicator, View } from "react-native"
import { StatusBar } from "expo-status-bar"
import { useAuth } from "../lib/auth-context"
import { LoginScreen } from "../screens/auth/LoginScreen"
import { RegisterScreen } from "../screens/auth/RegisterScreen"
import { ForgotPasswordScreen } from "../screens/auth/ForgotPasswordScreen"
import { AdminBlockedScreen } from "../screens/AdminBlockedScreen"
import { LearnerTabsNavigator, ParentTabsNavigator } from "./LearnerTabs"
import { useAppTheme, useColors } from "../theme"
import type { RootStackParamList } from "./types"

const Stack = createNativeStackNavigator<RootStackParamList>()

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/"), "alamen://", "https://amenallah.tn"],
  config: {
    screens: {
      LearnerTabs: {
        screens: {
          CatalogueTab: { screens: { ContentDetail: "content/:id" } },
          ProfileTab: { screens: { Subscription: "subscription" } },
        },
      },
    },
  },
}

export function RootNavigator() {
  const { user, loading } = useAuth()
  const { isDark } = useAppTheme()
  const colors = useColors()

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.bg,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer theme={navTheme} linking={linking} key={isDark ? "dark" : "light"}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : user.role === "ADMIN" ? (
          <Stack.Screen name="AdminBlocked" component={AdminBlockedScreen} />
        ) : user.role === "PARENT" ? (
          <Stack.Screen name="ParentTabs" component={ParentTabsNavigator} />
        ) : (
          <Stack.Screen name="LearnerTabs" component={LearnerTabsNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
