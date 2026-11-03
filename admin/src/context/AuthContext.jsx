import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { verifyBackendAdminRole, getBackendHealth } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [villageId, setVillageId] = useState(null);
  const [adminProfile, setAdminProfile] = useState(() => {
    try {
      const cached = localStorage.getItem('aapla_admin_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
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

  // Fetch or assemble comprehensive admin profile details
  const loadAdminProfile = useCallback(async (userObj, vId) => {
    if (!userObj) return null;
    try {
      // 1. Fetch from profiles table
      let dbProfile = null;
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userObj.id)
          .maybeSingle();
        dbProfile = prof;
      } catch (err) {
        console.warn('Profile fetch warning:', err);
      }

      // 2. Resolve village information
      const targetVillageId = dbProfile?.village_id || vId || userObj.user_metadata?.village_id;
      let villageData = null;
      if (targetVillageId) {
        try {
          const { data: v } = await supabase
            .from('villages')
            .select('*')
            .eq('id', targetVillageId)
            .maybeSingle();
          villageData = v;
        } catch (e) {}
      }

      const combined = {
        id: userObj.id,
        email: userObj.email,
        full_name: dbProfile?.full_name || userObj.user_metadata?.full_name || 'Mohit Chaudhari',
        phone_number: dbProfile?.phone_number || userObj.user_metadata?.phone_number || '',
        role: dbProfile?.role || userObj.user_metadata?.role || 'admin',
        designation: userObj.user_metadata?.designation || 'प्रशासक',
        avatar_url: userObj.user_metadata?.avatar_url || '/profile.jpg',
        village_id: targetVillageId || null,
        village_name: villageData?.name || userObj.user_metadata?.village_name || 'अहमदपूर',
        state: villageData?.state || userObj.user_metadata?.state || 'Maharashtra',
        district: villageData?.district || userObj.user_metadata?.district || 'लातूर',
        taluka: villageData?.taluka || userObj.user_metadata?.taluka || 'अहमदपूर',
      };

      setAdminProfile(combined);
      try {
        localStorage.setItem('aapla_admin_profile', JSON.stringify(combined));
      } catch (e) {}
      return combined;
    } catch (err) {
      console.warn('Error loading admin profile:', err);
      return null;
    }
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
      setBackendVerified(false);
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
            const authResult = await verifyAdmin(currentSession.access_token, currentSession.user.id);
            if (isMounted) {
              setSession(currentSession);
              setUser(currentSession.user);
              await loadAdminProfile(currentSession.user, authResult.villageId);
            }
          } catch (verificationErr) {
            console.error('Session admin verification failed:', verificationErr.message);
            await supabase.auth.signOut();
            if (isMounted) {
              setUser(null);
              setSession(null);
              setRole(null);
              setAdminProfile(null);
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
        setAdminProfile(null);
        setBackendVerified(false);
        setIsLoading(false);
        try {
          localStorage.removeItem('aapla_admin_profile');
        } catch (e) {}
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
        setUser(newSession.user);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [checkHealth, verifyAdmin, loadAdminProfile]);

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
        await loadAdminProfile(data.user, vId);
        return { success: true };
      } catch (authzErr) {
        // Sign out immediately if not authorized as an admin
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
        setAdminProfile(null);
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

  // Admin Registration handler
  const registerAdmin = async (formData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const email = formData.email.trim();
      const password = formData.password;
      const fullName = formData.fullName.trim();
      const phone = formData.phone.trim();
      const designation = formData.designation?.trim() || 'प्रशासक';
      const villageIdVal = formData.villageId || null;
      const villageNameVal = formData.villageName || '';
      const stateVal = formData.state || 'Maharashtra';
      const districtVal = formData.district || '';
      const talukaVal = formData.taluka || '';
      const avatarUrlVal = formData.avatarUrl || '/profile.jpg';

      // 1. Register with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phone,
            role: 'admin',
            designation,
            village_id: villageIdVal,
            village_name: villageNameVal,
            state: stateVal,
            district: districtVal,
            taluka: talukaVal,
            avatar_url: avatarUrlVal,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data?.user) {
        throw new Error('Registration failed: No user returned by authentication service.');
      }

      // 2. Insert / Upsert into profiles table
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          phone_number: phone,
          role: 'admin',
          village_id: villageIdVal,
        });
      } catch (profErr) {
        console.warn('Notice on profiles upsert:', profErr.message);
      }

      const combinedProfile = {
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        phone_number: phone,
        role: 'admin',
        designation,
        avatar_url: avatarUrlVal,
        village_id: villageIdVal,
        village_name: villageNameVal,
        state: stateVal,
        district: districtVal,
        taluka: talukaVal,
      };

      try {
        localStorage.setItem('aapla_admin_profile', JSON.stringify(combinedProfile));
      } catch (e) {}

      // 3. If session returned, automatically activate session
      if (data.session) {
        setUser(data.user);
        setSession(data.session);
        setRole('admin');
        setVillageId(villageIdVal);
        setAdminProfile(combinedProfile);
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        profile: combinedProfile,
      };
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update Admin Profile handler
  const updateAdminProfile = async (updates) => {
    try {
      const merged = { ...adminProfile, ...updates };
      setAdminProfile(merged);
      try {
        localStorage.setItem('aapla_admin_profile', JSON.stringify(merged));
      } catch (e) {}

      if (updates.village_id) {
        setVillageId(updates.village_id);
      }

      // Update Supabase Auth user metadata
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: merged.full_name,
            phone_number: merged.phone_number,
            designation: merged.designation,
            avatar_url: merged.avatar_url,
            village_id: merged.village_id,
            village_name: merged.village_name,
            state: merged.state,
            district: merged.district,
            taluka: merged.taluka,
          },
        });
      } catch (e) {
        console.warn('Auth metadata update notice:', e);
      }

      // Update public.profiles table
      if (user?.id) {
        try {
          await supabase
            .from('profiles')
            .update({
              full_name: merged.full_name,
              phone_number: merged.phone_number,
              village_id: merged.village_id || null,
            })
            .eq('id', user.id);
        } catch (e) {
          console.warn('Profiles table update notice:', e);
        }
      }

      return { success: true, profile: merged };
    } catch (err) {
      console.error('Error updating admin profile:', err);
      throw err;
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
      setAdminProfile(null);
      setBackendVerified(false);
      setAuthError(null);
      setIsLoading(false);
      try {
        localStorage.removeItem('aapla_admin_profile');
      } catch (e) {}
    }
  };

  const value = {
    user,
    session,
    role,
    villageId,
    adminProfile,
    backendVerified,
    backendOnline,
    isLoading,
    authError,
    login,
    registerAdmin,
    updateAdminProfile,
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
