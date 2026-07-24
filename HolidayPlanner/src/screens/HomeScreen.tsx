import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { collection, onSnapshot, doc, getDoc, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Trip, Meal, CleaningTask, Holiday, Competition, ScheduleEntry } from '../types';
import { showAlert } from '../utils/alert';

function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
  const [holiday, setHoliday] = useState<Holiday | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [tripsOnDate, setTripsOnDate] = useState<Trip[]>([]);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTime, setPickerTime] = useState('');

  useEffect(() => {
    if (!holidayId) return;
    getDoc(doc(db, 'holidays', holidayId)).then(snap => {
      if (!snap.exists()) return;
      const data = { id: snap.id, ...snap.data() } as Holiday;
      setHoliday(data);
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today < data.startDate ? data.startDate : today > data.endDate ? data.endDate : today);
    });
  }, [holidayId]);

  useEffect(() => {
    if (!holidayId || !selectedDate) return;

    const unsubTrips = onSnapshot(
      query(collection(db, 'holidays', holidayId, 'trips'), where('date', '==', selectedDate)),
      snap => setTripsOnDate(snap.docs.map(d => ({ id: d.id, ...d.data() } as Trip)))
    );
    const unsubMeal = onSnapshot(doc(db, 'holidays', holidayId, 'meals', selectedDate), snap => {
      setMeal(snap.exists() ? (snap.data() as Meal) : null);
    });
    const unsubCompetitions = onSnapshot(collection(db, 'holidays', holidayId, 'competitions'), snap => {
      setCompetitions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Competition)));
    });
    const unsubCleaning = onSnapshot(
      query(collection(db, 'holidays', holidayId, 'cleaning'), where('date', '==', selectedDate)),
      snap => setCleaningTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as CleaningTask)).filter(c => !c.done))
    );
    const unsubSchedule = onSnapshot(
      query(collection(db, 'holidays', holidayId, 'schedule'), where('date', '==', selectedDate)),
      snap => setScheduleEntries(
        snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleEntry)).sort((a, b) => {
          if (a.time && b.time) return a.time.localeCompare(b.time);
          if (a.time) return -1;
          if (b.time) return 1;
          return a.order - b.order;
        })
      )
    );

    return () => { unsubTrips(); unsubMeal(); unsubCompetitions(); unsubCleaning(); unsubSchedule(); };
  }, [holidayId, selectedDate]);

  const canGoPrev = holiday ? selectedDate > holiday.startDate : false;
  const canGoNext = holiday ? selectedDate < holiday.endDate : false;

  const mealPickerItems = useMemo(() => {
    if (!meal) return [];
    const items: { label: string; refId: string }[] = [];
    if (meal.breakfast) items.push({ label: `🌅 ${t('breakfast')}: ${meal.breakfast}`, refId: selectedDate });
    if (meal.lunch) items.push({ label: `☀️ ${t('lunch')}: ${meal.lunch}`, refId: selectedDate });
    if (meal.dinner) items.push({ label: `🌙 ${t('dinner')}: ${meal.dinner}`, refId: selectedDate });
    return items;
  }, [meal, selectedDate, t]);

  const openPicker = () => {
    setPickerTime('');
    setPickerVisible(true);
  };

  const handlePick = async (refType: ScheduleEntry['refType'], refId: string, label: string) => {
    if (!holidayId) return;
    try {
      const order = scheduleEntries.length;
      await addDoc(collection(db, 'holidays', holidayId, 'schedule'), {
        date: selectedDate, order, refType, refId, label,
        ...(pickerTime ? { time: pickerTime } : {}),
      });
      setPickerVisible(false);
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };

  const handleRemoveEntry = async (id: string) => {
    if (!holidayId) return;
    try {
      await deleteDoc(doc(db, 'holidays', holidayId, 'schedule', id));
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{holiday?.name ?? '🏕️ Apalucha Planner'}</Text>

      <View style={styles.dayNav}>
        <TouchableOpacity
          style={styles.navButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => { if (canGoPrev) setSelectedDate(addDays(selectedDate, -1)); }}
        >
          <Text style={[styles.navArrow, !canGoPrev && styles.navArrowDisabled]}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.date}>{selectedDate ? formatDisplayDate(selectedDate) : ''}</Text>
        <TouchableOpacity
          style={styles.navButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => { if (canGoNext) setSelectedDate(addDays(selectedDate, 1)); }}
        >
          <Text style={[styles.navArrow, !canGoNext && styles.navArrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.sectionTitle}>{t('schedule')}</Text>
          <TouchableOpacity onPress={openPicker}>
            <Text style={styles.addToScheduleText}>➕ {t('addToSchedule')}</Text>
          </TouchableOpacity>
        </View>
        {scheduleEntries.length === 0 ? <Empty text={t('noSchedule')} /> : scheduleEntries.map(entry => (
          <View key={entry.id} style={styles.scheduleRow}>
            {entry.time ? <Text style={styles.scheduleTime}>{entry.time}</Text> : null}
            <Text style={styles.scheduleLabel}>{entry.label}</Text>
            <TouchableOpacity onPress={() => handleRemoveEntry(entry.id)}>
              <Text style={styles.removeEntryText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Section title={t('cleaning')}>
        {cleaningTasks.length === 0 ? <Empty text={t('noCleaning')} /> :
          cleaningTasks.map(c => <Item key={c.id} main={c.task} sub={c.assignedTo} />)}
      </Section>

      <Modal visible={pickerVisible} animationType="slide" transparent onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('selectItem')}</Text>
            <TextInput
              style={styles.timeInput}
              placeholder={`${t('time')} (e.g. 14:30)`}
              value={pickerTime}
              onChangeText={setPickerTime}
            />
            <ScrollView style={{ maxHeight: 400 }}>
              {tripsOnDate.length > 0 && (
                <>
                  <Text style={styles.pickerGroupLabel}>{t('trips')}</Text>
                  {tripsOnDate.map(trip => (
                    <TouchableOpacity key={trip.id} style={styles.pickerRow} onPress={() => handlePick('trip', trip.id, `🗺️ ${trip.title}`)}>
                      <Text style={styles.pickerRowText}>🗺️ {trip.title}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              {mealPickerItems.length > 0 && (
                <>
                  <Text style={styles.pickerGroupLabel}>{t('mealPlan')}</Text>
                  {mealPickerItems.map(item => (
                    <TouchableOpacity key={item.label} style={styles.pickerRow} onPress={() => handlePick('meal', item.refId, item.label)}>
                      <Text style={styles.pickerRowText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              {competitions.length > 0 && (
                <>
                  <Text style={styles.pickerGroupLabel}>{t('competitions')}</Text>
                  {competitions.map(comp => (
                    <TouchableOpacity key={comp.id} style={styles.pickerRow} onPress={() => handlePick('competition', comp.id, `🏆 ${comp.name}`)}>
                      <Text style={styles.pickerRowText}>🏆 {comp.name}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              {tripsOnDate.length === 0 && mealPickerItems.length === 0 && competitions.length === 0 && (
                <Text style={styles.empty}>Nothing available to add yet</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.btnCancel} onPress={() => setPickerVisible(false)}>
              <Text>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Item({ main, sub }: { main: string; sub?: string }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemMain}>{main}</Text>
      {sub && <Text style={styles.itemSub}>{sub}</Text>}
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32', padding: 20, paddingBottom: 4 },
  dayNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 20, marginBottom: 8 },
  navButton: { padding: 4 },
  navArrow: { fontSize: 28, color: '#2e7d32', fontWeight: '700', paddingHorizontal: 12 },
  navArrowDisabled: { color: '#ccc' },
  date: { fontSize: 15, color: '#666', textAlign: 'center', flex: 1 },
  section: { margin: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addToScheduleText: { fontSize: 13, color: '#2e7d32', fontWeight: '600' },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  scheduleTime: { fontSize: 13, color: '#2e7d32', fontWeight: '700', width: 48 },
  scheduleLabel: { fontSize: 15, color: '#333', flex: 1 },
  removeEntryText: { fontSize: 16, color: '#c62828', paddingHorizontal: 8 },
  item: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemMain: { fontSize: 15, color: '#333' },
  itemSub: { fontSize: 13, color: '#888', marginTop: 2 },
  empty: { color: '#aaa', fontStyle: 'italic', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#333' },
  timeInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 15 },
  pickerGroupLabel: { fontSize: 12, color: '#888', fontWeight: '700', marginTop: 12, marginBottom: 6, textTransform: 'uppercase' },
  pickerRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  pickerRowText: { fontSize: 15, color: '#333' },
  btnCancel: { padding: 12, alignItems: 'center', marginTop: 8 },
});
