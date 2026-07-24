import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase/config';
import { useTheme } from '../theme/ThemeContext';
import { Screen, TextField, Button } from '../components/ui';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth web client ID from Firebase Console:
// Authentication → Sign-in method → Google → Web SDK configuration → Web client ID
const GOOGLE_CLIENT_ID = '342767702765-drjdtooc7ljs7thfsa8i4s9646edpio3.apps.googleusercontent.com';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius, typography } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token ?? response.authentication?.idToken;
      if (!idToken) {
        setErrorMsg('Google Sign-In failed: no token received');
        return;
      }
      setGoogleLoading(true);
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(auth, credential)
        .catch((e) => setErrorMsg(e.message))
        .finally(() => setGoogleLoading(false));
    } else if (response?.type === 'error') {
      setErrorMsg('Google Sign-In failed');
    }
  }, [response]);

  const handleAuth = async () => {
    setErrorMsg('');
    if (!email || !password) { setErrorMsg('Please enter email and password'); return; }
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ justifyContent: 'center', padding: spacing.xxl }}>
      <Text style={[typography.title, { color: colors.primary, textAlign: 'center', marginBottom: spacing.xxxl }]}>
        🏕️ Apalucha Planner
      </Text>

      <TextField
        placeholder={t('email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField
        placeholder={t('password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button label={isRegister ? 'Register' : t('signIn')} onPress={handleAuth} loading={loading} style={{ marginTop: spacing.sm }} />

      {errorMsg ? <Text style={[typography.caption, { color: colors.error, textAlign: 'center', marginTop: spacing.md }]}>{errorMsg}</Text> : null}
      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
        <Text style={[typography.caption, { color: colors.primary, textAlign: 'center', marginTop: spacing.lg }]}>
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[typography.caption, { color: colors.textMuted, marginHorizontal: spacing.md }]}>or</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      <TouchableOpacity
        style={[styles.googleButton, { backgroundColor: colors.surfaceElevated, borderRadius: radius.md, borderColor: colors.border }]}
        onPress={() => promptAsync()}
        disabled={!request || googleLoading}
      >
        <Text style={styles.googleIcon}>G</Text>
        <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>{googleLoading ? '...' : 'Continue with Google'}</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderWidth: StyleSheet.hairlineWidth, gap: 10 },
  googleIcon: { fontSize: 18, fontWeight: 'bold', color: '#4285F4' },
});
