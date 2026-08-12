import type { NavigatorScreenParams } from "@react-navigation/native"

export type CatalogueStackParamList = {
  Browse: { subject?: string; grade?: string } | undefined
  ContentDetail: { id: string }
}

export type LearnerTabParamList = {
  HomeTab: undefined
  CatalogueTab: NavigatorScreenParams<CatalogueStackParamList> | undefined
  MyCoursesTab: undefined
  ProgressTab: undefined
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined
}

export type ProfileStackParamList = {
  Profile: undefined
  Settings: undefined
  Subscription: undefined
  Help: undefined
}

export type ChildrenStackParamList = {
  ChildrenList: undefined
  ChildDetail: { linkId: string }
}

export type ParentTabParamList = {
  ParentHomeTab: undefined
  ChildrenTab: NavigatorScreenParams<ChildrenStackParamList> | undefined
}

export type RootStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  LearnerTabs: undefined
  ParentTabs: undefined
  AdminBlocked: undefined
}
