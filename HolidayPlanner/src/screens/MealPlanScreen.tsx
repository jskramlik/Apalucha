import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { doc, setDoc, deleteDoc, onSnapshot, collection, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Meal, Member, Child } from '../types';
import DatePickerField from '../components/DatePickerField';
import MemberPicker from '../components/MemberPicker';
import { showAlert, showConfirm } from '../utils/alert';
import { Screen, Card, TextField, Button, EmptyState, BottomSheetModal } from '../components/ui';

type Participant = (Member | Child) & { id: string };

export default function MealPlanScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
  const { colors, spacing, radius, typography } = useTheme();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [minDate, setMinDate] = useState<string | undefined>();
  const [maxDate, setMaxDate] = useState<string | undefined>();
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
    getDoc(doc(db, 'holidays', holidayId)).then(snap => {
      if (snap.exists()) {
        setMinDate(snap.data().startDate);
        setMaxDate(snap.data().endDate);
      }
    });

    let membersList: Participant[] = [];
    let childrenList: Participant[] = [];

    const unsubMeals = onSnapshot(collection(db, 'holidays', holidayId, 'meals'), snap => {
      setMeals(snap.docs.map(d => ({ date: d.id, ...d.data() } as Meal)).sort((a, b) => a.date.localeCompare(b.date)));
    });
    const unsubMembers = onSnapshot(collection(db, 'holidays', holidayId, 'members'), snap => {
      membersList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Participant));
      setParticipants([...membersList, ...childrenList]);
    });
    const unsubChildren = onSnapshot(collection(db, 'holidays', holidayId, 'children'), snap => {
      childrenList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Participant));
      setParticipants([...membersList, ...childrenList]);
    });
    return () => { unsubMeals(); unsubMembers(); unsubChildren(); };
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
    if (!selectedDate) { showAlert('Error', 'Date is required'); return; }
    if (breakfast && !breakfastCook) { showAlert('Error', 'Please select a cook for breakfast'); return; }
    if (lunch && !lunchCook) { showAlert('Error', 'Please select a cook for lunch'); return; }
    if (dinner && !dinnerCook) { showAlert('Error', 'Please select a cook for dinner'); return; }
    try {
      await setDoc(doc(db, 'holidays', holidayId!, 'meals', selectedDate), {
        breakfast, breakfastCook, lunch, lunchCook, dinner, dinnerCook,
      });
      setModalVisible(false);
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };

  const handleDelete = () => {
    showConfirm(t('delete'), 'Remove this day?', async () => {
      try {
        await deleteDoc(doc(db, 'holidays', holidayId!, 'meals', selectedDate));
        setModalVisible(false);
      } catch (e: any) {
        showAlert('Error', e.message);
      }
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}>
        {meals.length === 0 && <EmptyState icon="restaurant-outline" text={t('noMeals')} />}
        {meals.map(m => (
          <TouchableOpacity key={m.date} onPress={() => openEdit(m)}>
            <Card style={{ marginBottom: spacing.md }}>
              <View style={[styles.dateTag, { backgroundColor: colors.secondary + '22', borderRadius: radius.sm }]}>
                <Text style={[typography.small, { color: colors.secondary }]}>{m.date}</Text>
              </View>
              {m.breakfast && (
                <Text style={[typography.body, { color: colors.textPrimary, marginBottom: 2 }]}>
                  🌅 {m.breakfast} {m.breakfastCook && <Text style={[typography.small, { color: colors.textMuted }]}>· 👨‍🍳 {m.breakfastCook}</Text>}
                </Text>
              )}
              {m.lunch && (
                <Text style={[typography.body, { color: colors.textPrimary, marginBottom: 2 }]}>
                  ☀️ {m.lunch} {m.lunchCook && <Text style={[typography.small, { color: colors.textMuted }]}>· 👨‍🍳 {m.lunchCook}</Text>}
                </Text>
              )}
              {m.dinner && (
                <Text style={[typography.body, { color: colors.textPrimary }]}>
                  🌙 {m.dinner} {m.dinnerCook && <Text style={[typography.small, { color: colors.textMuted }]}>· 👨‍🍳 {m.dinnerCook}</Text>}
                </Text>
              )}
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => openEdit()}>
        <Text style={[styles.fabText, { color: colors.primaryText }]}>+</Text>
      </TouchableOpacity>

      <BottomSheetModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <ScrollView>
          <Text style={[typography.heading, { color: colors.textPrimary, marginBottom: spacing.lg }]}>{t('addMeal')}</Text>
          <DatePickerField placeholder={t('date')} value={selectedDate} onChange={setSelectedDate} minDate={minDate} maxDate={maxDate} />
          <TextField placeholder={t('breakfast')} value={breakfast} onChangeText={setBreakfast} />
          <MemberPicker label={t('breakfastCook')} people={participants} value={breakfastCook} onChange={setBreakfastCook} />
          <TextField placeholder={t('lunch')} value={lunch} onChangeText={setLunch} />
          <MemberPicker label={t('lunchCook')} people={participants} value={lunchCook} onChange={setLunchCook} />
          <TextField placeholder={t('dinner')} value={dinner} onChangeText={setDinner} />
          <MemberPicker label={t('dinnerCook')} people={participants} value={dinnerCook} onChange={setDinnerCook} />
          <View style={styles.btnRow}>
            {isEditing && <Button label={t('removeDay')} variant="ghost" onPress={handleDelete} />}
            <Button label={t('cancel')} variant="ghost" onPress={() => setModalVisible(false)} />
            <Button label={t('save')} onPress={handleSave} />
          </View>
        </ScrollView>
      </BottomSheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dateTag: { paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 8 },
  fab: { position: 'absolute', bottom: 100, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { fontSize: 28, lineHeight: 32 },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8, flexWrap: 'wrap' },
});
