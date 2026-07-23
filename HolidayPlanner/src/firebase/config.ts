import { initializeApp } from 'firebase/app';
// @ts-ignore getReactNativePersistence is exported from the React Native build resolved by Metro at runtime
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDaZCcpsdJeK3c4QXxI_8Vonpm8jf5eWIo',
  authDomain: 'holidayplanner-83086.firebaseapp.com',
  projectId: 'holidayplanner-83086',
  storageBucket: 'holidayplanner-83086.firebasestorage.app',
  messagingSenderId: '342767702765',
  appId: '1:342767702765:web:982733ad11637afb6df2e4',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
