import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { subscribeAuthState, signInAdmin, signOutAdmin } from '../firebase/auth';
import { getDocument, setDocument } from '../firebase/firestore';
import { useLocalMode } from '../firebase/config';
import { mockFirebase } from '../firebase';

export interface AdminProfile {
  uid: string;
  username: string;
  name: string;
  role: 'Super Admin' | 'Admin' | 'Editor' | 'Event Manager' | 'Gallery Manager';
  email: string;
  avatar: string;
}

interface AuthContextType {
  currentUser: User | null;
  profile: AdminProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (tab: string) => boolean;
  updateSimulatedRole: (role: AdminProfile['role']) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (useLocalMode) {
      const unsubscribe = mockFirebase.onAuthChange((user: any) => {
        if (user) {
          setProfile({
            uid: user.uid,
            username: user.username,
            name: user.name,
            role: user.role,
            email: user.email,
            avatar: user.avatar
          });
          setCurrentUser({
            email: user.email,
            uid: user.uid
          } as User);
        } else {
          setProfile(null);
          setCurrentUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      const unsubscribe = subscribeAuthState(async (user) => {
        setCurrentUser(user);
        if (user) {
          try {
            // Fetch administrator role profile from Firestore users collection
            let adminDoc = await getDocument('users', user.uid) as AdminProfile | null;
            
            if (!adminDoc) {
              // Seed default superadmin profile if document does not exist in Firestore
              adminDoc = {
                uid: user.uid,
                username: user.email?.split('@')[0] || 'admin',
                name: 'SCU Administrator',
                role: 'Super Admin',
                email: user.email || '',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
              };
              await setDocument('users', user.uid, adminDoc);
            }
            setProfile(adminDoc);
          } catch (err: any) {
            console.error('Failed to retrieve administrator profile:', err);
            setError('Failed to retrieve role profile.');
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      if (useLocalMode) {
        await mockFirebase.mockLogin(email, pass, true);
      } else {
        await signInAdmin(email, pass);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (useLocalMode) {
        mockFirebase.mockLogout();
      } else {
        await signOutAdmin();
      }
    } catch (err: any) {
      setError(err.message || 'Logout failed.');
    } finally {
      setLoading(false);
    }
  };

  const updateSimulatedRole = (role: AdminProfile['role']) => {
    if (profile) {
      setProfile({ ...profile, role });
    }
  };

  // Enforces security matrix roles permissions
  const hasPermission = (tab: string): boolean => {
    if (!profile) return false;
    const role = profile.role;
    
    const PERMISSIONS: Record<AdminProfile['role'], string[]> = {
      'Super Admin': ['all'],
      'Admin': ['dashboard', 'hero', 'about', 'categories', 'events', 'gallery', 'team', 'announcements', 'memberships', 'contact', 'logs', 'settings'],
      'Editor': ['hero', 'about', 'categories', 'gallery', 'announcements'],
      'Event Manager': ['events', 'categories'],
      'Gallery Manager': ['gallery']
    };
    
    const allowed = PERMISSIONS[role] || [];
    return allowed.includes('all') || allowed.includes(tab);
  };

  return (
    <AuthContext.Provider value={{ currentUser, profile, loading, error, login, logout, hasPermission, updateSimulatedRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
};
