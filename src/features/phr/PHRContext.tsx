import React, { createContext, useContext, useEffect, useState } from 'react';
// simple uid generator to avoid extra dependency
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export type Role = 'patient' | 'doctor' | 'guardian';

export interface RecordItem {
  id: string;
  patientId: string;
  title: string;
  type: string;
  notes?: string;
  date?: string;
  createdBy?: string;
}

interface PHRContextValue {
  currentUser?: { id: string; role: Role } | null;
  signIn: (id: string, role: Role) => void;
  signOut: () => void;
  addRecord: (record: Omit<RecordItem, 'id'>) => RecordItem;
  getRecordsForPatient: (patientId: string) => RecordItem[];
  remindersForPatient: (patientId: string) => RecordItem[];
  exportRecordsAsText: (patientId: string) => string;
}

const LOCAL_KEY = 'hc03_phr_v1';

const PHRContext = createContext<PHRContextValue | undefined>(undefined);

export const usePHR = () => {
  const ctx = useContext(PHRContext);
  if (!ctx) throw new Error('usePHR must be used within PHRProvider');
  return ctx;
};

export const PHRProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<{ id: string; role: Role } | null>(() => {
    try {
      const raw = localStorage.getItem(`${LOCAL_KEY}_user`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [store, setStore] = useState<RecordItem[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
    } catch (e) {
      // ignore
    }
  }, [store]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_KEY}_user`, JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser]);

  const signIn = (id: string, role: Role) => {
    setCurrentUser({ id, role });
  };

  const signOut = () => setCurrentUser(null);

  const addRecord = (record: Omit<RecordItem, 'id'>) => {
    const newRecord: RecordItem = { ...record, id: uid() };
    setStore((s) => [newRecord, ...s]);
    return newRecord;
  };

  const getRecordsForPatient = (patientId: string) => store.filter((r) => r.patientId === patientId);

  const remindersForPatient = (patientId: string) =>
    store.filter((r) => r.patientId === patientId && r.type?.toLowerCase().includes('reminder'));

  const exportRecordsAsText = (patientId: string) => {
    const recs = getRecordsForPatient(patientId);
    return JSON.stringify(recs, null, 2);
  };

  return (
    <PHRContext.Provider
      value={{ currentUser, signIn, signOut, addRecord, getRecordsForPatient, remindersForPatient, exportRecordsAsText }}
    >
      {children}
    </PHRContext.Provider>
  );
};
