import React from "react"
import { NavigationContainer, DefaultTheme } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { ActivityIndicator, View } from "react-native"
import { useAuth } from "../lib/auth-context"
import { LoginScreen } from "../screens/auth/LoginScreen"
import { AdminBlockedScreen } from "../screens/AdminBlockedScreen"
import { LearnerTabsNavigator, ParentTabsNavigator } from "./LearnerTabs"
import { colors } from "../theme"
import type { RootStackParamList } from "./types"

const Stack = createNativeStackNavigator<RootStackParamList>()

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
}

export function RootNavigator() {
  const { user, loading } = useAuth()

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
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
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
