import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TimelineScreen } from '../screens/TimelineScreen';
import { ScenesScreen } from '../screens/ScenesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

type RootTabParams = {
  Timeline: undefined;
  Scenes: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParams>();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: 'left',
      }}
    >
      <Tab.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{
          title: 'Timeline / Nhat ky',
          tabBarLabel: 'Timeline / Nhat ky',
        }}
      />
      <Tab.Screen
        name="Scenes"
        component={ScenesScreen}
        options={{
          title: 'Scenes / Ngu canh',
          tabBarLabel: 'Scenes / Ngu canh',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings / Cai dat',
          tabBarLabel: 'Settings / Cai dat',
        }}
      />
    </Tab.Navigator>
  );
}
