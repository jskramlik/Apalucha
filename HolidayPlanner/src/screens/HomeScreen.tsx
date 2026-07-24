import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { collection, onSnapshot, doc, getDoc, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Trip, Meal, CleaningTask, Holiday, Competition, ScheduleEntry } from '../types';
import { showAlert } from '../utils/alert';
import { Screen, Card, Button, EmptyState } from '../components/ui';
import DatePickerField from '../components/DatePickerField';
import TimePickerField from '../components/TimePickerField';

function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  if (isNaN(d.getTime())) return iso;
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
  const { colors, spacing, radius, typography } = useTheme();
  const navigation = useNavigation<any>();
  const [holiday, setHoliday] = useState<Holiday | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [tripsOnDate, setTripsOnDate] = useState<Trip[]>([]);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTimeFrom, setPickerTimeFrom] = useState('');
  const [pickerTimeTo, setPickerTimeTo] = useState('');

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
          if (a.timeFrom && b.timeFrom) return a.timeFrom.localeCompare(b.timeFrom);
          if (a.timeFrom) return -1;
          if (b.timeFrom) return 1;
          return a.order - b.order;
        })
      )
    );

    return () => { unsubTrips(); unsubMeal(); unsubCompetitions(); unsubCleaning(); unsubSchedule(); };
  }, [holidayId, selectedDate]);

  const canGoPrev = holiday ? selectedDate > holiday.startDate : false;
  const canGoNext = holiday ? selectedDate < holiday.endDate : false;

  const goPrev = () => {
    try {
      if (canGoPrev) setSelectedDate(prev => addDays(prev, -1));
    } catch (e: any) {
      showAlert('Error', e.message ?? 'Could not go to the previous day');
    }
  };

  const goNext = () => {
    try {
      if (canGoNext) setSelectedDate(prev => addDays(prev, 1));
    } catch (e: any) {
      showAlert('Error', e.message ?? 'Could not go to the next day');
    }
  };

  const mealPickerItems = useMemo(() => {
    if (!meal) return [];
    const items: { label: string; refId: string }[] = [];
    if (meal.breakfast) items.push({ label: `🌅 ${t('breakfast')}: ${meal.breakfast}`, refId: selectedDate });
    if (meal.lunch) items.push({ label: `☀️ ${t('lunch')}: ${meal.lunch}`, refId: selectedDate });
    if (meal.dinner) items.push({ label: `🌙 ${t('dinner')}: ${meal.dinner}`, refId: selectedDate });
    return items;
  }, [meal, selectedDate, t]);

  const openPicker = () => {
    setPickerTimeFrom('');
    setPickerTimeTo('');
    setPickerVisible(true);
  };

  const handlePick = async (refType: ScheduleEntry['refType'], refId: string, label: string) => {
    if (!holidayId) return;
    try {
      const order = scheduleEntries.length;
      await addDoc(collection(db, 'holidays', holidayId, 'schedule'), {
        date: selectedDate, order, refType, refId, label,
        ...(pickerTimeFrom ? { timeFrom: pickerTimeFrom } : {}),
        ...(pickerTimeTo ? { timeTo: pickerTimeTo } : {}),
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

  const openEntrySource = (entry: ScheduleEntry) => {
    if (entry.refType === 'trip') navigation.navigate('Trips', { openTripId: entry.refId });
    else if (entry.refType === 'meal') navigation.navigate('Meals', { openMealDate: entry.refId });
    else if (entry.refType === 'competition') navigation.navigate('Competitions', { openCompId: entry.refId });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <Text style={[typography.title, { color: colors.textPrimary, padding: spacing.xl, paddingBottom: spacing.xs }]}>
          {holiday?.name ?? '🏕️ Apalucha Planner'}
        </Text>

        <View style={styles.dayNav}>
          <Pressable
            style={({ pressed }) => [styles.navButton, pressed && canGoPrev && { backgroundColor: colors.surfaceElevated }]}
            onPress={goPrev}
          >
            <Text style={[styles.navArrow, { color: canGoPrev ? colors.primary : colors.textMuted }]}>‹</Text>
          </Pressable>
          {holiday ? (
            <DatePickerField
              placeholder="Select date"
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={holiday.startDate}
              maxDate={holiday.endDate}
              style={styles.dateField}
            />
          ) : (
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', flex: 1 }]} />
          )}
          <Pressable
            style={({ pressed }) => [styles.navButton, pressed && canGoNext && { backgroundColor: colors.surfaceElevated }]}
            onPress={goNext}
          >
            <Text style={[styles.navArrow, { color: canGoNext ? colors.primary : colors.textMuted }]}>›</Text>
          </Pressable>
        </View>

        <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.sm }}>
          <View style={styles.scheduleHeader}>
            <Text style={[typography.heading, { color: colors.textPrimary }]}>{t('schedule')}</Text>
            <TouchableOpacity onPress={openPicker}>
              <Text style={[typography.caption, { color: colors.primary }]}>➕ {t('addToSchedule')}</Text>
            </TouchableOpacity>
          </View>
          {scheduleEntries.length === 0 ? <EmptyState icon="calendar-outline" text={t('noSchedule')} /> : scheduleEntries.map(entry => (
            <View key={entry.id} style={[styles.scheduleRow, { borderBottomColor: colors.border }]}>
              <TouchableOpacity style={styles.scheduleRowMain} onPress={() => openEntrySource(entry)}>
                {entry.timeFrom ? (
                  <Text style={[typography.caption, { color: colors.primary, width: 90 }]}>
                    {entry.timeFrom}{entry.timeTo ? `–${entry.timeTo}` : ''}
                  </Text>
                ) : null}
                <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>{entry.label}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRemoveEntry(entry.id)}>
                <Text style={{ fontSize: 16, color: colors.error, paddingHorizontal: spacing.sm }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>

        <Card style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}>
          <Text style={[typography.heading, { color: colors.textPrimary, marginBottom: spacing.md }]}>{t('cleaning')}</Text>
          {cleaningTasks.length === 0 ? <EmptyState icon="brush-outline" text={t('noCleaning')} /> :
            cleaningTasks.map(c => (
              <View key={c.id} style={[styles.item, { borderBottomColor: colors.border }]}>
                <Text style={[typography.body, { color: colors.textPrimary }]}>{c.task}</Text>
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>{c.assignedTo}</Text>
              </View>
            ))}
        </Card>

        {pickerVisible && (
          <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: colors.overlay }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPickerVisible(false)} />
            <View style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <Text style={[typography.heading, { color: colors.textPrimary, marginBottom: spacing.lg }]}>{t('selectItem')}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TimePickerField style={{ flex: 1 }} placeholder="From" value={pickerTimeFrom} onChange={setPickerTimeFrom} />
                <TimePickerField style={{ flex: 1 }} placeholder="To" value={pickerTimeTo} onChange={setPickerTimeTo} />
              </View>
              <ScrollView style={{ maxHeight: 360 }}>
                {tripsOnDate.length > 0 && (
                  <>
                    <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.sm, textTransform: 'uppercase' }]}>{t('trips')}</Text>
                    {tripsOnDate.map(trip => (
                      <TouchableOpacity key={trip.id} style={[styles.pickerRow, { borderBottomColor: colors.border }]} onPress={() => handlePick('trip', trip.id, `🗺️ ${trip.title}`)}>
                        <Text style={[typography.body, { color: colors.textPrimary }]}>🗺️ {trip.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {mealPickerItems.length > 0 && (
                  <>
                    <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.sm, textTransform: 'uppercase' }]}>{t('mealPlan')}</Text>
                    {mealPickerItems.map(item => (
                      <TouchableOpacity key={item.label} style={[styles.pickerRow, { borderBottomColor: colors.border }]} onPress={() => handlePick('meal', item.refId, item.label)}>
                        <Text style={[typography.body, { color: colors.textPrimary }]}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {competitions.length > 0 && (
                  <>
                    <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.sm, textTransform: 'uppercase' }]}>{t('competitions')}</Text>
                    {competitions.map(comp => (
                      <TouchableOpacity key={comp.id} style={[styles.pickerRow, { borderBottomColor: colors.border }]} onPress={() => handlePick('competition', comp.id, `🏆 ${comp.name}`)}>
                        <Text style={[typography.body, { color: colors.textPrimary }]}>🏆 {comp.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {tripsOnDate.length === 0 && mealPickerItems.length === 0 && competitions.length === 0 && (
                  <EmptyState text="Nothing available to add yet" />
                )}
              </ScrollView>
              <Button label={t('cancel')} variant="ghost" onPress={() => setPickerVisible(false)} style={{ marginTop: spacing.md }} />
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dayNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 4 },
  navButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  navArrow: { fontSize: 28, fontWeight: '700' },
  dateField: { flex: 1, marginBottom: 0, alignItems: 'center' },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  scheduleRowMain: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  item: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  overlay: { justifyContent: 'flex-end' },
  sheet: { padding: 24, maxHeight: '85%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  pickerRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
});
