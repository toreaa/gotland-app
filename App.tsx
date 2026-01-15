import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View } from 'react-native'
import { ConvexClientProvider } from './src/lib/ConvexProvider'

import DashboardScreen from './src/screens/DashboardScreen'
import WeekScreen from './src/screens/WeekScreen'

const Tab = createBottomTabNavigator()

// Placeholder for screens we'll build later
function LogScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 18 }}>Logg - Kommer snart</Text>
      <Text style={{ color: '#888', fontSize: 14, marginTop: 10 }}>Søvn, vekt, energi</Text>
    </View>
  )
}

function StatsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 18 }}>Statistikk - Kommer snart</Text>
      <Text style={{ color: '#888', fontSize: 14, marginTop: 10 }}>Fra Strava</Text>
    </View>
  )
}

function SettingsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 18 }}>Innstillinger</Text>
      <Text style={{ color: '#888', fontSize: 14, marginTop: 10 }}>Strava-kobling, profil</Text>
    </View>
  )
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    'Dashboard': '🏠',
    'Uke': '📅',
    'Logg': '📝',
    'Stats': '📊',
    'Innstillinger': '⚙️',
  }
  return (
    <Text style={{ fontSize: focused ? 28 : 24, opacity: focused ? 1 : 0.6 }}>
      {icons[name] || '📋'}
    </Text>
  )
}

export default function App() {
  return (
    <ConvexClientProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
          tabBarActiveTintColor: '#e94560',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: {
            backgroundColor: '#16213e',
            borderTopColor: '#0f3460',
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
          },
          tabBarLabelStyle: {
            fontSize: 12,
          },
          headerStyle: {
            backgroundColor: '#16213e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Gotland 2026' }}
        />
        <Tab.Screen
          name="Uke"
          component={WeekScreen}
          options={{ title: 'Ukeplan' }}
        />
        <Tab.Screen
          name="Logg"
          component={LogScreen}
          options={{ title: 'Logg' }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{ title: 'Statistikk' }}
        />
        <Tab.Screen
          name="Innstillinger"
          component={SettingsScreen}
          options={{ title: 'Innstillinger' }}
        />
        </Tab.Navigator>
      </NavigationContainer>
    </ConvexClientProvider>
  )
}
