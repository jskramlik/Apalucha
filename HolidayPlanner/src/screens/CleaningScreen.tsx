import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { CleaningTask, Member, Child } from '../types';
import DatePickerField from '../components/DatePickerField';
import { showAlert, showConfirm } from '../utils/alert';
import { Screen, Card, TextField, Button, Chip, EmptyState, BottomSheetModal } from '../components/ui';

const TASK_TEMPLATE_KEYS = ['templateDishes', 'templateSweeping', 'templateMakingBeds', 'templateTrash', 'templateBathroom'] as const;

export default function CleaningScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
  const { colors, spacing, typography } = useTheme();
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [members, setMembers] = useState<(Member | Child)[]>([]);
  const [minDate, setMinDate] = useState<string | undefined>();
  const [maxDate, setMaxDate] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [task, setTask] = useState('');
  const [date, setDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    if (!holidayId) return;
    getDoc(doc(db, 'holidays', holidayId)).then(snap => {
      if (snap.exists()) {
        setMinDate(snap.data().startDate);
        setMaxDate(snap.data().endDate);
      }
    });

    let membersList: (Member | Child)[] = [];
    let childrenList: (Member | Child)[] = [];

    const unsubTasks = onSnapshot(collection(db, 'holidays', holidayId, 'cleaning'), snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as CleaningTask)).sort((a, b) => a.date.localeCompare(b.date)));
    });
    const unsubMembers = onSnapshot(collection(db, 'holidays', holidayId, 'members'), snap => {
      membersList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      setMembers([...membersList, ...childrenList]);
    });
    const unsubChildren = onSnapshot(collection(db, 'holidays', holidayId, 'children'), snap => {
      childrenList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Child));
      setMembers([...membersList, ...childrenList]);
    });
    return () => { unsubTasks(); unsubMembers(); unsubChildren(); };
  }, [holidayId]);

  const handleAdd = async () => {
    if (!task || !date || !assignedTo) { showAlert('Error', 'Task, date, and assignee are required'); return; }
    try {
      await addDoc(collection(db, 'holidays', holidayId!, 'cleaning'), { task, date, assignedTo, done: false });
      setTask(''); setDate(''); setAssignedTo('');
      setModalVisible(false);
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };

  const toggleDone = async (item: CleaningTask) => {
    try {
      await updateDoc(doc(db, 'holidays', holidayId!, 'cleaning', item.id), { done: !item.done });
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(t('delete'), 'Remove this task?', async () => {
      try { await deleteDoc(doc(db, 'holidays', holidayId!, 'cleaning', id)); }
      catch (e: any) { showAlert('Error', e.message); }
    });
  };

  return (
    <Screen>
      <FlatList
        data={tasks}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleDone(item)} onLongPress={() => handleDelete(item.id)}>
            <Card style={[styles.card, item.done && { opacity: 0.6 }]}>
              <Text style={{ fontSize: 20, marginRight: 12 }}>{item.done ? '✅' : '⬜'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[typography.subheading, { color: colors.textPrimary }, item.done && styles.taskDone]}>{item.task}</Text>
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>📅 {item.date} · 👤 {item.assignedTo}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
        ListEmptyComponent={<EmptyState icon="brush-outline" text={t('noCleaning')} />}
      />
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
        <Text style={[styles.fabText, { color: colors.primaryText }]}>+</Text>
      </TouchableOpacity>

      <BottomSheetModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <Text style={[typography.heading, { color: colors.textPrimary, marginBottom: spacing.lg }]}>{t('addCleaningTask')}</Text>
        <View style={styles.templateRow}>
          {TASK_TEMPLATE_KEYS.map(key => (
            <Chip key={key} label={t(key)} selected={task === t(key)} onPress={() => setTask(t(key))} />
          ))}
        </View>
        <TextField placeholder={t('task')} value={task} onChangeText={setTask} />
        <DatePickerField placeholder={t('date')} value={date} onChange={setDate} minDate={minDate} maxDate={maxDate} />
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.sm }]}>{t('assignedTo')}:</Text>
        <View style={styles.templateRow}>
          {members.map(m => (
            <Chip key={m.id} label={m.name} selected={assignedTo === m.name} onPress={() => setAssignedTo(m.name)} />
          ))}
        </View>
        <View style={styles.row}>
          <Button label={t('cancel')} variant="ghost" onPress={() => setModalVisible(false)} />
          <Button label={t('save')} onPress={handleAdd} />
        </View>
      </BottomSheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  taskDone: { textDecorationLine: 'line-through' },
  fab: { position: 'absolute', bottom: 100, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { fontSize: 28, lineHeight: 32 },
  templateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
});
