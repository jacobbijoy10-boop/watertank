import { create } from 'zustand';
import { supabase } from '@/config/supabase';
import { AuthState, UserProfile } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthStore extends AuthState {
    // Actions
    signIn: (email: string, password: string) => Promise<{ error?: any }>;
    signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: any }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error?: any }>;
    updateProfile: (profile: Partial<UserProfile>) => Promise<{ error?: any }>;
    checkSession: () => Promise<void>;
    setUser: (user: UserProfile | null) => void;
    setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,

    signIn: async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) return { error };

            if (data.user) {
                // Fetch user profile
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                set({
                    user: profile,
                    session: data.session,
                    isAuthenticated: true,
                });

                await AsyncStorage.setItem('user_session', JSON.stringify(data.session));
            }

            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    signUp: async (email: string, password: string, fullName?: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) return { error };

            // Profile is auto-created via database trigger
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    signOut: async () => {
        try {
            await supabase.auth.signOut();
            await AsyncStorage.removeItem('user_session');

            set({
                user: null,
                session: null,
                isAuthenticated: false,
            });
        } catch (error) {
            console.error('Sign out error:', error);
        }
    },

    resetPassword: async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'watertankmonitor://reset-password',
            });

            return { error };
        } catch (error) {
            return { error };
        }
    },

    updateProfile: async (profile: Partial<UserProfile>) => {
        try {
            const currentUser = get().user;
            if (!currentUser) return { error: new Error('No user logged in') };

            const { data, error } = await supabase
                .from('users')
                .update(profile)
                .eq('id', currentUser.id)
                .select()
                .single();

            if (error) return { error };

            set({ user: data });
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    checkSession: async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.warn('Session check failed:', error.message);
                set({ isLoading: false, isAuthenticated: false });
                return;
            }

            if (session?.user) {
                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profileError) {
                    console.warn('Profile fetch failed:', profileError.message);
                    set({ isLoading: false, isAuthenticated: false });
                    return;
                }

                set({
                    user: profile,
                    session,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                set({
                    user: null,
                    session: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            }
        } catch (error: any) {
            // Network or connection errors - fail gracefully
            console.warn('Network error during session check:', error?.message || 'Unknown error');
            set({
                isLoading: false,
                isAuthenticated: false,
                user: null,
                session: null,
            });
        }
    },

    setUser: (user: UserProfile | null) => set({ user }),
    setLoading: (isLoading: boolean) => set({ isLoading }),
}));
