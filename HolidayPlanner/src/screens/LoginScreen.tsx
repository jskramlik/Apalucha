import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase/config';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth web client ID from Firebase Console:
// Authentication → Sign-in method → Google → Web SDK configuration → Web client ID
const GOOGLE_CLIENT_ID = '342767702765-drjdtooc7ljs7thfsa8i4s9646edpio3.apps.googleusercontent.com';

export default function LoginScreen() {
  const { t } = useTranslation();
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
    <View style={styles.container}>
      <Text style={styles.title}>🏕️ Holiday Planner</Text>

      <TextInput
        style={styles.input}
        placeholder={t('email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder={t('password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isRegister ? 'Register' : t('signIn')}</Text>}
      </TouchableOpacity>

      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
        <Text style={styles.toggle}>{isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}</Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => promptAsync()}
        disabled={!request || googleLoading}
      >
        {googleLoading ? (
          <ActivityIndicator color="#333" />
        ) : (
          <>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 32, color: '#2e7d32' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  button: { backgroundColor: '#2e7d32', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  toggle: { textAlign: 'center', marginTop: 16, color: '#2e7d32', fontSize: 14 },
  error: { color: '#c62828', textAlign: 'center', marginTop: 8, fontSize: 13 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#ddd' },
  dividerText: { marginHorizontal: 12, color: '#aaa', fontSize: 14 },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#ddd', gap: 10 },
  googleIcon: { fontSize: 18, fontWeight: 'bold', color: '#4285F4' },
  googleText: { fontSize: 16, color: '#333', fontWeight: '500' },
});
