import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Competition, Member, Child, Guest } from '../types';
import { showAlert, showConfirm } from '../utils/alert';
import { Screen, Card, TextField, Button, Chip, Badge, EmptyState, BottomSheetModal } from '../components/ui';

function generateGuestId() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function CompetitionsScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
  const { colors, spacing, typography } = useTheme();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [members, setMembers] = useState<(Member | Child)[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'individual' | 'team'>('individual');
  const [lowestWins, setLowestWins] = useState(false);
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

  const openAdd = () => {
    setEditingCompId(null);
    setName(''); setDescription(''); setType('individual'); setLowestWins(false);
    setAddModalVisible(true);
  };

  const openEditComp = (comp: Competition) => {
    setEditingCompId(comp.id);
    setName(comp.name);
    setDescription(comp.description ?? '');
    setType(comp.type ?? 'individual');
    setLowestWins(comp.lowestWins ?? false);
    setAddModalVisible(true);
  };

  const handleSaveCompetition = async () => {
    if (!name) { showAlert('Error', 'Name is required'); return; }
    try {
      if (editingCompId) {
        await updateDoc(doc(db, 'holidays', holidayId!, 'competitions', editingCompId), { name, description, type, lowestWins });
      } else {
        await addDoc(collection(db, 'holidays', holidayId!, 'competitions'), { name, description, scores: {}, type, lowestWins });
      }
      setAddModalVisible(false);
    } catch (e: any) {
      showAlert('Error', e.message);
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
      showAlert('Error', e.message);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(t('delete'), 'Remove this competition?', async () => {
      try { await deleteDoc(doc(db, 'holidays', holidayId!, 'competitions', id)); }
      catch (e: any) { showAlert('Error', e.message); }
    });
  };

  return (
    <Screen>
      <FlatList
        data={competitions}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.md }}>
            <TouchableOpacity onPress={() => openScores(item)}>
              <Text style={[typography.subheading, { color: colors.textPrimary }]}>🏆 {item.name}</Text>
              {item.description && <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{item.description}</Text>}
              <View style={styles.badgeRow}>
                {item.type === 'team' && <Badge label="🤝 Team" tone="secondary" />}
                {item.lowestWins && <Badge label="🔻 Lowest wins" tone="muted" />}
              </View>
              <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' }]}>Tap to enter scores</Text>
            </TouchableOpacity>
            <View style={styles.cardActionsRow}>
              <TouchableOpacity onPress={() => openEditComp(item)}>
                <Text style={[typography.caption, { color: colors.primary }]}>✏️ {t('edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={[typography.caption, { color: colors.error }]}>🗑 {t('delete')}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
        ListEmptyComponent={<EmptyState icon="trophy-outline" text={t('noCompetitions')} />}
      />
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={openAdd}>
        <Text style={[styles.fabText, { color: colors.primaryText }]}>+</Text>
      </TouchableOpacity>

      <BottomSheetModal visible={addModalVisible} onClose={() => setAddModalVisible(false)}>
        <Text style={[typography.heading, { color: colors.textPrimary, marginBottom: spacing.lg }]}>{editingCompId ? t('edit') : t('addCompetition')}</Text>
        <TextField placeholder={t('name')} value={name} onChangeText={setName} />
        <TextField placeholder={t('description')} value={description} onChangeText={setDescription} />
        <View style={styles.toggleRow}>
          <Chip label="Individual" selected={type === 'individual'} onPress={() => setType('individual')} />
          <Chip label="Team" selected={type === 'team'} onPress={() => setType('team')} />
        </View>
        <View style={styles.toggleRow}>
          <Chip label="Highest wins" selected={!lowestWins} onPress={() => setLowestWins(false)} />
          <Chip label="Lowest wins" selected={lowestWins} onPress={() => setLowestWins(true)} />
        </View>
        <View style={styles.row}>
          <Button label={t('cancel')} variant="ghost" onPress={() => setAddModalVisible(false)} />
          <Button label={t('save')} onPress={handleSaveCompetition} />
        </View>
      </BottomSheetModal>

      <BottomSheetModal visible={scoreModalVisible} onClose={() => setScoreModalVisible(false)}>
        <Text style={[typography.heading, { color: colors.textPrimary, marginBottom: spacing.lg }]}>{t('enterScore')}: {selectedComp?.name}</Text>
        <ScrollView style={{ maxHeight: 300 }}>
          {members.map(m => (
            <View key={m.id} style={styles.scoreRow}>
              <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>{m.name}</Text>
              <TextField
                style={styles.scoreInput}
                keyboardType="numeric"
                value={scores[m.id] ?? '0'}
                onChangeText={v => setScores(prev => ({ ...prev, [m.id]: v }))}
              />
            </View>
          ))}
          {guests.map(g => (
            <View key={g.id} style={styles.scoreRow}>
              <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>{g.name} <Text style={[typography.small, { color: colors.textMuted, fontStyle: 'italic' }]}>(guest)</Text></Text>
              <TextField
                style={styles.scoreInput}
                keyboardType="numeric"
                value={scores[g.id] ?? '0'}
                onChangeText={v => setScores(prev => ({ ...prev, [g.id]: v }))}
              />
              <TouchableOpacity onPress={() => handleRemoveGuest(g.id)} style={{ marginLeft: spacing.sm, padding: 4 }}>
                <Text style={{ fontSize: 18, color: colors.error, fontWeight: '700' }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <View style={styles.addGuestRow}>
          <TextField
            style={{ flex: 1, marginBottom: 0 }}
            placeholder={t('guestName')}
            value={newGuestName}
            onChangeText={setNewGuestName}
          />
          <Button label={t('addGuest')} onPress={handleAddGuest} />
        </View>
        <View style={styles.row}>
          <Button label={t('cancel')} variant="ghost" onPress={() => setScoreModalVisible(false)} />
          <Button label={t('save')} onPress={handleSaveScores} />
        </View>
      </BottomSheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', bottom: 100, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { fontSize: 28, lineHeight: 32 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  scoreInput: { width: 80, textAlign: 'center', marginBottom: 0 },
  addGuestRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  cardActionsRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
});
