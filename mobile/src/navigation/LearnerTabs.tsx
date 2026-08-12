import React from "react"
import { Ionicons } from "@expo/vector-icons"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useAuth } from "../lib/auth-context"
import { t } from "../lib/i18n"
import { fonts, useColors } from "../theme"
import { StudentHomeScreen } from "../screens/student/HomeScreen"
import { TeacherHomeScreen } from "../screens/teacher/HomeScreen"
import { BrowseScreen } from "../screens/student/BrowseScreen"
import { ContentDetailScreen } from "../screens/student/ContentDetailScreen"
import { ProfileScreen } from "../screens/student/ProfileScreen"
import { MyCoursesScreen } from "../screens/student/MyCoursesScreen"
import { ProgressScreen } from "../screens/student/ProgressScreen"
import { SettingsScreen } from "../screens/student/SettingsScreen"
import { SubscriptionScreen } from "../screens/student/SubscriptionScreen"
import { HelpScreen } from "../screens/student/HelpScreen"
import { ParentHomeScreen } from "../screens/parent/HomeScreen"
import { ParentChildrenScreen } from "../screens/parent/ChildrenScreen"
import { ChildDetailScreen } from "../screens/parent/ChildDetailScreen"
import type {
  CatalogueStackParamList,
  ChildrenStackParamList,
  LearnerTabParamList,
  ParentTabParamList,
  ProfileStackParamList,
} from "./types"

const CatalogueStack = createNativeStackNavigator<CatalogueStackParamList>()
const LearnerTabs = createBottomTabNavigator<LearnerTabParamList>()
const ParentTabs = createBottomTabNavigator<ParentTabParamList>()
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>()
const ChildrenStack = createNativeStackNavigator<ChildrenStackParamList>()

function HomeTabScreen() {
  const { user } = useAuth()
  if (user?.role === "TEACHER") return <TeacherHomeScreen />
  return <StudentHomeScreen />
}

function CatalogueStackNav() {
  const { language } = useAuth()
  const colors = useColors()
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
          title: t("explore", language),
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { fontFamily: fonts.bold, color: colors.text },
        }}
      />
    </CatalogueStack.Navigator>
  )
}

function ProfileStackNav() {
  const { language } = useAuth()
  const colors = useColors()
  const headerOptions = {
    headerTintColor: colors.primary,
    headerStyle: { backgroundColor: colors.surface },
    headerTitleStyle: { fontFamily: fonts.bold, color: colors.text },
  }
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t("settings", language), ...headerOptions }}
      />
      <ProfileStack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ title: t("subscription", language), ...headerOptions }}
      />
      <ProfileStack.Screen
        name="Help"
        component={HelpScreen}
        options={{ title: t("help", language), ...headerOptions }}
      />
    </ProfileStack.Navigator>
  )
}

function ChildrenStackNav() {
  const { language } = useAuth()
  const colors = useColors()
  return (
    <ChildrenStack.Navigator>
      <ChildrenStack.Screen name="ChildrenList" component={ParentChildrenScreen} options={{ headerShown: false }} />
      <ChildrenStack.Screen
        name="ChildDetail"
        component={ChildDetailScreen}
        options={{
          title: t("children", language),
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { fontFamily: fonts.bold, color: colors.text },
        }}
      />
    </ChildrenStack.Navigator>
  )
}

type IoniconName = React.ComponentProps<typeof Ionicons>["name"]

function TabIcon({ name, color }: { name: IoniconName; color: string }) {
  return <Ionicons name={name} size={23} color={color} />
}

export function LearnerTabsNavigator() {
  const { language, user } = useAuth()
  const colors = useColors()

  return (
    <LearnerTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 6,
          height: 66,
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: fonts.semibold },
      }}
    >
      <LearnerTabs.Screen
        name="HomeTab"
        component={HomeTabScreen}
        options={{
          title: t("home", language),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "home" : "home-outline"} color={color} />
          ),
        }}
      />
      <LearnerTabs.Screen
        name="CatalogueTab"
        component={CatalogueStackNav}
        options={{
          title: t("explore", language),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "compass" : "compass-outline"} color={color} />
          ),
        }}
      />
      <LearnerTabs.Screen
        name="MyCoursesTab"
        component={MyCoursesScreen}
        options={{
          title: user?.role === "TEACHER" ? t("library", language) : t("myCourses", language),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "library" : "library-outline"} color={color} />
          ),
        }}
      />
      <LearnerTabs.Screen
        name="ProgressTab"
        component={ProgressScreen}
        options={{
          title: t("progress", language),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "stats-chart" : "stats-chart-outline"} color={color} />
          ),
        }}
      />
      <LearnerTabs.Screen
        name="ProfileTab"
        component={ProfileStackNav}
        options={{
          title: t("profile", language),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "person" : "person-outline"} color={color} />
          ),
        }}
      />
    </LearnerTabs.Navigator>
  )
}

export function ParentTabsNavigator() {
  const { language } = useAuth()
  const colors = useColors()

  return (
    <ParentTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 6,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.semibold },
      }}
    >
      <ParentTabs.Screen
        name="ParentHomeTab"
        component={ParentHomeScreen}
        options={{
          title: t("home", language),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "home" : "home-outline"} color={color} />
          ),
        }}
      />
      <ParentTabs.Screen
        name="ChildrenTab"
        component={ChildrenStackNav}
        options={{
          title: t("children", language),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "people" : "people-outline"} color={color} />
          ),
        }}
      />
    </ParentTabs.Navigator>
  )
}
