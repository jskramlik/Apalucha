import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Member } from '../types';

interface AuthContextType {
  user: User | null;
  member: Member | null;
  holidayId: string | null;
  setHolidayId: (id: string | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  member: null,
  holidayId: null,
  setHolidayId: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [holidayId, setHolidayId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const backfilledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setMember(null);
        setLoading(false);
      }
    });
  }, []);

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
    <AuthContext.Provider value={{ user, member, holidayId, setHolidayId, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
