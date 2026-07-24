import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Linking, ScrollView, Image } from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Trip, TripStop, Member, Child } from '../types';
import DatePickerField from '../components/DatePickerField';
import { showAlert, showConfirm } from '../utils/alert';
import { geocodeLocation } from '../utils/geocode';
import { getRouteInfo } from '../utils/routing';

type Participant = (Member | Child) & { id: string };

// Free static map image (no API key, works identically on web and native --
// react-native-webview explicitly does not support the web platform, so an
// <Image> avoids that native-only limitation entirely).
function staticMapUrl(stops: TripStop[]): string {
  const lats = stops.map(s => s.lat);
  const lngs = stops.map(s => s.lng);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const markers = stops.map(s => `${s.lat},${s.lng},lightblue1`).join('|');
  const path = stops.length > 1 ? `&path=color:blue|weight:3|${stops.map(s => `${s.lat},${s.lng}`).join('|')}` : '';
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=12&size=400x200&maptype=mapnik&markers=${markers}${path}`;
}

function getTripStops(trip: Trip): TripStop[] {
  if (trip.stops && trip.stops.length > 0) return trip.stops;
  if (trip.lat != null && trip.lng != null) return [{ label: trip.location ?? trip.title, lat: trip.lat, lng: trip.lng }];
  return [];
}

export default function TripsScreen() {
  const { t } = useTranslation();
  const { holidayId } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [minDate, setMinDate] = useState<string | undefined>();
  const [maxDate, setMaxDate] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [detailsTrip, setDetailsTrip] = useState<Trip | null>(null);
  const [rsvpTrip, setRsvpTrip] = useState<Trip | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [stopInputs, setStopInputs] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

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
    setTitle(''); setDate(''); setTime(''); setStopInputs(['']); setNotes('');
    setModalVisible(true);
  };

  const openEditTrip = (trip: Trip) => {
    setDetailsTrip(null);
    setEditingTripId(trip.id);
    setTitle(trip.title);
    setDate(trip.date);
    setTime(trip.time ?? '');
    const existingStops = getTripStops(trip);
    setStopInputs(existingStops.length > 0 ? existingStops.map(s => s.label) : ['']);
    setNotes(trip.notes ?? '');
    setModalVisible(true);
  };

  const updateStopInput = (index: number, value: string) => {
    setStopInputs(prev => prev.map((s, i) => (i === index ? value : s)));
  };

  const addStopInput = () => setStopInputs(prev => [...prev, '']);
  const removeStopInput = (index: number) => setStopInputs(prev => prev.filter((_, i) => i !== index));

  const handleSaveTrip = async () => {
    if (!title || !date) { showAlert('Error', 'Name and date are required'); return; }
    const stopLabels = stopInputs.map(s => s.trim()).filter(Boolean);
    setSaving(true);
    try {
      const geocoded: TripStop[] = [];
      for (const label of stopLabels) {
        const coords = await geocodeLocation(label);
        if (coords) geocoded.push({ label, ...coords });
      }

      const route = geocoded.length >= 2 ? await getRouteInfo(geocoded) : null;

      const data = {
        title, date, time, notes,
        stops: geocoded,
        location: geocoded[0]?.label ?? '',
        lat: geocoded[0]?.lat,
        lng: geocoded[0]?.lng,
        ...(route ? { distanceKm: route.distanceKm, durationMin: route.durationMin } : {}),
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
      try {
        await deleteDoc(doc(db, 'holidays', holidayId!, 'trips', id));
        setDetailsTrip(null);
      }
      catch (e: any) { showAlert('Error', e.message); }
    });
  };

  const openInMaps = (stops: TripStop[]) => {
    if (stops.length === 0) return;
    if (stops.length === 1) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stops[0].label)}`);
    } else {
      const origin = encodeURIComponent(stops[0].label);
      const destination = encodeURIComponent(stops[stops.length - 1].label);
      const waypoints = stops.slice(1, -1).map(s => encodeURIComponent(s.label)).join('|');
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}`);
    }
  };

  const toggleRsvp = async (trip: Trip, participantId: string) => {
    const current = trip.rsvp?.[participantId] ?? false;
    const updated = { ...trip.rsvp, [participantId]: !current };
    try {
      await updateDoc(doc(db, 'holidays', holidayId!, 'trips', trip.id), { rsvp: updated });
      setRsvpTrip({ ...trip, rsvp: updated });
      setDetailsTrip(prev => (prev && prev.id === trip.id ? { ...prev, rsvp: updated } : prev));
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
          <TouchableOpacity style={styles.card} onPress={() => setDetailsTrip(item)}>
            <View style={styles.dateTag}><Text style={styles.dateText}>{item.date}</Text></View>
            <Text style={styles.cardTitle}>🗺️ {item.title}</Text>
            {item.time && <Text style={styles.cardSub}>⏰ {item.time}</Text>}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={styles.empty}>{t('noTrips')}</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add / Edit modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView>
              <Text style={styles.modalTitle}>{editingTripId ? t('edit') : t('addTrip')}</Text>
              <TextInput style={styles.input} placeholder={t('name')} value={title} onChangeText={setTitle} />
              <DatePickerField placeholder={t('date')} value={date} onChange={setDate} minDate={minDate} maxDate={maxDate} />
              <TextInput style={styles.input} placeholder={t('time')} value={time} onChangeText={setTime} />
              <Text style={styles.label}>Stops (like building a route)</Text>
              {stopInputs.map((stop, idx) => (
                <View key={idx} style={styles.stopRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder={idx === 0 ? 'Start' : idx === stopInputs.length - 1 ? 'End' : `Stop ${idx}`}
                    value={stop}
                    onChangeText={v => updateStopInput(idx, v)}
                  />
                  {stopInputs.length > 1 && (
                    <TouchableOpacity onPress={() => removeStopInput(idx)} style={styles.removeStopBtn}>
                      <Text style={styles.removeStopText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity onPress={addStopInput} style={styles.addStopBtn}>
                <Text style={styles.addStopText}>➕ Add Stop</Text>
              </TouchableOpacity>
              <TextInput style={styles.input} placeholder={t('notes')} value={notes} onChangeText={setNotes} multiline />
              <View style={styles.row}>
                <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}><Text>{t('cancel')}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnSave} onPress={handleSaveTrip} disabled={saving}><Text style={{ color: '#fff' }}>{saving ? '...' : t('save')}</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Details modal */}
      <Modal visible={!!detailsTrip} animationType="slide" transparent onRequestClose={() => setDetailsTrip(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView>
              {detailsTrip && (() => {
                const stops = getTripStops(detailsTrip);
                return (
                  <>
                    <Text style={styles.modalTitle}>🗺️ {detailsTrip.title}</Text>
                    <View style={styles.dateTag}><Text style={styles.dateText}>{detailsTrip.date}</Text></View>
                    {detailsTrip.time && <Text style={styles.cardSub}>⏰ {detailsTrip.time}</Text>}
                    {detailsTrip.notes && <Text style={styles.cardSub}>{detailsTrip.notes}</Text>}

                    {stops.length > 0 && (
                      <>
                        <Text style={styles.label}>Stops</Text>
                        {stops.map((s, i) => (
                          <Text key={i} style={styles.stopListItem}>{i + 1}. {s.label}</Text>
                        ))}
                        {(detailsTrip.distanceKm != null || detailsTrip.durationMin != null) && (
                          <Text style={styles.routeInfo}>
                            🚗 {detailsTrip.distanceKm} km · {detailsTrip.durationMin} min
                          </Text>
                        )}
                        <Image source={{ uri: staticMapUrl(stops) }} style={styles.mapPreview} resizeMode="cover" />
                        <TouchableOpacity onPress={() => openInMaps(stops)}>
                          <Text style={styles.mapLink}>📍 Open in Maps</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    <View style={styles.row}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => setRsvpTrip(detailsTrip)}>
                        <Text style={styles.actionText}>👍 {goingCount(detailsTrip)} {t('going')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => openEditTrip(detailsTrip)}>
                        <Text style={styles.editText}>✏️ {t('edit')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(detailsTrip.id)}>
                        <Text style={styles.deleteText}>🗑 {t('delete')}</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.btnCancel} onPress={() => setDetailsTrip(null)}>
                      <Text>{t('cancel')}</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </ScrollView>
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
  mapPreview: { height: 180, borderRadius: 8, marginTop: 8 },
  actionBtn: { paddingVertical: 4 },
  actionText: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  editText: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  deleteText: { fontSize: 12, color: '#c62828', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontStyle: 'italic' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#2e7d32', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '88%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 15 },
  label: { fontSize: 13, color: '#666', marginTop: 8, marginBottom: 8, fontWeight: '600' },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  removeStopBtn: { padding: 8 },
  removeStopText: { fontSize: 16, color: '#c62828' },
  addStopBtn: { paddingVertical: 8, marginBottom: 8 },
  addStopText: { color: '#2e7d32', fontWeight: '600', fontSize: 14 },
  stopListItem: { fontSize: 14, color: '#333', marginBottom: 4 },
  routeInfo: { fontSize: 13, color: '#2e7d32', fontWeight: '700', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 12, alignItems: 'center' },
  btnCancel: { padding: 12 },
  btnSave: { backgroundColor: '#2e7d32', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  rsvpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rsvpName: { fontSize: 15, color: '#333' },
  rsvpGoing: { fontSize: 13, color: '#2e7d32', fontWeight: '700' },
  rsvpNotGoing: { fontSize: 13, color: '#aaa' },
});
