import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Switch } from 'react-native';
import { doc, updateDoc, setDoc, deleteDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { auth, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Child } from '../types';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, member, holidayId } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [newChildName, setNewChildName] = useState('');
  const [isCzech, setIsCzech] = useState(i18n.language === 'cs');

  useEffect(() => {
    if (member?.name) setDisplayName(member.name);
  }, [member?.name]);

  useEffect(() => {
    if (!holidayId || !user) return;
    const q = query(collection(db, 'holidays', holidayId, 'children'), where('parentUserId', '==', user.uid));
    return onSnapshot(q, snap => {
      setChildren(snap.docs.map(d => ({ id: d.id, ...d.data() } as Child)));
    });
  }, [holidayId, user]);

  const handleSaveName = async () => {
    if (!user || !holidayId) return;
    try {
      await updateDoc(doc(db, 'holidays', holidayId, 'members', user.uid), { name: displayName });
      Alert.alert('Saved!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAddChild = async () => {
    if (!newChildName.trim() || !holidayId || !user) return;
    try {
      await setDoc(doc(collection(db, 'holidays', holidayId, 'children')), {
        name: newChildName.trim(),
        photoUrl: '',
        parentUserId: user.uid,
        totalPoints: 0,
      });
      setNewChildName('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleRemoveChild = (child: Child) => {
    Alert.alert('Remove', `Remove ${child.name}?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'), style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'holidays', holidayId!, 'children', child.id));
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }
      },
    ]);
  };

  const toggleLanguage = (val: boolean) => {
    setIsCzech(val);
    i18n.changeLanguage(val ? 'cs' : 'en');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarLetter}>{(member?.name ?? user?.email ?? 'U')[0].toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.section}>{t('name')}</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
      <TouchableOpacity style={styles.button} onPress={handleSaveName}><Text style={styles.buttonText}>{t('save')}</Text></TouchableOpacity>

      <Text style={styles.section}>{t('language')}</Text>
      <View style={styles.langRow}>
        <Text style={styles.langLabel}>EN</Text>
        <Switch value={isCzech} onValueChange={toggleLanguage} trackColor={{ true: '#2e7d32' }} />
        <Text style={styles.langLabel}>CZ</Text>
      </View>

      <Text style={styles.section}>{t('myKids')}</Text>
      {children.map(c => (
        <View key={c.id} style={styles.childRow}>
          <Text style={styles.childName}>👦 {c.name}</Text>
          <TouchableOpacity onPress={() => handleRemoveChild(c)}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>
        </View>
      ))}
      <View style={styles.addChildRow}>
        <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder={t('addKid')} value={newChildName} onChangeText={setNewChildName} />
        <TouchableOpacity style={styles.addButton} onPress={handleAddChild}><Text style={styles.buttonText}>+</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={() => signOut(auth)}>
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#2e7d32', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  photoHint: { color: '#aaa', marginTop: 6, fontSize: 13 },
  section: { fontSize: 14, fontWeight: '700', color: '#666', marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#ddd', fontSize: 15, marginBottom: 10 },
  button: { backgroundColor: '#2e7d32', borderRadius: 8, padding: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  langLabel: { fontSize: 15, color: '#333', fontWeight: '600' },
  childRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 6 },
  childName: { fontSize: 15, color: '#333' },
  removeText: { color: '#c62828', fontSize: 13 },
  addChildRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  addButton: { backgroundColor: '#2e7d32', borderRadius: 8, padding: 12, paddingHorizontal: 16 },
  logoutButton: { marginTop: 32, borderWidth: 1, borderColor: '#c62828', borderRadius: 8, padding: 14, alignItems: 'center' },
  logoutText: { color: '#c62828', fontWeight: '600', fontSize: 15 },
});
