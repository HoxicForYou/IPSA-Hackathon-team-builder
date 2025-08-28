import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import firebase from 'firebase/compat/app';
import { auth, db } from '../services/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: firebase.User | null;
  profile: UserProfile | null;
  profileExists: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  createProfile: (profileData: Omit<UserProfile, 'id' | 'email'>) => Promise<void>;
  updateProfile: (profileData: Partial<Omit<UserProfile, 'id' | 'email'>>) => Promise<void>;
  refreshUserStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileExists, setProfileExists] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [userVersion, setUserVersion] = useState(0); // Added for forcing user state refresh

  useEffect(() => {
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(error => {
        console.error("Firebase: Could not set auth persistence.", error);
    });

    let profileListener: ((snapshot: firebase.database.DataSnapshot) => void) | undefined;
    let profileRef: firebase.database.Reference | undefined;

    const authUnsubscribe = auth.onAuthStateChanged(user => {
      if (profileRef && profileListener) {
        profileRef.off('value', profileListener);
      }
      
      if (user) {
        setCurrentUser(user);
        profileRef = db.ref(`users/${user.uid}`);
        profileListener = profileRef.on('value', snapshot => {
          if (snapshot.exists()) {
            const userProfile = { id: snapshot.key, ...snapshot.val() } as UserProfile;
            setProfile(userProfile);
            setProfileExists(true);
          } else {
            setProfile(null);
            setProfileExists(false);
          }
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setProfile(null);
        setProfileExists(false);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (profileRef && profileListener) {
        profileRef.off('value', profileListener);
      }
    };
  }, [userVersion]); // Dependency added to re-run on manual refresh

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch(error) {
        console.error("Google sign-in error", error);
        setLoading(false);
    }
  };

  const signOut = () => {
    auth.signOut();
  };
  
  const signInWithEmail = async (email: string, password: string) => {
    await auth.signInWithEmailAndPassword(email, password);
  };

  const signUpWithEmail = async (fullName: string, email: string, password: string) => {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    if (userCredential.user) {
      await userCredential.user.updateProfile({ displayName: fullName });
      // Send Firebase's built-in verification email
      await userCredential.user.sendEmailVerification();
    }
  };

  const createProfile = async (profileData: Omit<UserProfile, 'id' | 'email'>) => {
    if (!currentUser) throw new Error("Not authenticated");
    const newProfile: UserProfile = {
      ...profileData,
      id: currentUser.uid,
      email: currentUser.email!,
    };
    await db.ref(`users/${currentUser.uid}`).set(newProfile);
  };

  const updateProfile = async (profileData: Partial<Omit<UserProfile, 'id' | 'email'>>) => {
    if (!currentUser) throw new Error("Not authenticated");
    await db.ref(`users/${currentUser.uid}`).update(profileData);
  };

  const refreshUserStatus = () => {
    setUserVersion(v => v + 1);
  };

  return (
    <AuthContext.Provider value={{ currentUser, profile, profileExists, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, createProfile, updateProfile, refreshUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
