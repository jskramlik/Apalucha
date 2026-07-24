import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Linking, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Trip, Member, Child } from '../types';
import DatePickerField from '../components/DatePickerField';
import { showAlert, showConfirm } from '../utils/alert';
import { geocodeLocation } from '../utils/geocode';

type Participant = (Member | Child) & { id: string };

function mapEmbedUrl(lat: number, lng: number): string {
  const delta = 0.01;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat},${lng}`;
}

export default function TripsScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [rsvpTrip, setRsvpTrip] = useState<Trip | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!holidayId) return;
    let membersList: Participant[] = [];
    let childrenList: Participant[] = [];

    const unsubTrips = onSnapshot(collection(db, 'holidays', holidayId, 'trips'), snap => {
      setTrips(snap.docs.map(d => ({ id: d.id, ...d.data() } as Trip)).sort((a, b) => a.date.localeCompare(b.date)));
    });
    const unsubMembers = onSnapshot(collection(db, 'holidays', holidayId, 'members'), snap => {
      membersList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Participant));
      setParticipants([...membersList, ...childrenList]);
    });
    const unsubChildren = onSnapshot(collection(db, 'holidays', holidayId, 'children'), snap => {
      childrenList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Participant));
      setParticipants([...membersList, ...childrenList]);
    });
    return () => { unsubTrips(); unsubMembers(); unsubChildren(); };
  }, [holidayId]);

  const openAdd = () => {
    setEditingTripId(null);
    setTitle(''); setDate(''); setTime(''); setLocation(''); setNotes('');
    setModalVisible(true);
  };

  const openEditTrip = (trip: Trip) => {
    setEditingTripId(trip.id);
    setTitle(trip.title);
    setDate(trip.date);
    setTime(trip.time ?? '');
    setLocation(trip.location ?? '');
    setNotes(trip.notes ?? '');
    setModalVisible(true);
  };

  const handleSaveTrip = async () => {
    if (!title || !date) { showAlert('Error', 'Name and date are required'); return; }
    setSaving(true);
    try {
      const existing = editingTripId ? trips.find(tr => tr.id === editingTripId) : undefined;
      let coords: { lat: number; lng: number } | null = null;
      if (location && location !== existing?.location) {
        coords = await geocodeLocation(location);
      } else if (existing) {
        coords = existing.lat != null && existing.lng != null ? { lat: existing.lat, lng: existing.lng } : null;
      }

      const data = {
        title, date, time, location, notes,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      };

      if (editingTripId) {
        await updateDoc(doc(db, 'holidays', holidayId!, 'trips', editingTripId), data);
      } else {
        await addDoc(collection(db, 'holidays', holidayId!, 'trips'), { ...data, rsvp: {} });
      }
      setModalVisible(false);
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(t('delete'), 'Remove this trip?', async () => {
      try { await deleteDoc(doc(db, 'holidays', holidayId!, 'trips', id)); }
      catch (e: any) { showAlert('Error', e.message); }
    });
  };

  const openMap = (location: string) => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`);
  };

  const toggleRsvp = async (trip: Trip, participantId: string) => {
    const current = trip.rsvp?.[participantId] ?? false;
    const updated = { ...trip.rsvp, [participantId]: !current };
    try {
      await updateDoc(doc(db, 'holidays', holidayId!, 'trips', trip.id), { rsvp: updated });
      setRsvpTrip({ ...trip, rsvp: updated });
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };

  const goingCount = (trip: Trip) => Object.values(trip.rsvp ?? {}).filter(Boolean).length;

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => openEditTrip(item)}>
              <View style={styles.dateTag}><Text style={styles.dateText}>{item.date}</Text></View>
              <Text style={styles.cardTitle}>🗺️ {item.title}</Text>
              {item.time && <Text style={styles.cardSub}>⏰ {item.time}</Text>}
              {item.notes && <Text style={styles.cardSub}>{item.notes}</Text>}
            </TouchableOpacity>
            {item.location && (
              <>
                <TouchableOpacity onPress={() => openMap(item.location!)}>
                  <Text style={styles.mapLink}>📍 {item.location}</Text>
                </TouchableOpacity>
                {item.lat != null && item.lng != null && (
                  <View style={styles.mapPreview}>
                    <WebView source={{ uri: mapEmbedUrl(item.lat, item.lng) }} style={{ flex: 1 }} />
                  </View>
                )}
              </>
            )}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setRsvpTrip(item)}>
                <Text style={styles.actionText}>👍 {goingCount(item)} {t('going')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openEditTrip(item)}>
                <Text style={styles.editText}>✏️ {t('edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>🗑 {t('delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={styles.empty}>{t('noTrips')}</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editingTripId ? t('edit') : t('addTrip')}</Text>
            <TextInput style={styles.input} placeholder={t('name')} value={title} onChangeText={setTitle} />
            <DatePickerField placeholder={t('date')} value={date} onChange={setDate} />
            <TextInput style={styles.input} placeholder={t('time')} value={time} onChangeText={setTime} />
            <TextInput style={styles.input} placeholder={t('location')} value={location} onChangeText={setLocation} />
            <TextInput style={styles.input} placeholder={t('notes')} value={notes} onChangeText={setNotes} multiline />
            <View style={styles.row}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}><Text>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSaveTrip} disabled={saving}><Text style={{ color: '#fff' }}>{saving ? '...' : t('save')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!rsvpTrip} animationType="slide" transparent onRequestClose={() => setRsvpTrip(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('rsvp')}: {rsvpTrip?.title}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {participants.map(p => {
                const going = rsvpTrip?.rsvp?.[p.id] ?? false;
                return (
                  <TouchableOpacity key={p.id} style={styles.rsvpRow} onPress={() => rsvpTrip && toggleRsvp(rsvpTrip, p.id)}>
                    <Text style={styles.rsvpName}>{p.name}</Text>
                    <Text style={going ? styles.rsvpGoing : styles.rsvpNotGoing}>{going ? `✓ ${t('going')}` : t('notGoing')}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.row}>
              <TouchableOpacity style={styles.btnSave} onPress={() => setRsvpTrip(null)}><Text style={{ color: '#fff' }}>{t('save')}</Text></TouchableOpacity>
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
  mapLink: { fontSize: 13, color: '#1a73e8', marginTop: 6, textDecorationLine: 'underline' },
  mapPreview: { height: 140, borderRadius: 8, overflow: 'hidden', marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  actionBtn: { paddingVertical: 4 },
  actionText: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  editText: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  deleteText: { fontSize: 12, color: '#c62828', fontWeight: '600' },
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
  rsvpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rsvpName: { fontSize: 15, color: '#333' },
  rsvpGoing: { fontSize: 13, color: '#2e7d32', fontWeight: '700' },
  rsvpNotGoing: { fontSize: 13, color: '#aaa' },
});
