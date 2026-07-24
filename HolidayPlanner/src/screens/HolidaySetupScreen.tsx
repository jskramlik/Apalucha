import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import DatePickerField from '../components/DatePickerField';
import { showAlert } from '../utils/alert';
import { Screen, TextField, Button, Chip } from '../components/ui';

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function HolidaySetupScreen() {
  const { t } = useTranslation();
  const { setHolidayId } = useAuth();
  const navigation = useNavigation();
  const { colors, spacing, typography } = useTheme();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !startDate || !endDate || !displayName) {
      showAlert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser!;
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
        role: 'admin',
        photoUrl: '',
        totalPoints: 0,
      });
      await setDoc(doc(db, 'userHolidays', user.uid, 'holidays', holidayRef.id), {
        holidayName: name,
        role: 'admin',
        joinedAt: new Date().toISOString(),
      });
      showAlert('Apalucha Created!', `Invite code: ${code}`);
      setHolidayId(holidayRef.id);
      if (navigation.canGoBack()) navigation.goBack();
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode) {
      showAlert('Error', 'Please enter an invite code');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser!;
      const q = query(collection(db, 'holidays'), where('inviteCode', '==', inviteCode.toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        showAlert('Error', 'Invalid invite code');
        return;
      }
      const holidayDoc = snap.docs[0];
      const holidayData = holidayDoc.data();
      const autoName = user.displayName || user.email!.split('@')[0];
      await setDoc(doc(db, 'holidays', holidayDoc.id, 'members', user.uid), {
        name: autoName,
        role: 'dad',
        photoUrl: '',
        totalPoints: 0,
      });
      await setDoc(doc(db, 'userHolidays', user.uid, 'holidays', holidayDoc.id), {
        holidayName: holidayData.name,
        role: 'dad',
        joinedAt: new Date().toISOString(),
      });
      setHolidayId(holidayDoc.id);
      if (navigation.canGoBack()) navigation.goBack();
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ justifyContent: 'center', padding: spacing.xxl }}>
      <Text style={[typography.title, { color: colors.primary, textAlign: 'center', marginBottom: spacing.xxl }]}>
        🏕️ Apalucha Planner
      </Text>
      <View style={styles.tabs}>
        <Chip label={t('createHoliday')} selected={tab === 'create'} onPress={() => setTab('create')} />
        <Chip label={t('joinHoliday')} selected={tab === 'join'} onPress={() => setTab('join')} />
      </View>

      {tab === 'create' ? (
        <>
          <TextField placeholder={t('name')} value={displayName} onChangeText={setDisplayName} />
          <TextField placeholder={t('holidayName')} value={name} onChangeText={setName} />
          <DatePickerField placeholder={t('startDate')} value={startDate} onChange={setStartDate} />
          <DatePickerField placeholder={t('endDate')} value={endDate} onChange={setEndDate} />
          <Button label={t('createHoliday')} onPress={handleCreate} loading={loading} style={{ marginTop: spacing.sm }} />
        </>
      ) : (
        <>
          <TextField placeholder={t('inviteCode')} value={inviteCode} onChangeText={setInviteCode} autoCapitalize="characters" />
          <Button label={t('joinHoliday')} onPress={handleJoin} loading={loading} style={{ marginTop: spacing.sm }} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20, justifyContent: 'center' },
});
