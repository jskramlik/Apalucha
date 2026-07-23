import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Member } from '../types';

interface AuthContextType {
  user: User | null;
  member: Member | null;
  holidayId: string | null;
  setHolidayId: (id: string | null) => void;
  loading: boolean;
  // Number of apaluchas the user belongs to, checked when holidayId is null.
  // null while still checking; used to decide between the setup screen (0) and the switcher (>1).
  userHolidayCount: number | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  member: null,
  holidayId: null,
  setHolidayId: () => {},
  loading: true,
  userHolidayCount: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [holidayId, setHolidayId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userHolidayCount, setUserHolidayCount] = useState<number | null>(null);
  const backfilledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setMember(null);
        setUserHolidayCount(null);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user || holidayId) return;
    let cancelled = false;
    getDocs(collection(db, 'userHolidays', user.uid, 'holidays')).then((snap) => {
      if (cancelled) return;
      setUserHolidayCount(snap.size);
      if (snap.size === 1) setHolidayId(snap.docs[0].id);
    });
    return () => { cancelled = true; };
  }, [user, holidayId]);

  useEffect(() => {
    if (!user || !holidayId) {
      setMember(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, 'holidays', holidayId, 'members', user.uid),
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Omit<Member, 'id'>;
          setMember({ id: user.uid, ...data });

          const backfillKey = `${user.uid}:${holidayId}`;
          if (!backfilledRef.current.has(backfillKey)) {
            backfilledRef.current.add(backfillKey);
            const userHolidayRef = doc(db, 'userHolidays', user.uid, 'holidays', holidayId);
            const userHolidaySnap = await getDoc(userHolidayRef);
            if (!userHolidaySnap.exists()) {
              const holidaySnap = await getDoc(doc(db, 'holidays', holidayId));
              await setDoc(userHolidayRef, {
                holidayName: holidaySnap.exists() ? holidaySnap.data().name : 'Apalucha',
                role: data.role,
                joinedAt: new Date().toISOString(),
              });
            }
          }
        } else {
          setMember(null);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [user, holidayId]);

  return (
    <AuthContext.Provider value={{ user, member, holidayId, setHolidayId, loading, userHolidayCount }}>
      {children}
    </AuthContext.Provider>
  );
};
