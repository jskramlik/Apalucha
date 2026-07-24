import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ScrollView, Image } from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Trip, TripStop, Member, Child } from '../types';
import DatePickerField from '../components/DatePickerField';
import TimePickerField from '../components/TimePickerField';
import { showAlert, showConfirm } from '../utils/alert';
import { geocodeLocation } from '../utils/geocode';
import { getRouteInfo } from '../utils/routing';
import { Screen, Card, TextField, Button, EmptyState, BottomSheetModal } from '../components/ui';

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
  const { colors, spacing, radius, typography } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
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

  useEffect(() => {
    const openTripId = route.params?.openTripId;
    if (!openTripId) return;
    const trip = trips.find(tr => tr.id === openTripId);
    if (trip) {
      setDetailsTrip(trip);
      navigation.setParams({ openTripId: undefined });
    }
  }, [route.params?.openTripId, trips, navigation]);

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
      for (let i = 0; i < stopLabels.length; i++) {
        // Nominatim's usage policy asks for max ~1 request/sec between calls.
        if (i > 0) await new Promise(resolve => setTimeout(resolve, 1100));
        const coords = await geocodeLocation(stopLabels[i]);
        if (coords) geocoded.push({ label: stopLabels[i], ...coords });
      }

      const routeInfo = geocoded.length >= 2 ? await getRouteInfo(geocoded) : null;

      const data = {
        title, date, time, notes,
        stops: geocoded,
        location: geocoded[0]?.label ?? '',
        lat: geocoded[0]?.lat,
        lng: geocoded[0]?.lng,
        ...(routeInfo ? { distanceKm: routeInfo.distanceKm, durationMin: routeInfo.durationMin } : {}),
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
    <Screen>
      <FlatList
        data={trips}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setDetailsTrip(item)}>
            <Card style={{ marginBottom: spacing.md }}>
              <View style={[styles.dateTag, { backgroundColor: colors.secondary + '22', borderRadius: radius.sm }]}>
                <Text style={[typography.small, { color: colors.secondary }]}>{item.date}</Text>
              </View>
              <Text style={[typography.subheading, { color: colors.textPrimary }]}>🗺️ {item.title}</Text>
              {item.time && <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>⏰ {item.time}</Text>}
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
        ListEmptyComponent={<EmptyState icon="map-outline" text={t('noTrips')} />}
      />
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={openAdd}>
        <Text style={[styles.fabText, { color: colors.primaryText }]}>+</Text>
      </TouchableOpacity>

      {/* Add / Edit modal */}
      <BottomSheetModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <ScrollView>
          <Text style={[typography.heading, { color: colors.textPrimary, marginBottom: spacing.lg }]}>{editingTripId ? t('edit') : t('addTrip')}</Text>
          <TextField placeholder={t('name')} value={title} onChangeText={setTitle} />
          <DatePickerField placeholder={t('date')} value={date} onChange={setDate} minDate={minDate} maxDate={maxDate} />
          <TimePickerField placeholder={t('time')} value={time} onChange={setTime} />
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.sm }]}>Stops (like building a route)</Text>
          {stopInputs.map((stop, idx) => (
            <View key={idx} style={styles.stopRow}>
              <TextField
                style={{ flex: 1, marginBottom: 0 }}
                placeholder={idx === 0 ? 'Start' : idx === stopInputs.length - 1 ? 'End' : `Stop ${idx}`}
                value={stop}
                onChangeText={v => updateStopInput(idx, v)}
              />
              {stopInputs.length > 1 && (
                <TouchableOpacity onPress={() => removeStopInput(idx)} style={{ padding: spacing.sm }}>
                  <Text style={{ fontSize: 16, color: colors.error }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity onPress={addStopInput} style={{ paddingVertical: spacing.sm, marginBottom: spacing.sm }}>
            <Text style={[typography.caption, { color: colors.primary }]}>➕ Add Stop</Text>
          </TouchableOpacity>
          <TextField placeholder={t('notes')} value={notes} onChangeText={setNotes} multiline />
          <View style={styles.row}>
            <Button label={t('cancel')} variant="ghost" onPress={() => setModalVisible(false)} />
            <Button label={saving ? '...' : t('save')} onPress={handleSaveTrip} disabled={saving} />
          </View>
        </ScrollView>
      </BottomSheetModal>

      {/* Details modal */}
      <BottomSheetModal visible={!!detailsTrip} onClose={() => setDetailsTrip(null)}>
        <ScrollView>
          {detailsTrip && (() => {
            const stops = getTripStops(detailsTrip);
            return (
              <>
                <Text style={[typography.heading, { color: colors.textPrimary }]}>🗺️ {detailsTrip.title}</Text>
                <View style={[styles.dateTag, { backgroundColor: colors.secondary + '22', borderRadius: radius.sm, marginTop: spacing.sm }]}>
                  <Text style={[typography.small, { color: colors.secondary }]}>{detailsTrip.date}</Text>
                </View>
                {detailsTrip.time && <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>⏰ {detailsTrip.time}</Text>}
                {detailsTrip.notes && <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>{detailsTrip.notes}</Text>}

                {stops.length > 0 && (
                  <>
                    <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm }]}>Stops</Text>
                    {stops.map((s, i) => (
                      <Text key={i} style={[typography.body, { color: colors.textPrimary, marginBottom: 4 }]}>{i + 1}. {s.label}</Text>
                    ))}
                    {(detailsTrip.distanceKm != null || detailsTrip.durationMin != null) && (
                      <Text style={[typography.caption, { color: colors.primary, marginTop: 4, fontWeight: '700' }]}>
                        🚗 {detailsTrip.distanceKm} km · {detailsTrip.durationMin} min
                      </Text>
                    )}
                    <Image source={{ uri: staticMapUrl(stops) }} style={[styles.mapPreview, { borderRadius: radius.md }]} resizeMode="cover" />
                    <TouchableOpacity onPress={() => openInMaps(stops)}>
                      <Text style={[typography.caption, { color: colors.secondary, marginTop: spacing.sm, textDecorationLine: 'underline' }]}>📍 Open in Maps</Text>
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.row}>
                  <TouchableOpacity onPress={() => setRsvpTrip(detailsTrip)}>
                    <Text style={[typography.caption, { color: colors.primary }]}>👍 {goingCount(detailsTrip)} {t('going')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openEditTrip(detailsTrip)}>
                    <Text style={[typography.caption, { color: colors.primary }]}>✏️ {t('edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(detailsTrip.id)}>
                    <Text style={[typography.caption, { color: colors.error }]}>🗑 {t('delete')}</Text>
                  </TouchableOpacity>
                </View>
                <Button label={t('cancel')} variant="ghost" onPress={() => setDetailsTrip(null)} style={{ marginTop: spacing.sm }} />
              </>
            );
          })()}
        </ScrollView>
      </BottomSheetModal>

      <BottomSheetModal visible={!!rsvpTrip} onClose={() => setRsvpTrip(null)}>
        <Text style={[typography.heading, { color: colors.textPrimary, marginBottom: spacing.lg }]}>{t('rsvp')}: {rsvpTrip?.title}</Text>
        <ScrollView style={{ maxHeight: 300 }}>
          {participants.map(p => {
            const going = rsvpTrip?.rsvp?.[p.id] ?? false;
            return (
              <TouchableOpacity key={p.id} style={[styles.rsvpRow, { borderBottomColor: colors.border }]} onPress={() => rsvpTrip && toggleRsvp(rsvpTrip, p.id)}>
                <Text style={[typography.body, { color: colors.textPrimary }]}>{p.name}</Text>
                <Text style={[typography.caption, { color: going ? colors.success : colors.textMuted, fontWeight: '700' }]}>{going ? `✓ ${t('going')}` : t('notGoing')}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <Button label={t('save')} onPress={() => setRsvpTrip(null)} style={{ marginTop: spacing.md }} />
      </BottomSheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dateTag: { paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 6 },
  fab: { position: 'absolute', bottom: 100, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { fontSize: 28, lineHeight: 32 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  mapPreview: { height: 180, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 12, alignItems: 'center' },
  rsvpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
});
