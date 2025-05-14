import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  userRoles: string[];
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setUserRoles: (roles: string[]) => void;
  setIsLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, roles: string[]) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUserRoles: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userRoles: [],
  isLoading: true,
  setUser: (user) => set({ user }),
  setUserRoles: (roles) => set({ userRoles: roles }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  fetchUserRoles: async (userId: string) => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (roles) {
      set({ userRoles: roles.map(r => r.role) });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!user) throw new Error('Sign in failed');

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (roles) {
        set({ userRoles: roles.map(r => r.role) });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, roles) => {
    set({ isLoading: true });
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (!user) throw new Error('Signup failed');

      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([
            {
              user_id: user.id,
              email: email,
            },
          ]);

        if (profileError) throw profileError;

        const roleInserts = roles.map(role => ({
          user_id: user.id,
          role: role
        }));

        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert(roleInserts);

        if (rolesError) throw rolesError;

        set({ userRoles: roles });
      } catch (err) {
        await supabase.auth.admin.deleteUser(user.id);
        throw err;
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, userRoles: [] });
    } finally {
      set({ isLoading: false });
    }
  },
}));