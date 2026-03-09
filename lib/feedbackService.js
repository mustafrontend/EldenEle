import { db, auth } from './firebase';
import {
    collection, addDoc, getDocs, doc, getDoc, query, where, orderBy,
    onSnapshot, serverTimestamp, updateDoc, deleteDoc, or, increment, limit, setDoc, Timestamp
} from 'firebase/firestore';

export async function submitFeedback(data) {
    // data: { type, message, userId (optional), userEmail (optional), userName (optional) }
    await addDoc(collection(db, 'feedbacks'), {
        ...data,
        createdAt: serverTimestamp(),
        status: 'new' // Admin panel later can mark as "read" or "resolved"
    });
}
