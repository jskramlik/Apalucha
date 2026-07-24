import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Member, Child } from '../types';
import { Screen, Card, Avatar } from '../components/ui';

type Participant = (Member | Child) & { id: string };

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
  const { colors, spacing, radius, typography } = useTheme();
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!holidayId) return;
    let members: Participant[] = [];
    let children: Participant[] = [];

    const unsub1 = onSnapshot(collection(db, 'holidays', holidayId, 'members'), snap => {
      members = snap.docs.map(d => ({ id: d.id, ...d.data() } as Participant));
      setParticipants([...members, ...children].sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0)));
    });
    const unsub2 = onSnapshot(collection(db, 'holidays', holidayId, 'children'), snap => {
      children = snap.docs.map(d => ({ id: d.id, ...d.data() } as Participant));
      setParticipants([...members, ...children].sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0)));
    });

    return () => { unsub1(); unsub2(); };
  }, [holidayId]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Screen>
      <Text style={[typography.title, { color: colors.textPrimary, padding: spacing.xl, paddingBottom: spacing.sm }]}>
        🏆 {t('leaderboard')}
      </Text>
      <FlatList
        data={participants}
        keyExtractor={i => i.id}
        renderItem={({ item, index }) => (
          <Card
            style={[
              styles.row,
              { marginBottom: spacing.sm },
              index === 0 ? { borderColor: '#FFD700', borderWidth: 2 } : {},
            ]}
          >
            <Text style={styles.rank}>{medals[index] ?? `#${index + 1}`}</Text>
            <Avatar name={item.name} photoUrl={item.photoUrl} avatar={item.avatar} size={40} />
            <Text style={[typography.subheading, { color: colors.textPrimary, flex: 1, marginLeft: spacing.md }]}>{item.name}</Text>
            <Text style={[typography.subheading, { color: colors.primary }]}>{item.totalPoints ?? 0} pts</Text>
          </Card>
        )}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rank: { fontSize: 22, width: 36 },
});
