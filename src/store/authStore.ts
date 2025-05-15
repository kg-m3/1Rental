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
      // First check if the user already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

      // Proceed with signup if user doesn't exist
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('Signup failed');

      // Wait a moment for the auth user to be fully created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create user profile using service role client to bypass RLS
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{ 
          user_id: user.id, 
          email,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(user.id);
        throw new Error('Failed to create user profile. Please try again.');
      }

      // Insert user roles
      const rolePromises = roles.map(role => 
        supabase
          .from('user_roles')
          .insert([{ 
            user_id: user.id, 
            role,
            created_at: new Date().toISOString()
          }])
      );

      await Promise.all(rolePromises);
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