import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { verifyBackendAdminRole, getBackendHealth } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [villageId, setVillageId] = useState(null);
  const [backendVerified, setBackendVerified] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check backend server health
  const checkHealth = useCallback(async () => {
    const health = await getBackendHealth();
    setBackendOnline(health.ok);
    return health.ok;
  }, []);

  // Verify admin authorization against Express backend and profiles
  const verifyAdmin = useCallback(async (token, userId) => {
    try {
      // 1. Verify directly against backend role enforcement endpoint
      const roleData = await verifyBackendAdminRole(token);
      setRole(roleData.role);
      setVillageId(roleData.village_id);
      setBackendVerified(true);
      return { verified: true, role: roleData.role, villageId: roleData.village_id };
    } catch (err) {
      console.warn('Backend verification failed:', err.message);
      
      // If error is 403 forbidden from backend, the user is NOT an admin
      if (err.status === 403) {
        throw new Error('Access Denied: This account is not registered as an administrator. Only admin/super_admin roles are allowed.');
      }

      // If backend was unreachable (e.g. server offline), check profile directly via Supabase client
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role, village_id')
        .eq('id', userId)
        .single();

      if (profileErr || !profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        throw new Error('Access Denied: Account does not have administrator privileges.');
      }

      setRole(profile.role);
      setVillageId(profile.village_id);
      setBackendVerified(false); // Supabase allowed, but Express backend was unreachable
      return { verified: false, role: profile.role, villageId: profile.village_id };
    }
  }, []);

  // Initialize session
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        setIsLoading(true);
        checkHealth();

        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (currentSession?.user) {
          try {
            await verifyAdmin(currentSession.access_token, currentSession.user.id);
            if (isMounted) {
              setSession(currentSession);
              setUser(currentSession.user);
            }
          } catch (verificationErr) {
            console.error('Session admin verification failed:', verificationErr.message);
            await supabase.auth.signOut();
            if (isMounted) {
              setUser(null);
              setSession(null);
              setRole(null);
              setAuthError(verificationErr.message);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setRole(null);
        setVillageId(null);
        setBackendVerified(false);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
        setUser(newSession.user);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [checkHealth, verifyAdmin]);

  // Login handler
  const login = async (email, password) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      // 1. Supabase credentials check
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;
      if (!data.user || !data.session) {
        throw new Error('Authentication failed. No user session returned.');
      }

      // 2. Enforce admin role check via Express backend
      try {
        const { role: verifiedRole, villageId: vId } = await verifyAdmin(data.session.access_token, data.user.id);
        setUser(data.user);
        setSession(data.session);
        setRole(verifiedRole);
        setVillageId(vId);
        return { success: true };
      } catch (authzErr) {
        // Sign out immediately if not authorized as an admin
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
        setAuthError(authzErr.message);
        throw authzErr;
      }
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setRole(null);
      setVillageId(null);
      setBackendVerified(false);
      setAuthError(null);
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    role,
    villageId,
    backendVerified,
    backendOnline,
    isLoading,
    authError,
    login,
    logout,
    checkHealth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


