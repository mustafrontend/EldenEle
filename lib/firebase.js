import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDsoDGJP83KRzDFYGyNMzyNKgwQKPORxDw",
  authDomain: "bardbird-8d5e4.firebaseapp.com",
  databaseURL: "https://bardbird-8d5e4-default-rtdb.firebaseio.com",
  projectId: "bardbird-8d5e4",
  storageBucket: "bardbird-8d5e4.firebasestorage.app",
  messagingSenderId: "713731391785",
  appId: "1:713731391785:web:da2bff9c7b6c6fa8f17738",
  measurementId: "G-K0CZ2Y8J4S"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

let messagingInstance = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messagingInstance = getMessaging(app);
    }
  });
}
export const messaging = messagingInstance;
