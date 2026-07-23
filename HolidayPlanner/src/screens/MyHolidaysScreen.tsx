import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { UserHoliday } from '../types';

export default function MyHolidaysScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, holidayId, setHolidayId } = useAuth();
  const [holidays, setHolidays] = useState<UserHoliday[]>([]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'userHolidays', user.uid, 'holidays'), snap => {
      setHolidays(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserHoliday)));
    });
  }, [user]);

  const handleSwitch = (id: string) => {
    setHolidayId(id);
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={holidays}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, item.id === holidayId && styles.activeRow]}
            onPress={() => handleSwitch(item.id)}
          >
            <Text style={styles.name}>{item.holidayName}</Text>
            {item.id === holidayId && <Text style={styles.activeLabel}>Active</Text>}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 12 }}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('HolidaySetup' as never)}>
        <Text style={styles.addButtonText}>{t('createOrJoinAnother')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, elevation: 1 },
  activeRow: { borderWidth: 2, borderColor: '#2e7d32' },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  activeLabel: { color: '#2e7d32', fontSize: 12, fontWeight: '700' },
  addButton: { backgroundColor: '#2e7d32', borderRadius: 8, padding: 16, alignItems: 'center', margin: 12 },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
