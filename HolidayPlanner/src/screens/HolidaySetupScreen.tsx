import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

// Jan's email is the admin
const ADMIN_EMAIL = 'jan.skramlik@accenture.com';

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function HolidaySetupScreen() {
  const { t } = useTranslation();
  const { setHolidayId } = useAuth();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !startDate || !endDate || !displayName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser!;
      const isAdmin = user.email === ADMIN_EMAIL;
      const holidayRef = doc(collection(db, 'holidays'));
      const code = generateCode();
      await setDoc(holidayRef, {
        name,
        startDate,
        endDate,
        createdBy: user.uid,
        adminUserId: user.uid,
        inviteCode: code,
      });
      await setDoc(doc(db, 'holidays', holidayRef.id, 'members', user.uid), {
        name: displayName,
        role: isAdmin ? 'admin' : 'dad',
        photoUrl: '',
        totalPoints: 0,
      });
      Alert.alert('Holiday Created!', `Invite code: ${code}`);
      setHolidayId(holidayRef.id);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode || !displayName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser!;
      const isAdmin = user.email === ADMIN_EMAIL;
      const q = query(collection(db, 'holidays'), where('inviteCode', '==', inviteCode.toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        Alert.alert('Error', 'Invalid invite code');
        return;
      }
      const holidayDoc = snap.docs[0];
      await setDoc(doc(db, 'holidays', holidayDoc.id, 'members', user.uid), {
        name: displayName,
        role: isAdmin ? 'admin' : 'dad',
        photoUrl: '',
        totalPoints: 0,
      });
      setHolidayId(holidayDoc.id);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏕️ Holiday Planner</Text>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'create' && styles.activeTab]} onPress={() => setTab('create')}>
          <Text style={[styles.tabText, tab === 'create' && styles.activeTabText]}>{t('createHoliday')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'join' && styles.activeTab]} onPress={() => setTab('join')}>
          <Text style={[styles.tabText, tab === 'join' && styles.activeTabText]}>{t('joinHoliday')}</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder={t('name')} value={displayName} onChangeText={setDisplayName} />

      {tab === 'create' ? (
        <>
          <TextInput style={styles.input} placeholder={t('holidayName')} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder={`${t('startDate')} (YYYY-MM-DD)`} value={startDate} onChangeText={setStartDate} />
          <TextInput style={styles.input} placeholder={`${t('endDate')} (YYYY-MM-DD)`} value={endDate} onChangeText={setEndDate} />
          <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('createHoliday')}</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput style={styles.input} placeholder={t('inviteCode')} value={inviteCode} onChangeText={setInviteCode} autoCapitalize="characters" />
          <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('joinHoliday')}</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: '#2e7d32' },
  tabs: { flexDirection: 'row', marginBottom: 20, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#2e7d32' },
  tab: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#fff' },
  activeTab: { backgroundColor: '#2e7d32' },
  tabText: { color: '#2e7d32', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  button: { backgroundColor: '#2e7d32', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
