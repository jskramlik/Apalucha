import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { CleaningTask, Member, Child } from '../types';
import DatePickerField from '../components/DatePickerField';
import { showAlert, showConfirm } from '../utils/alert';

const TASK_TEMPLATES = ['Dishes', 'Sweeping', 'Making Beds', 'Trash', 'Bathroom'];

export default function CleaningScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [members, setMembers] = useState<(Member | Child)[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [task, setTask] = useState('');
  const [date, setDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    if (!holidayId) return;
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
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, item.done && styles.cardDone]} onPress={() => toggleDone(item)} onLongPress={() => handleDelete(item.id)}>
            <Text style={styles.check}>{item.done ? '✅' : '⬜'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.taskText, item.done && styles.taskDone]}>{item.task}</Text>
              <Text style={styles.sub}>📅 {item.date} · 👤 {item.assignedTo}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={styles.empty}>{t('noCleaning')}</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('addCleaningTask')}</Text>
            <View style={styles.templateRow}>
              {TASK_TEMPLATES.map(name => (
                <TouchableOpacity key={name} style={styles.templateChip} onPress={() => setTask(name)}>
                  <Text style={styles.templateChipText}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder={t('task')} value={task} onChangeText={setTask} />
            <DatePickerField placeholder={t('date')} value={date} onChange={setDate} />
            <Text style={styles.label}>{t('assignedTo')}:</Text>
            <View style={styles.memberList}>
              {members.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.memberChip, assignedTo === m.name && styles.memberChipSelected]}
                  onPress={() => setAssignedTo(m.name)}
                >
                  <Text style={assignedTo === m.name ? styles.memberChipTextSelected : styles.memberChipText}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.row}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}><Text>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleAdd}><Text style={{ color: '#fff' }}>{t('save')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2 },
  cardDone: { opacity: 0.6 },
  check: { fontSize: 20, marginRight: 12 },
  taskText: { fontSize: 15, color: '#333', fontWeight: '600' },
  taskDone: { textDecorationLine: 'line-through', color: '#aaa' },
  sub: { fontSize: 12, color: '#888', marginTop: 2 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontStyle: 'italic' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2e7d32', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 15 },
  label: { fontSize: 14, color: '#666', marginBottom: 8 },
  templateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  templateChip: { backgroundColor: '#e8f5e9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  templateChipText: { color: '#2e7d32', fontSize: 13, fontWeight: '600' },
  memberList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  memberChip: { borderWidth: 1, borderColor: '#2e7d32', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  memberChipSelected: { backgroundColor: '#2e7d32' },
  memberChipText: { color: '#2e7d32' },
  memberChipTextSelected: { color: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  btnCancel: { padding: 12 },
  btnSave: { backgroundColor: '#2e7d32', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
});
