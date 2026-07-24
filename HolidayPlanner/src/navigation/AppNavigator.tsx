import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import HomeScreen from '../screens/HomeScreen';
import MealPlanScreen from '../screens/MealPlanScreen';
import TripsScreen from '../screens/TripsScreen';
import CompetitionsScreen from '../screens/CompetitionsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import CleaningScreen from '../screens/CleaningScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Meals: 'restaurant',
  Trips: 'map',
  Competitions: 'trophy',
  Leaderboard: 'podium',
  Cleaning: 'brush',
  Profile: 'person',
  Admin: 'settings',
};

export default function AppNavigator() {
  const { t } = useTranslation();
  const { member } = useAuth();
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          const base = ICONS[route.name] ?? 'ellipse';
          const name = focused ? base : (`${base}-outline` as keyof typeof Ionicons.glyphMap);
          return <Ionicons name={name} size={size - 2} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          borderRadius: 24,
          height: 64,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFill, { borderRadius: 24, overflow: 'hidden' }]}
          />
        ),
        tabBarItemStyle: { paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />
      <Tab.Screen name="Meals" component={MealPlanScreen} options={{ title: t('mealPlan') }} />
      <Tab.Screen name="Trips" component={TripsScreen} options={{ title: t('trips') }} />
      <Tab.Screen name="Competitions" component={CompetitionsScreen} options={{ title: t('competitions') }} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: t('leaderboard') }} />
      <Tab.Screen name="Cleaning" component={CleaningScreen} options={{ title: t('cleaning') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile') }} />
      <Tab.Screen
        name="Admin"
        component={AdminScreen}
        options={{
          title: t('admin'),
          tabBarButton: member?.role === 'admin' ? undefined : () => null,
          tabBarItemStyle: member?.role === 'admin' ? { paddingTop: 8 } : { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}
