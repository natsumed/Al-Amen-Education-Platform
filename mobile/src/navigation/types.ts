export type StudentStackParamList = {
  Home: undefined
}

export type CatalogueStackParamList = {
  Browse: undefined
  ContentDetail: { id: string }
}

export type LearnerTabParamList = {
  HomeTab: undefined
  CatalogueTab: undefined
  ProfileTab: undefined
}

export type ParentTabParamList = {
  ParentHomeTab: undefined
  ChildrenTab: undefined
}

export type RootStackParamList = {
  Login: undefined
  LearnerTabs: undefined
  ParentTabs: undefined
  AdminBlocked: undefined
}
