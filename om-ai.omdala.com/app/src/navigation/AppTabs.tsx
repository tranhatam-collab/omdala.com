import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { TimelineScreen } from '../screens/TimelineScreen'
import { ScenesScreen } from '../screens/ScenesScreen'
import { SettingsScreen } from '../screens/SettingsScreen'

type RootTabParams = {
  Timeline: undefined
  Scenes: undefined
  Settings: undefined
}

const Tab = createBottomTabNavigator<RootTabParams>()

export function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Timeline" component={TimelineScreen} />
      <Tab.Screen name="Scenes" component={ScenesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}
