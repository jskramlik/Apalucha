import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
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
      (snap) => {
        setMember(snap.exists() ? ({ id: user.uid, ...snap.data() } as Member) : null);
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
