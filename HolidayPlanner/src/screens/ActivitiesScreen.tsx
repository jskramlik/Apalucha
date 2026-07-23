import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Activity } from '../types';

export default function ActivitiesScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!holidayId) return;
    return onSnapshot(collection(db, 'holidays', holidayId, 'activities'), snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity));
      setActivities(items.sort((a, b) => a.date.localeCompare(b.date)));
    });
  }, [holidayId]);

  const handleAdd = async () => {
    if (!title || !date) return;
    await addDoc(collection(db, 'holidays', holidayId!, 'activities'), { title, date, time, description });
    setTitle(''); setDate(''); setTime(''); setDescription('');
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this activity?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteDoc(doc(db, 'holidays', holidayId!, 'activities', id)) },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onLongPress={() => handleDelete(item.id)}>
            <View style={styles.dateTag}><Text style={styles.dateText}>{item.date}</Text></View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.time && <Text style={styles.cardSub}>⏰ {item.time}</Text>}
            {item.description && <Text style={styles.cardSub}>{item.description}</Text>}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={styles.empty}>{t('noActivities')}</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('addActivity')}</Text>
            <TextInput style={styles.input} placeholder={t('name')} value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder={`${t('date')} (YYYY-MM-DD)`} value={date} onChangeText={setDate} />
            <TextInput style={styles.input} placeholder={t('time')} value={time} onChangeText={setTime} />
            <TextInput style={styles.input} placeholder={t('description')} value={description} onChangeText={setDescription} />
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  dateTag: { backgroundColor: '#e8f5e9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 6 },
  dateText: { color: '#2e7d32', fontSize: 12, fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  cardSub: { fontSize: 13, color: '#666', marginTop: 2 },
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
});
