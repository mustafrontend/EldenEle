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
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
                setUserData(snap.exists() ? snap.data() : null);
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

    async function register({ name, email, phone, password }) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        const profile = { displayName: name, email, phone, favorites: [], createdAt: new Date() };
        await setDoc(doc(db, 'users', cred.user.uid), profile);
        setUser(cred.user);
        setUserData(profile);
        return cred.user;
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

    return (
        <AuthContext.Provider value={{ user, userData, loading, login, register, logout, toggleFavorite }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
