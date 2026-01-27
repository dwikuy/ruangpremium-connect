import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { AppRole, UserProfile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch user profile and role
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Get role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) throw roleError;

      // Get points balance
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      // Get wallet balance for resellers
      let walletBalance = 0;
      if (roleData?.role === 'reseller') {
        const { data: walletData } = await supabase
          .from('reseller_wallets')
          .select('balance')
          .eq('user_id', userId)
          .maybeSingle();
        walletBalance = walletData?.balance || 0;
      }

      if (profileData) {
        setProfile({
          ...profileData,
          role: (roleData?.role as AppRole) || 'member',
          points_balance: pointsData?.balance || 0,
          wallet_balance: walletBalance,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer profile fetch to avoid blocking
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { name },
        },
      });

      if (error) throw error;

      toast({
        title: 'Registrasi Berhasil!',
        description: 'Akun Anda telah dibuat. Selamat berbelanja!',
      });

      return { data, error: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast({
        title: 'Registrasi Gagal',
        description: message,
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Login Berhasil!',
        description: 'Selamat datang kembali!',
      });

      return { data, error: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast({
        title: 'Login Gagal',
        description: message,
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setProfile(null);

      toast({
        title: 'Logout Berhasil',
        description: 'Sampai jumpa lagi!',
      });

      navigate('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast({
        title: 'Logout Gagal',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Email Terkirim',
        description: 'Silakan cek email Anda untuk reset password.',
      });

      return { error: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast({
        title: 'Gagal Mengirim Email',
        description: message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isReseller = profile?.role === 'reseller';
  const isMember = profile?.role === 'member';

  return {
    user,
    session,
    profile,
    loading,
    isAdmin,
    isReseller,
    isMember,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshProfile: () => user && fetchProfile(user.id),
  };
}
