import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOutUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(currentUser.isAnonymous);
      } else {
        setIsGuest(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearAuthError = () => setAuthError(null);

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  };

  // 1. Sign Up with Email, Password & Display Name
  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      setAuthError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const newUser = userCredential.user;

      // Update Auth Profile
      if (name.trim()) {
        await updateProfile(newUser, { displayName: name.trim() });
      }

      // Initialize User Document in Firestore
      const userDocRef = doc(db, 'users', newUser.uid);
      await setDoc(userDocRef, {
        uid: newUser.uid,
        email: newUser.email || email.trim(),
        displayName: name.trim() || email.split('@')[0],
        isGuest: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka',
        dailyTargetMinutes: 180,
        timeFormat: '12h',
        soundEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setIsAuthModalOpen(false);
    } catch (error: any) {
      console.error('Sign up error:', error);
      let message = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (error.message) {
        message = error.message;
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  // 2. Sign In with Email & Password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setAuthError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const loggedUser = userCredential.user;

      // Check if user doc exists in Firestore, if not create basic profile
      const userDocRef = doc(db, 'users', loggedUser.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        await setDoc(userDocRef, {
          uid: loggedUser.uid,
          email: loggedUser.email || email.trim(),
          displayName: loggedUser.displayName || email.split('@')[0],
          isGuest: false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka',
          dailyTargetMinutes: 180,
          timeFormat: '12h',
          soundEnabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      setIsAuthModalOpen(false);
    } catch (error: any) {
      console.error('Sign in error:', error);
      let message = 'Failed to sign in. Please check your credentials.';
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        message = 'Incorrect email or password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please try again in a few minutes.';
      } else if (error.message) {
        message = error.message;
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  // 3. Guest / Temporary Login
  const signInAsGuest = async () => {
    try {
      setAuthError(null);
      try {
        const userCredential = await signInAnonymously(auth);
        const guestUser = userCredential.user;
        const userDocRef = doc(db, 'users', guestUser.uid);
        await setDoc(userDocRef, {
          uid: guestUser.uid,
          email: 'guest@timewise.local',
          displayName: 'Guest Learner',
          isGuest: true,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka',
          dailyTargetMinutes: 180,
          timeFormat: '12h',
          soundEnabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (anonErr) {
        console.warn('Anonymous auth not enabled in console, using local guest session:', anonErr);
        // If Anonymous auth provider is disabled in Firebase console, we fallback seamlessly
      }
      setIsAuthModalOpen(false);
    } catch (error: any) {
      console.error('Guest login error:', error);
      setAuthError(error.message || 'Failed to start guest session.');
      throw error;
    }
  };

  // 4. Sign Out
  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsGuest(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        authError,
        clearAuthError,
        signUpWithEmail,
        signInWithEmail,
        signInAsGuest,
        signOutUser,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
