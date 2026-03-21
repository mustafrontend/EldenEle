'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext(null);

export const normalizePhone = (raw) => {
    if (!raw) return '';
    let digits = raw.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    else if (digits.length === 12 && digits.startsWith('90')) digits = digits.slice(2);
    else if (digits.length === 13 && digits.startsWith('+90')) digits = digits.slice(3);
    return digits; // Returns 10 digits for consistent lookup/Auth
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const userRef = doc(db, 'users', firebaseUser.uid);
                const snap = await getDoc(userRef);
                if (snap.exists()) {
                    const data = snap.data();
                    // Eğer kullanıcının tokens alanı hiç yoksa (eski hesap), otomatik 5 jeton ver
                    if (data.tokens === undefined) {
                        await setDoc(userRef, { tokens: 5 }, { merge: true });
                        data.tokens = 5;
                    }
                    setUserData(data);
                } else {
                    setUserData(null);
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    async function login(email, password, remember = true) {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        setUserData(snap.exists() ? snap.data() : null);
        return cred.user;
    }

    async function register({ name, email, phone, password, photoURL = null }) {
        // Double check uniqueness (though usually checked in UI)
        const cleanPhone = normalizePhone(phone);
        const nameTaken = await isNameTaken(name);
        if (nameTaken) {
            throw new Error('Bu kullanıcı adı zaten alınmış.');
        }

        const phoneTaken = await isPhoneRegistered(phone);
        if (phoneTaken) {
            throw new Error('Bu telefon numarası zaten kayıtlı.');
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Don't set photoURL in UpdateProfile if it's potentially long (Base64)
        await updateProfile(cred.user, {
            displayName: name
        });
        const profile = {
            displayName: name,
            email,
            phone, // Original formatted phone
            phoneDigits: cleanPhone, // Normalized for unique check
            photoURL, // Still save to Firestore
            tokens: 5,
            favorites: [],
            createdAt: new Date()
        };
        await setDoc(doc(db, 'users', cred.user.uid), profile);
        setUser(cred.user);
        setUserData(profile);
        return cred.user;
    }

    async function isPhoneRegistered(phone) {
        const email = await findUserEmailByPhone(phone);
        return !!email;
    }

    async function findUserEmailByPhone(phone) {
        const cleanPhone = normalizePhone(phone);
        if (cleanPhone.length < 10) return null;

        // 1. Try normalizedDigits (new system)
        const q1 = query(collection(db, 'users'), where('phoneDigits', '==', cleanPhone));
        const snap1 = await getDocs(q1);
        if (!snap1.empty) return snap1.docs[0].data().email;

        // 2. Try raw variations (legacy support for formats shown in screenshot)
        // Variations like "0551 000 45 13", "533...", "+90..."
        const variations = [
            cleanPhone, // 555...
            '0' + cleanPhone, // 0555...
            '+90' + cleanPhone, // +90555...
            '90' + cleanPhone, // 90555...
            // Space formatting variations are harder but let's try a few
            `0${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6, 8)} ${cleanPhone.slice(8, 10)}`
        ];

        // Instead of querying each, we could use where('phone', 'in', variations) but Firestore has a 10 item limit
        // and we don't know the exact spacing used by old records.
        // Let's just do a simple search for anything containing the cleanPhone string (less efficient but reliable for legacy)
        // Actually, let's just use 'in' for common ones
        const q2 = query(collection(db, 'users'), where('phone', 'in', variations));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) return snap2.docs[0].data().email;

        return null;
    }

    async function updateUserInfo(data) {
        if (!user) return;

        // Update Firebase Auth Profile (Only name, skip photoURL if it's long)
        if (data.displayName) {
            await updateProfile(user, {
                displayName: data.displayName
            });
        }

        // Update Firestore doc (Full data including long photoURL is fine here)
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, data, { merge: true });

        // Update Local State
        setUserData(prev => ({ ...prev, ...data }));
    }

    async function logout() {
        await signOut(auth);
        setUser(null);
        setUserData(null);
    }

    async function toggleFavorite(listingId) {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;
        const favs = snap.data().favorites || [];
        const idx = favs.indexOf(listingId);
        if (idx === -1) favs.push(listingId);
        else favs.splice(idx, 1);
        await setDoc(userRef, { favorites: favs }, { merge: true });
        setUserData((prev) => ({ ...prev, favorites: favs }));
    }

    async function isNameTaken(name) {
        if (!name) return false;
        const q = query(collection(db, 'users'), where('displayName', '==', name.trim()));
        const snap = await getDocs(q);
        return !snap.empty;
    }

    return (
        <AuthContext.Provider value={{ user, userData, loading, login, register, logout, toggleFavorite, updateUserInfo, isPhoneRegistered, isNameTaken, findUserEmailByPhone }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
