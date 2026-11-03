'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseAuthUser, 
  onAuthStateChanged, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { getDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useFirebase } from '@/firebase';

type Role = "superadmin" | "admin" | "staff" | "user" | "agent";

export interface UserProfile {
  uid: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: Role;
  permissions: string[];
  company: string;
  telephone: string;
}

interface AuthContextType {
  user: FirebaseAuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  effectiveRole: Role;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth, firestore: db } = useFirebase();
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [effectiveRole, setEffectiveRole] = useState<Role>('user');
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Speed up initial load: set global loading to false as soon as we have a user
        setLoading(false);
        
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        try {
            const tokenResult = await firebaseUser.getIdTokenResult();
            const claims = tokenResult.claims;

            const finalRole = ((): Role => {
              if (claims.superadmin === true) return "superadmin";
              if (claims.admin === true) return "admin";
              if (claims.agent === true) return "agent";
              return "user";
            })();
            
            setEffectiveRole(finalRole);

            const docSnap = await getDoc(userRef);
            
            if (docSnap.exists()) {
                const profileData = docSnap.data() as Omit<UserProfile, 'uid'>;
                setUserProfile({
                    uid: firebaseUser.uid,
                    ...profileData,
                } as UserProfile);
                if (profileData.role) setEffectiveRole(profileData.role);
            } else if (!firebaseUser.isAnonymous) {
                 const newUserProfileData = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'New User',
                    email: firebaseUser.email,
                    avatar: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
                    role: 'user' as Role,
                    permissions: [],
                    company: '',
                    telephone: '',
                    createdAt: serverTimestamp(),
                };
                
                await setDoc(userRef, newUserProfileData, { merge: true });
                setUserProfile({ uid: firebaseUser.uid, ...newUserProfileData } as UserProfile);
            }

        } catch (error: any) {
            console.error("Auth initialization error:", error);
        } finally {
            setProfileLoading(false);
            const publicAuthRoutes = ['/login', '/signup', '/forgot-password'];
            if (publicAuthRoutes.includes(pathname)) {
                router.push('/dashboard');
            }
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setEffectiveRole('user');
        setLoading(false);
        setProfileLoading(false);
        const isProtectedRoute = [
          '/dashboard', '/admin', '/create-post', '/posts', '/profile', 
          '/ea-valuation', '/floor-plan-maestro', '/ea-image-pro', 
          '/ea-360', '/ea-analyse', '/socials', '/eacaller', '/creator-studio', '/outlook-voice-assistant', '/eacanvass'
        ].some(route => pathname.startsWith(route));
        
        if (isProtectedRoute) {
          router.replace('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [auth, db, router, pathname]);
  
  const signup = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    setProfileLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      await updateProfile(currentUser, { displayName: fullName });
      
      toast({ title: 'Account Created!', description: "You've been successfully signed up." });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Sign Up Failed', description: error.message });
        setLoading(false);
        setProfileLoading(false);
    }
  };
  
  const login = async (email: string, password: string) => {
    setLoading(true);
    setProfileLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid email or password.' });
        setLoading(false);
        setProfileLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: 'An error occurred while signing out.' });
    }
  };
  
  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for a link to reset your password.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Reset Failed', description: error.message });
    } finally {
        setLoading(false);
    }
  };

  const value: AuthContextType = { 
      user, 
      userProfile, 
      loading, 
      profileLoading, 
      effectiveRole, 
      signup, 
      login, 
      logout, 
      resetPassword 
  };

  return (
    <AuthContext.Provider value={value}>
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
