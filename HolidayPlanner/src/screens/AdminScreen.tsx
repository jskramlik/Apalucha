import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { collection, onSnapshot, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Member } from '../types';
import { showAlert, showConfirm } from '../utils/alert';
import DatePickerField from '../components/DatePickerField';
import { Screen, Card, TextField, Button, Avatar } from '../components/ui';

export default function AdminScreen() {
  const { t } = useTranslation();
  const { holidayId, member } = useAuth();
  const { colors, spacing, typography } = useTheme();
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!holidayId) return;
    getDoc(doc(db, 'holidays', holidayId)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setInviteCode(data.inviteCode);
        setName(data.name);
        setStartDate(data.startDate);
        setEndDate(data.endDate);
      }
    });
    return onSnapshot(collection(db, 'holidays', holidayId, 'members'), snap => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
    });
  }, [holidayId]);

  if (member?.role !== 'admin') {
    return <Screen><View style={styles.center}><Text style={{ color: colors.textPrimary }}>Access denied</Text></View></Screen>;
  }

  const handleRemoveMember = (m: Member) => {
    if (m.role === 'admin') { showAlert('Cannot remove admin'); return; }
    showConfirm(t('delete'), `Remove ${m.name}?`, () => {
      deleteDoc(doc(db, 'holidays', holidayId!, 'members', m.id));
    });
  };

  const handleSaveApalucha = async () => {
    if (!name || !startDate || !endDate) { showAlert('Error', 'Please fill all fields'); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'holidays', holidayId!), { name, startDate, endDate });
      await Promise.all(
        members.map(m =>
          updateDoc(doc(db, 'userHolidays', m.id, 'holidays', holidayId!), { holidayName: name }).catch(() => {})
        )
      );
      showAlert('Saved!');
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <FlatList
        data={members}
        keyExtractor={i => i.id}
        ListHeaderComponent={
          <>
            <Card style={[styles.codeCard, { backgroundColor: colors.primary }]}>
              <Text style={[typography.small, { color: colors.primaryText, opacity: 0.8 }]}>Invite Code</Text>
              <Text style={styles.code}>{inviteCode}</Text>
              <Text style={[typography.small, { color: colors.primaryText, opacity: 0.8, marginTop: spacing.sm }]}>Share this code with other dads to join</Text>
            </Card>

            <Card style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.heading, { color: colors.textPrimary, marginBottom: spacing.md }]}>{t('editApalucha')}</Text>
              <TextField placeholder={t('holidayName')} value={name} onChangeText={setName} />
              <DatePickerField placeholder={t('startDate')} value={startDate} onChange={setStartDate} />
              <DatePickerField placeholder={t('endDate')} value={endDate} onChange={setEndDate} />
              <Button label={saving ? '...' : t('save')} onPress={handleSaveApalucha} disabled={saving} style={{ marginTop: spacing.xs }} />
            </Card>

            <Text style={[typography.heading, { color: colors.textPrimary, marginBottom: spacing.sm }]}>{t('members')}</Text>
          </>
        }
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Avatar name={item.name} size={40} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.subheading, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[typography.small, { color: colors.textMuted }]}>{item.role}</Text>
            </View>
            {item.role !== 'admin' && (
              <TouchableOpacity onPress={() => handleRemoveMember(item)}>
                <Text style={[typography.caption, { color: colors.error }]}>Remove</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  codeCard: { marginBottom: 12, alignItems: 'center' },
  code: { color: '#fff', fontSize: 32, fontWeight: 'bold', letterSpacing: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
});
