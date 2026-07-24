import './src/i18n';
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import LoginScreen from './src/screens/LoginScreen';
import HolidaySetupScreen from './src/screens/HolidaySetupScreen';
import MyHolidaysScreen from './src/screens/MyHolidaysScreen';
import AppNavigator from './src/navigation/AppNavigator';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { user, holidayId, loading, userHolidayCount } = useAuth();
  if (loading) return null;
  // A single apalucha resolves holidayId automatically in AuthContext; while
  // that check is in flight (userHolidayCount === null) hold off rendering
  // to avoid flashing the setup screen before it's known to be unnecessary.
  if (user && !holidayId && userHolidayCount === null) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : !holidayId ? (
        userHolidayCount === 0 ? (
          <Stack.Screen name="HolidaySetup" component={HolidaySetupScreen} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="MyHolidays" component={MyHolidaysScreen} options={{ headerShown: false }} />
        )
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

function ThemedApp() {
  const { colors, isDark } = useTheme();
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
