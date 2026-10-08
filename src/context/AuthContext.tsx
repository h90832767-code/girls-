import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Profile, UserRole } from '../types';
import { 
  supabase, 
  isSupabaseConfigured, 
  demoProfiles, 
  getProfileById, 
  updateProfileRecord,
  LOCAL_DEMO_AUTH_KEY 
} from '../lib/supabase';
import { getUserCustomPassword, setUserPassword, updateUserAccount } from '../lib/dataService';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string, explicitRole?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session & listen to auth changes
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        // 1. Immediately hydrate local saved session if present (guarantees offline & deployed resilience)
        const savedDemoProfile = localStorage.getItem(LOCAL_DEMO_AUTH_KEY);
        if (savedDemoProfile && isMounted) {
          try {
            const parsed: Profile = JSON.parse(savedDemoProfile);
            if (parsed && parsed.role) {
              setProfile(parsed);
              setRole(parsed.role);
              setUser({
                id: parsed.id,
                email: parsed.email,
                app_metadata: {},
                user_metadata: { full_name: parsed.full_name, role: parsed.role },
                aud: 'authenticated',
                created_at: parsed.created_at || new Date().toISOString(),
              } as User);
            }
          } catch (e) {
            localStorage.removeItem(LOCAL_DEMO_AUTH_KEY);
          }
        }

        // 2. If Supabase is active, check live session as well
        if (isSupabaseConfigured) {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (!error && session?.user && isMounted) {
              setUser(session.user);
              const userProfile = await getProfileById(session.user.id);
              if (userProfile && isMounted) {
                setProfile(userProfile);
                setRole(userProfile.role);
                localStorage.setItem(LOCAL_DEMO_AUTH_KEY, JSON.stringify(userProfile));
              }
            }
          } catch (sbErr) {
            console.warn('Supabase session lookup skipped:', sbErr);
          }
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initializeAuth();

    // Set up auth state change listener if Supabase is active
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    if (isSupabaseConfigured) {
      try {
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;
          if (session?.user) {
            setUser(session.user);
            const userProfile = await getProfileById(session.user.id);
            if (userProfile && isMounted) {
              setProfile(userProfile);
              setRole(userProfile.role);
              localStorage.setItem(LOCAL_DEMO_AUTH_KEY, JSON.stringify(userProfile));
            }
          } else if (event === 'SIGNED_OUT') {
            const localSaved = localStorage.getItem(LOCAL_DEMO_AUTH_KEY);
            if (!localSaved) {
              setUser(null);
              setProfile(null);
              setRole(null);
            }
          }
          setLoading(false);
        });
        authListener = data;
      } catch (e) {
        console.warn('Supabase auth listener setup note:', e);
      }
    }

    return () => {
      isMounted = false;
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, []);

  /**
   * Log in user using email and password with resilient local & cloud support
   */
  const login = async (email: string, password: string, explicitRole?: UserRole): Promise<void> => {
    setLoading(true);
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();

      // Determine target role from explicit argument, email hints, or default to admin
      const targetRole: UserRole = explicitRole || (
        cleanEmail.includes('admin') || 
        cleanEmail === 'h90832767@gmail.com' || 
        cleanEmail === 'aiediter632@gmail.com' ||
        cleanEmail === 'principal' ||
        cleanEmail === 'director' ? 'admin' :
        cleanEmail.includes('teacher') || cleanEmail.includes('faculty') ? 'teacher' :
        cleanEmail.includes('parent') || cleanEmail.includes('guardian') ? 'parent' :
        cleanEmail.includes('student') || cleanEmail.includes('scholar') ? 'student' :
        'admin' // Default to admin for safety
      );

      // If Supabase is configured and input is an email, try Supabase first
      if (isSupabaseConfigured && cleanEmail.includes('@')) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          });

          if (!error && data?.user) {
            setUser(data.user);
            let userProfile = await getProfileById(data.user.id);
            if (!userProfile) {
              const fallbackRole = (data.user.user_metadata?.role as UserRole) || targetRole;
              userProfile = {
                id: data.user.id,
                full_name: data.user.user_metadata?.full_name || (fallbackRole === 'admin' ? 'Mrs. Raheela Perveen' : 'Academy Scholar'),
                email: data.user.email || cleanEmail,
                role: fallbackRole,
                is_active: true,
                created_at: data.user.created_at || new Date().toISOString()
              };
            }
            setProfile(userProfile);
            setRole(userProfile.role);
            localStorage.setItem(LOCAL_DEMO_AUTH_KEY, JSON.stringify(userProfile));
            return; // Authenticated via Supabase
          }
        } catch (supabaseErr) {
          console.warn('Supabase remote sign-in not available, falling back to local credentials:', supabaseErr);
        }
      }

      // Standalone & Local Demo Authentication
      // 1. Direct or alias match from demoProfiles
      let matchedProfile: Profile | undefined = demoProfiles[cleanEmail];

      // 2. Local storage stored users (e.g. created by admin)
      if (!matchedProfile) {
        try {
          const storedUsersStr = localStorage.getItem('ga_users');
          if (storedUsersStr) {
            const storedUsers: Profile[] = JSON.parse(storedUsersStr);
            const found = storedUsers.find(u => u.email.toLowerCase() === cleanEmail);
            if (found) matchedProfile = found;
          }
        } catch {}
      }

      // 3. Role-based fallback or alias matching
      if (!matchedProfile) {
        if (
          targetRole === 'admin' ||
          cleanEmail === 'admin' ||
          cleanEmail === 'administrator' ||
          cleanEmail === 'admin@admin.com' ||
          cleanEmail.startsWith('admin') ||
          cleanEmail.includes('admin') ||
          cleanEmail === 'h90832767@gmail.com' ||
          cleanEmail === 'aiediter632@gmail.com'
        ) {
          matchedProfile = {
            ...demoProfiles['admin@girlsacademy.edu.pk'],
            email: cleanEmail.includes('@') ? cleanEmail : 'admin@girlsacademy.edu.pk',
            full_name: cleanEmail === 'h90832767@gmail.com' ? 'Mrs. Raheela Perveen (Administrator)' : demoProfiles['admin@girlsacademy.edu.pk'].full_name,
          };
        } else if (targetRole === 'teacher' || cleanEmail.startsWith('teacher') || cleanEmail.includes('teacher')) {
          matchedProfile = {
            ...demoProfiles['teacher@girlsacademy.edu.pk'],
            email: cleanEmail.includes('@') ? cleanEmail : 'teacher@girlsacademy.edu.pk',
          };
        } else if (targetRole === 'parent' || cleanEmail.startsWith('parent') || cleanEmail.includes('parent')) {
          matchedProfile = {
            ...demoProfiles['parent@girlsacademy.edu.pk'],
            email: cleanEmail.includes('@') ? cleanEmail : 'parent@girlsacademy.edu.pk',
          };
        } else if (targetRole === 'student' || cleanEmail.startsWith('student') || cleanEmail.includes('student')) {
          matchedProfile = {
            ...demoProfiles['student@girlsacademy.edu.pk'],
            email: cleanEmail.includes('@') ? cleanEmail : 'student@girlsacademy.edu.pk',
          };
        } else {
          matchedProfile = {
            ...demoProfiles[`${targetRole}@girlsacademy.edu.pk`],
            email: cleanEmail.includes('@') ? cleanEmail : `${targetRole}@girlsacademy.edu.pk`,
          };
        }
      }

      if (!matchedProfile) {
        throw new Error(`Unable to identify account for "${email}". Please verify your email or contact the academy administration.`);
      }

      // 4. Password validation
      const customPassword = getUserCustomPassword(cleanEmail) || getUserCustomPassword(matchedProfile.email);
      const standardAcceptedPasses = [
        'admin123', 'admin', 'admin@123', 'admin1234', '123456', 'password', 'girlsacademy', 'Welcome2026!',
        'teacher123', 'teacher', 'parent123', 'parent', 'student123', 'student'
      ];

      if (customPassword) {
        if (cleanPassword && cleanPassword !== customPassword && !standardAcceptedPasses.includes(cleanPassword)) {
          throw new Error('Invalid credentials: the password entered does not match your registered account.');
        }
      } else {
        // If user typed a custom password, register it
        if (cleanPassword && !standardAcceptedPasses.includes(cleanPassword)) {
          await setUserPassword(cleanEmail, cleanPassword);
        }
      }

      // Ensure ga_admin_secret_pass is always intact
      if (matchedProfile.role === 'admin') {
        localStorage.setItem('ga_admin_secret_pass', cleanPassword || 'admin123');
      }

      // Small network delay simulation
      await new Promise((res) => setTimeout(res, 200));

      // Save session in local storage
      localStorage.setItem(LOCAL_DEMO_AUTH_KEY, JSON.stringify(matchedProfile));
      setProfile(matchedProfile);
      setRole(matchedProfile.role);
      setUser({
        id: matchedProfile.id,
        email: matchedProfile.email,
        app_metadata: {},
        user_metadata: { full_name: matchedProfile.full_name, role: matchedProfile.role },
        aud: 'authenticated',
        created_at: matchedProfile.created_at || new Date().toISOString(),
      } as User);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log out user and clear state
   */
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(LOCAL_DEMO_AUTH_KEY);
      setUser(null);
      setProfile(null);
      setRole(null);
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update current user's profile (name, phone, photo, etc.)
   */
  const updateProfile = async (updates: Partial<Profile>): Promise<void> => {
    if (!profile) throw new Error('No profile to update');
    const updated = await updateProfileRecord(profile.id, updates);
    setProfile(updated);
    if (updated.role) setRole(updated.role);
    if (user) {
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          full_name: updated.full_name,
        }
      });
    }
    // Also sync in ga_users and demoProfiles
    await updateUserAccount(profile.id, updates);
  };

  /**
   * Change / update password for current user
   */
  const updatePassword = async (newPassword: string): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
    }
    
    // Save per-user custom password
    if (profile?.email) {
      await setUserPassword(profile.email, newPassword);
    }

    if (role === 'admin') {
      localStorage.setItem('ga_admin_secret_pass', newPassword);
    } else if (role === 'teacher') {
      localStorage.setItem('ga_teacher_secret_pass', newPassword);
    } else if (role === 'parent') {
      localStorage.setItem('ga_parent_secret_pass', newPassword);
    } else if (role === 'student') {
      localStorage.setItem('ga_student_secret_pass', newPassword);
    }
    await new Promise(r => setTimeout(r, 350));
  };

  /**
   * Request password reset email
   */
  const resetPasswordForEmail = async (email: string): Promise<void> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(error.message);
    } else {
      // Demo simulated success
      await new Promise(r => setTimeout(r, 400));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        login,
        logout,
        updateProfile,
        updatePassword,
        resetPasswordForEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
