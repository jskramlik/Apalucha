import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { doc, updateDoc, setDoc, deleteDoc, collection, onSnapshot, query, where, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import i18n from '../i18n';
import { auth, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Child } from '../types';
import AvatarPicker, { AVATAR_OPTIONS } from '../components/AvatarPicker';
import { showAlert, showConfirm } from '../utils/alert';
import { Screen, Card, TextField, Button, Chip, Avatar, BottomSheetModal } from '../components/ui';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, member, holidayId } = useAuth();
  const { colors, spacing, typography, preference, setPreference } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [newChildName, setNewChildName] = useState('');
  const [isCzech, setIsCzech] = useState(i18n.language === 'cs');
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState(AVATAR_OPTIONS[0]);
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    if (member?.name) setDisplayName(member.name);
  }, [member?.name]);

  useEffect(() => {
    if (!holidayId) return;
    getDoc(doc(db, 'holidays', holidayId)).then(snap => {
      if (snap.exists()) setInviteCode(snap.data().inviteCode);
    });
  }, [holidayId]);

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
      showAlert('Saved!');
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };

  const handleAddChild = async () => {
    if (!newChildName.trim() || !holidayId || !user) return;
    try {
      await setDoc(doc(collection(db, 'holidays', holidayId, 'children')), {
        name: newChildName.trim(),
        photoUrl: '',
        avatar: AVATAR_OPTIONS[0],
        parentUserId: user.uid,
        totalPoints: 0,
      });
      setNewChildName('');
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };

  const openEditChild = (child: Child) => {
    setEditingChild(child);
    setEditName(child.name);
    setEditAvatar(child.avatar ?? AVATAR_OPTIONS[0]);
  };

  const handleSaveChildEdit = async () => {
    if (!editingChild || !holidayId || !editName.trim()) return;
    try {
      await updateDoc(doc(db, 'holidays', holidayId, 'children', editingChild.id), {
        name: editName.trim(),
        avatar: editAvatar,
      });
      setEditingChild(null);
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };

  const handleRemoveChild = (child: Child) => {
    showConfirm(t('delete'), `Remove ${child.name}?`, async () => {
      try {
        await deleteDoc(doc(db, 'holidays', holidayId!, 'children', child.id));
      } catch (e: any) {
        showAlert('Error', e.message);
      }
    });
  };

  const toggleLanguage = (val: boolean) => {
    setIsCzech(val);
    i18n.changeLanguage(val ? 'cs' : 'en');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 110 }}>
        <View style={styles.avatarContainer}>
          <Avatar name={member?.name ?? user?.email ?? 'U'} size={90} />
        </View>

        <Text style={[typography.small, styles.sectionLabel, { color: colors.textMuted }]}>{t('name')}</Text>
        <TextField value={displayName} onChangeText={setDisplayName} />
        <Button label={t('save')} onPress={handleSaveName} />

        <TouchableOpacity onPress={() => navigation.navigate('MyHolidays' as never)} style={{ marginTop: spacing.xl }}>
          <Card style={styles.rowCard}>
            <Text style={[typography.subheading, { color: colors.primary }]}>🔄 {t('switchHoliday')}</Text>
          </Card>
        </TouchableOpacity>

        {!!inviteCode && (
          <Card style={[styles.codeCard, { backgroundColor: colors.primary, marginTop: spacing.md }]}>
            <Text style={[typography.small, { color: colors.primaryText, opacity: 0.8 }]}>{t('inviteCode')}</Text>
            <Text style={styles.code}>{inviteCode}</Text>
            <Text style={[typography.small, { color: colors.primaryText, opacity: 0.8, marginTop: spacing.sm, textAlign: 'center' }]}>
              Share this code with other dads to join
            </Text>
          </Card>
        )}

        <Text style={[typography.small, styles.sectionLabel, { color: colors.textMuted }]}>{t('language')}</Text>
        <View style={styles.langRow}>
          <Text style={[typography.subheading, { color: colors.textPrimary }]}>EN</Text>
          <Switch value={isCzech} onValueChange={toggleLanguage} trackColor={{ true: colors.primary }} />
          <Text style={[typography.subheading, { color: colors.textPrimary }]}>CZ</Text>
        </View>

        <Text style={[typography.small, styles.sectionLabel, { color: colors.textMuted }]}>Theme</Text>
        <View style={styles.themeRow}>
          <Chip label="Light" selected={preference === 'light'} onPress={() => setPreference('light')} />
          <Chip label="Dark" selected={preference === 'dark'} onPress={() => setPreference('dark')} />
          <Chip label="System" selected={preference === 'system'} onPress={() => setPreference('system')} />
        </View>

        <Text style={[typography.small, styles.sectionLabel, { color: colors.textMuted }]}>{t('myKids')}</Text>
        {children.map(c => (
          <Card key={c.id} style={styles.childRow}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => openEditChild(c)}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>{c.avatar ?? '👦'} {c.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRemoveChild(c)}>
              <Text style={[typography.caption, { color: colors.error }]}>Remove</Text>
            </TouchableOpacity>
          </Card>
        ))}
        <View style={styles.addChildRow}>
          <TextField style={{ flex: 1, marginBottom: 0 }} placeholder={t('addKid')} value={newChildName} onChangeText={setNewChildName} />
          <TouchableOpacity onPress={handleAddChild} style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <Text style={[typography.heading, { color: colors.primaryText }]}>+</Text>
          </TouchableOpacity>
        </View>

        <Button label={t('logout')} variant="destructive" onPress={() => signOut(auth)} style={{ marginTop: spacing.xxxl }} />

        <BottomSheetModal visible={!!editingChild} onClose={() => setEditingChild(null)}>
          <Text style={[typography.heading, { color: colors.textPrimary, marginBottom: spacing.lg }]}>{t('editKid')}</Text>
          <TextField placeholder={t('name')} value={editName} onChangeText={setEditName} />
          <Text style={[typography.small, styles.sectionLabel, { color: colors.textMuted }]}>{t('chooseAvatar')}</Text>
          <AvatarPicker value={editAvatar} onChange={setEditAvatar} />
          <View style={styles.modalRow}>
            <Button label={t('cancel')} variant="ghost" onPress={() => setEditingChild(null)} />
            <Button label={t('save')} onPress={handleSaveChildEdit} />
          </View>
        </BottomSheetModal>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  sectionLabel: { marginTop: 24, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowCard: { alignItems: 'center' },
  codeCard: { alignItems: 'center' },
  code: { color: '#fff', fontSize: 28, fontWeight: 'bold', letterSpacing: 6 },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeRow: { flexDirection: 'row', gap: 8 },
  childRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  addChildRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  addButton: { borderRadius: 12, padding: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
});
