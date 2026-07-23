import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Competition, Member, Child, Guest } from '../types';

function generateGuestId() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function CompetitionsScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [members, setMembers] = useState<(Member | Child)[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuestName, setNewGuestName] = useState('');

  useEffect(() => {
    if (!holidayId) return;
    let membersList: (Member | Child)[] = [];
    let childrenList: (Member | Child)[] = [];

    const unsubComps = onSnapshot(collection(db, 'holidays', holidayId, 'competitions'), snap => {
      setCompetitions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Competition)));
    });
    const unsubMembers = onSnapshot(collection(db, 'holidays', holidayId, 'members'), snap => {
      membersList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      setMembers([...membersList, ...childrenList]);
    });
    const unsubChildren = onSnapshot(collection(db, 'holidays', holidayId, 'children'), snap => {
      childrenList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Child));
      setMembers([...membersList, ...childrenList]);
    });
    return () => { unsubComps(); unsubMembers(); unsubChildren(); };
  }, [holidayId]);

  const handleAdd = async () => {
    if (!name) { Alert.alert('Error', 'Name is required'); return; }
    try {
      await addDoc(collection(db, 'holidays', holidayId!, 'competitions'), { name, description, scores: {} });
      setName(''); setDescription('');
      setAddModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const openScores = (comp: Competition) => {
    setSelectedComp(comp);
    const init: Record<string, string> = {};
    members.forEach(m => { init[m.id] = String(comp.scores?.[m.id] ?? 0); });
    (comp.guests ?? []).forEach(g => { init[g.id] = String(comp.scores?.[g.id] ?? 0); });
    setScores(init);
    setGuests(comp.guests ?? []);
    setNewGuestName('');
    setScoreModalVisible(true);
  };

  const handleAddGuest = () => {
    if (!newGuestName.trim()) return;
    const guest: Guest = { id: generateGuestId(), name: newGuestName.trim() };
    setGuests(prev => [...prev, guest]);
    setScores(prev => ({ ...prev, [guest.id]: '0' }));
    setNewGuestName('');
  };

  const handleRemoveGuest = (id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id));
    setScores(prev => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSaveScores = async () => {
    if (!selectedComp) return;
    const numericScores: Record<string, number> = {};
    Object.entries(scores).forEach(([k, v]) => { numericScores[k] = parseInt(v) || 0; });
    try {
      await updateDoc(doc(db, 'holidays', holidayId!, 'competitions', selectedComp.id), { scores: numericScores, guests });

      // Re-read all competitions fresh so totals reflect the latest data
      const compsSnap = await getDocs(collection(db, 'holidays', holidayId!, 'competitions'));
      const freshComps = compsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Competition));

      for (const m of members) {
        const total = freshComps.reduce((sum, c) => sum + (c.scores?.[m.id] ?? 0), 0);
        const collName = (m as Child).parentUserId ? 'children' : 'members';
        await updateDoc(doc(db, 'holidays', holidayId!, collName, m.id), { totalPoints: total });
      }
      setScoreModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this competition?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: async () => {
        try { await deleteDoc(doc(db, 'holidays', holidayId!, 'competitions', id)); }
        catch (e: any) { Alert.alert('Error', e.message); }
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={competitions}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openScores(item)} onLongPress={() => handleDelete(item.id)}>
            <Text style={styles.cardTitle}>🏆 {item.name}</Text>
            {item.description && <Text style={styles.cardSub}>{item.description}</Text>}
            <Text style={styles.tapHint}>Tap to enter scores</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={styles.empty}>{t('noCompetitions')}</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('addCompetition')}</Text>
            <TextInput style={styles.input} placeholder={t('name')} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder={t('description')} value={description} onChangeText={setDescription} />
            <View style={styles.row}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setAddModalVisible(false)}><Text>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleAdd}><Text style={{ color: '#fff' }}>{t('save')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={scoreModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('enterScore')}: {selectedComp?.name}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {members.map(m => (
                <View key={m.id} style={styles.scoreRow}>
                  <Text style={styles.scoreName}>{m.name}</Text>
                  <TextInput
                    style={styles.scoreInput}
                    keyboardType="numeric"
                    value={scores[m.id] ?? '0'}
                    onChangeText={v => setScores(prev => ({ ...prev, [m.id]: v }))}
                  />
                </View>
              ))}
              {guests.map(g => (
                <View key={g.id} style={styles.scoreRow}>
                  <Text style={styles.scoreName}>{g.name} <Text style={styles.guestTag}>(guest)</Text></Text>
                  <TextInput
                    style={styles.scoreInput}
                    keyboardType="numeric"
                    value={scores[g.id] ?? '0'}
                    onChangeText={v => setScores(prev => ({ ...prev, [g.id]: v }))}
                  />
                  <TouchableOpacity onPress={() => handleRemoveGuest(g.id)} style={styles.removeGuestBtn}>
                    <Text style={styles.removeGuestText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <View style={styles.addGuestRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder={t('guestName')}
                value={newGuestName}
                onChangeText={setNewGuestName}
              />
              <TouchableOpacity style={styles.addGuestBtn} onPress={handleAddGuest}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{t('addGuest')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setScoreModalVisible(false)}><Text>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSaveScores}><Text style={{ color: '#fff' }}>{t('save')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  cardSub: { fontSize: 13, color: '#666', marginTop: 2 },
  tapHint: { fontSize: 12, color: '#aaa', marginTop: 6, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontStyle: 'italic' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2e7d32', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  btnCancel: { padding: 12 },
  btnSave: { backgroundColor: '#2e7d32', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  scoreName: { fontSize: 15, color: '#333', flex: 1 },
  scoreInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, width: 80, textAlign: 'center', fontSize: 15 },
  guestTag: { fontSize: 12, color: '#aaa', fontStyle: 'italic' },
  removeGuestBtn: { marginLeft: 8, padding: 4 },
  removeGuestText: { fontSize: 18, color: '#c62828', fontWeight: '700' },
  addGuestRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  addGuestBtn: { backgroundColor: '#2e7d32', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12 },
});
