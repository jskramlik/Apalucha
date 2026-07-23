import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Meal, CleaningTask, Holiday } from '../types';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
  const [holiday, setHoliday] = useState<Holiday | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!holidayId) return;
    getDoc(doc(db, 'holidays', holidayId)).then(snap => {
      if (snap.exists()) setHoliday({ id: snap.id, ...snap.data() } as Holiday);
    });

    const unsub1 = onSnapshot(collection(db, 'holidays', holidayId, 'activities'), snap => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity)).filter(a => a.date === today));
    });

    const unsub2 = onSnapshot(doc(db, 'holidays', holidayId, 'meals', today), snap => {
      setMeal(snap.exists() ? (snap.data() as Meal) : null);
    });

    const unsub3 = onSnapshot(collection(db, 'holidays', holidayId, 'cleaning'), snap => {
      setCleaningTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as CleaningTask)).filter(c => c.date === today && !c.done));
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [holidayId, today]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{holiday?.name ?? '🏕️ Apalucha Planner'}</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

      <Section title={t('activities')}>
        {activities.length === 0 ? <Empty text={t('noActivities')} /> :
          activities.map(a => <Item key={a.id} main={a.title} sub={a.time} />)}
      </Section>

      <Section title={t('mealPlan')}>
        {!meal ? <Empty text={t('noMeals')} /> : (
          <>
            {meal.breakfast && <Item main={`🌅 ${t('breakfast')}`} sub={meal.breakfast} />}
            {meal.lunch && <Item main={`☀️ ${t('lunch')}`} sub={meal.lunch} />}
            {meal.dinner && <Item main={`🌙 ${t('dinner')}`} sub={meal.dinner} />}
          </>
        )}
      </Section>

      <Section title={t('cleaning')}>
        {cleaningTasks.length === 0 ? <Empty text={t('noCleaning')} /> :
          cleaningTasks.map(c => <Item key={c.id} main={c.task} sub={c.assignedTo} />)}
      </Section>
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
  date: { fontSize: 14, color: '#666', paddingHorizontal: 20, marginBottom: 8 },
  section: { margin: 12, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
  item: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemMain: { fontSize: 15, color: '#333' },
  itemSub: { fontSize: 13, color: '#888', marginTop: 2 },
  empty: { color: '#aaa', fontStyle: 'italic', fontSize: 14 },
});
