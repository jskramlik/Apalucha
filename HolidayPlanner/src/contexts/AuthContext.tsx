import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser || !holidayId) {
        setMember(null);
        setLoading(false);
        return;
      }
      const snap = await getDoc(doc(db, 'holidays', holidayId, 'members', firebaseUser.uid));
      if (snap.exists()) {
        setMember({ id: firebaseUser.uid, ...snap.data() } as Member);
      }
      setLoading(false);
    });
  }, [holidayId]);

  return (
    <AuthContext.Provider value={{ user, member, holidayId, setHolidayId, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
