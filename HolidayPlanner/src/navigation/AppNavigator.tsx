import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import HomeScreen from '../screens/HomeScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import MealPlanScreen from '../screens/MealPlanScreen';
import TripsScreen from '../screens/TripsScreen';
import CompetitionsScreen from '../screens/CompetitionsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import CleaningScreen from '../screens/CleaningScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { t } = useTranslation();
  const { member } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home',
            Activities: 'list',
            Meals: 'restaurant',
            Trips: 'map',
            Competitions: 'trophy',
            Leaderboard: 'podium',
            Cleaning: 'brush',
            Profile: 'person',
            Admin: 'settings',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse'} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2e7d32',
        tabBarInactiveTintColor: '#aaa',
        headerStyle: { backgroundColor: '#2e7d32' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarLabelStyle: { fontSize: 10 },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />
      <Tab.Screen name="Activities" component={ActivitiesScreen} options={{ title: t('activities') }} />
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
          tabBarItemStyle: member?.role === 'admin' ? undefined : { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}
