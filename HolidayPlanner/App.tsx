import './src/i18n';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import LoginScreen from './src/screens/LoginScreen';
import HolidaySetupScreen from './src/screens/HolidaySetupScreen';
import MyHolidaysScreen from './src/screens/MyHolidaysScreen';
import AppNavigator from './src/navigation/AppNavigator';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { t } = useTranslation();
  const { user, holidayId, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#2e7d32' }, headerTintColor: '#fff' }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : !holidayId ? (
        <Stack.Screen name="HolidaySetup" component={HolidaySetupScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={AppNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="MyHolidays" component={MyHolidaysScreen} options={{ presentation: 'modal', title: t('myHolidays') }} />
          <Stack.Screen name="HolidaySetup" component={HolidaySetupScreen} options={{ presentation: 'modal', title: t('createOrJoinAnother') }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" />
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
  );
}
