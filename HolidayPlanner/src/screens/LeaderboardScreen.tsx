import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Member, Child } from '../types';

type Participant = (Member | Child) & { id: string };

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
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
    <View style={styles.container}>
      <Text style={styles.title}>🏆 {t('leaderboard')}</Text>
      <FlatList
        data={participants}
        keyExtractor={i => i.id}
        renderItem={({ item, index }) => (
          <View style={[styles.row, index === 0 && styles.first]}>
            <Text style={styles.rank}>{medals[index] ?? `#${index + 1}`}</Text>
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}><Text style={styles.avatarLetter}>{item.name[0]}</Text></View>
            )}
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.points}>{item.totalPoints ?? 0} pts</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32', padding: 20, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1 },
  first: { borderWidth: 2, borderColor: '#ffd700' },
  rank: { fontSize: 22, width: 36 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2e7d32', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarLetter: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  name: { flex: 1, fontSize: 16, color: '#333', fontWeight: '600' },
  points: { fontSize: 16, color: '#2e7d32', fontWeight: '700' },
});
