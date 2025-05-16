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
  isLoading: false,
  setUser: (user) => set({ user }),
  setUserRoles: (roles) => set({ userRoles: roles }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  fetchUserRoles: async (userId: string) => {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;
      if (roles) {
        set({ userRoles: roles.map(r => r.role) });
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      set({ userRoles: [] });
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

      set({ user });
      await useAuthStore.getState().fetchUserRoles(user.id);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, roles) => {
    set({ isLoading: true });
    try {
      // First sign up the user
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('Signup failed');

      // Wait for auth to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{ 
          user_id: user.id,
          email,
          created_at: new Date().toISOString()
        }]);

      if (profileError) throw profileError;

      // Create user roles
      for (const role of roles) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: user.id,
            role,
            created_at: new Date().toISOString()
          }]);

        if (roleError) throw roleError;
      }

      set({ user, userRoles: roles });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
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
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));