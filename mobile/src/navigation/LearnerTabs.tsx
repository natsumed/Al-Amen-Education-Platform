import React from "react"
import { Text } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useAuth } from "../lib/auth-context"
import { t } from "../lib/i18n"
import { colors } from "../theme"
import { StudentHomeScreen } from "../screens/student/HomeScreen"
import { TeacherHomeScreen } from "../screens/teacher/HomeScreen"
import { BrowseScreen } from "../screens/student/BrowseScreen"
import { ContentDetailScreen } from "../screens/student/ContentDetailScreen"
import { ProfileScreen } from "../screens/student/ProfileScreen"
import {
  ParentHomeScreen,
  ParentChildrenScreen,
} from "../screens/parent/HomeScreen"
import type {
  CatalogueStackParamList,
  LearnerTabParamList,
  ParentTabParamList,
} from "./types"

const CatalogueStack = createNativeStackNavigator<CatalogueStackParamList>()
const LearnerTabs = createBottomTabNavigator<LearnerTabParamList>()
const ParentTabs = createBottomTabNavigator<ParentTabParamList>()

function HomeTabScreen() {
  const { user } = useAuth()
  if (user?.role === "TEACHER") return <TeacherHomeScreen />
  return <StudentHomeScreen />
}

function CatalogueStackNav() {
  const { language } = useAuth()
  return (
    <CatalogueStack.Navigator>
      <CatalogueStack.Screen
        name="Browse"
        component={BrowseScreen}
        options={{ headerShown: false }}
      />
      <CatalogueStack.Screen
        name="ContentDetail"
        component={ContentDetailScreen}
        options={{
          title: t("catalogue", language),
          headerTintColor: colors.primary,
        }}
      />
    </CatalogueStack.Navigator>
  )
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 16,
        fontWeight: focused ? "700" : "500",
        color: focused ? colors.primary : colors.muted,
      }}
    >
      {label}
    </Text>
  )
}

export function LearnerTabsNavigator() {
  const { language } = useAuth()

  return (
    <LearnerTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 4,
          height: 58,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <LearnerTabs.Screen
        name="HomeTab"
        component={HomeTabScreen}
        options={{
          title: t("home", language),
          tabBarIcon: ({ focused }) => <TabIcon label="⌂" focused={focused} />,
        }}
      />
      <LearnerTabs.Screen
        name="CatalogueTab"
        component={CatalogueStackNav}
        options={{
          title: t("catalogue", language),
          tabBarIcon: ({ focused }) => <TabIcon label="☰" focused={focused} />,
        }}
      />
      <LearnerTabs.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: t("profile", language),
          tabBarIcon: ({ focused }) => <TabIcon label="◉" focused={focused} />,
        }}
      />
    </LearnerTabs.Navigator>
  )
}

export function ParentTabsNavigator() {
  const { language } = useAuth()

  return (
    <ParentTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 58,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <ParentTabs.Screen
        name="ParentHomeTab"
        component={ParentHomeScreen}
        options={{
          title: t("home", language),
          tabBarIcon: ({ focused }) => <TabIcon label="⌂" focused={focused} />,
        }}
      />
      <ParentTabs.Screen
        name="ChildrenTab"
        component={ParentChildrenScreen}
        options={{
          title: t("children", language),
          tabBarIcon: ({ focused }) => <TabIcon label="◎" focused={focused} />,
        }}
      />
    </ParentTabs.Navigator>
  )
}
