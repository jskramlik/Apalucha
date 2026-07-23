import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { doc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Meal } from '../types';
import DatePickerField from '../components/DatePickerField';

export default function MealPlanScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [breakfast, setBreakfast] = useState('');
  const [breakfastCook, setBreakfastCook] = useState('');
  const [lunch, setLunch] = useState('');
  const [lunchCook, setLunchCook] = useState('');
  const [dinner, setDinner] = useState('');
  const [dinnerCook, setDinnerCook] = useState('');

  useEffect(() => {
    if (!holidayId) return;
    return onSnapshot(collection(db, 'holidays', holidayId, 'meals'), snap => {
      setMeals(snap.docs.map(d => ({ date: d.id, ...d.data() } as Meal)).sort((a, b) => a.date.localeCompare(b.date)));
    });
  }, [holidayId]);

  const openEdit = (meal?: Meal) => {
    setIsEditing(!!meal);
    setSelectedDate(meal?.date ?? '');
    setBreakfast(meal?.breakfast ?? '');
    setBreakfastCook(meal?.breakfastCook ?? '');
    setLunch(meal?.lunch ?? '');
    setLunchCook(meal?.lunchCook ?? '');
    setDinner(meal?.dinner ?? '');
    setDinnerCook(meal?.dinnerCook ?? '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedDate) { Alert.alert('Error', 'Date is required'); return; }
    try {
      await setDoc(doc(db, 'holidays', holidayId!, 'meals', selectedDate), {
        breakfast, breakfastCook, lunch, lunchCook, dinner, dinnerCook,
      });
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete', 'Remove this day?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'holidays', holidayId!, 'meals', selectedDate));
          setModalVisible(false);
        } catch (e: any) {
          Alert.alert('Error', e.message);
        }
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {meals.length === 0 && <Text style={styles.empty}>{t('noMeals')}</Text>}
        {meals.map(m => (
          <TouchableOpacity key={m.date} style={styles.card} onPress={() => openEdit(m)}>
            <View style={styles.dateTag}><Text style={styles.dateText}>{m.date}</Text></View>
            {m.breakfast && <Text style={styles.mealRow}>🌅 {m.breakfast} {m.breakfastCook && <Text style={styles.cookInline}>· 👨‍🍳 {m.breakfastCook}</Text>}</Text>}
            {m.lunch && <Text style={styles.mealRow}>☀️ {m.lunch} {m.lunchCook && <Text style={styles.cookInline}>· 👨‍🍳 {m.lunchCook}</Text>}</Text>}
            {m.dinner && <Text style={styles.mealRow}>🌙 {m.dinner} {m.dinnerCook && <Text style={styles.cookInline}>· 👨‍🍳 {m.dinnerCook}</Text>}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => openEdit()}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('addMeal')}</Text>
            <DatePickerField placeholder={t('date')} value={selectedDate} onChange={setSelectedDate} />
            <TextInput style={styles.input} placeholder={t('breakfast')} value={breakfast} onChangeText={setBreakfast} />
            <TextInput style={styles.input} placeholder={t('breakfastCook')} value={breakfastCook} onChangeText={setBreakfastCook} />
            <TextInput style={styles.input} placeholder={t('lunch')} value={lunch} onChangeText={setLunch} />
            <TextInput style={styles.input} placeholder={t('lunchCook')} value={lunchCook} onChangeText={setLunchCook} />
            <TextInput style={styles.input} placeholder={t('dinner')} value={dinner} onChangeText={setDinner} />
            <TextInput style={styles.input} placeholder={t('dinnerCook')} value={dinnerCook} onChangeText={setDinnerCook} />
            <View style={styles.btnRow}>
              {isEditing && (
                <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}><Text style={{ color: '#c62828' }}>{t('removeDay')}</Text></TouchableOpacity>
              )}
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}><Text>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSave}><Text style={{ color: '#fff' }}>{t('save')}</Text></TouchableOpacity>
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
  dateTag: { backgroundColor: '#e8f5e9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 8 },
  dateText: { color: '#2e7d32', fontSize: 12, fontWeight: '600' },
  mealRow: { fontSize: 15, color: '#333', marginBottom: 2 },
  cookInline: { fontSize: 12, color: '#888' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontStyle: 'italic' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2e7d32', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 15 },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  btnCancel: { padding: 12 },
  btnDelete: { padding: 12 },
  btnSave: { backgroundColor: '#2e7d32', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
});
