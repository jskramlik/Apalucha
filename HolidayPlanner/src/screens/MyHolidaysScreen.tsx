import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { UserHoliday } from '../types';
import { Screen, Card, Button } from '../components/ui';

export default function MyHolidaysScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, holidayId, setHolidayId } = useAuth();
  const { colors, spacing, typography } = useTheme();
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
    <Screen>
      <FlatList
        data={holidays}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSwitch(item.id)}>
            <Card style={[styles.row, item.id === holidayId && { borderColor: colors.primary, borderWidth: 2 }]}>
              <Text style={[typography.subheading, { color: colors.textPrimary }]}>{item.holidayName}</Text>
              {item.id === holidayId && <Text style={[typography.small, { color: colors.primary, fontWeight: '700' }]}>Active</Text>}
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: spacing.lg }}
      />
      <Button label={t('createOrJoinAnother')} onPress={() => navigation.navigate('HolidaySetup' as never)} style={{ margin: spacing.lg }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
});
