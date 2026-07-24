import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { collection, onSnapshot, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Member } from '../types';
import { showAlert, showConfirm } from '../utils/alert';
import DatePickerField from '../components/DatePickerField';

export default function AdminScreen() {
  const { t } = useTranslation();
  const { holidayId, member } = useAuth();
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
    return <View style={styles.center}><Text>Access denied</Text></View>;
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
    <View style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={i => i.id}
        ListHeaderComponent={
          <>
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Invite Code</Text>
              <Text style={styles.code}>{inviteCode}</Text>
              <Text style={styles.codeHint}>Share this code with other dads to join</Text>
            </View>

            <View style={styles.editSection}>
              <Text style={styles.sectionTitle}>{t('editApalucha')}</Text>
              <TextInput style={styles.input} placeholder={t('holidayName')} value={name} onChangeText={setName} />
              <DatePickerField placeholder={t('startDate')} value={startDate} onChange={setStartDate} />
              <DatePickerField placeholder={t('endDate')} value={endDate} onChange={setEndDate} />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveApalucha} disabled={saving}>
                <Text style={styles.saveButtonText}>{saving ? '...' : t('save')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>{t('members')}</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatarSmall}><Text style={styles.avatarLetter}>{(item.name?.[0] ?? '?').toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.role}>{item.role}</Text>
            </View>
            {item.role !== 'admin' && (
              <TouchableOpacity onPress={() => handleRemoveMember(item)}>
                <Text style={styles.remove}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  codeCard: { marginBottom: 12, backgroundColor: '#2e7d32', borderRadius: 16, padding: 20, alignItems: 'center' },
  codeLabel: { color: '#a5d6a7', fontSize: 13, marginBottom: 6 },
  code: { color: '#fff', fontSize: 32, fontWeight: 'bold', letterSpacing: 6 },
  codeHint: { color: '#a5d6a7', fontSize: 12, marginTop: 8 },
  editSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 15 },
  saveButton: { backgroundColor: '#2e7d32', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 4 },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2e7d32', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarLetter: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  name: { fontSize: 15, fontWeight: '600', color: '#333' },
  role: { fontSize: 12, color: '#888' },
  remove: { color: '#c62828', fontSize: 13, fontWeight: '600' },
});
