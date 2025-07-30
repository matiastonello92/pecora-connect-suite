/**
 * Auth Service
 * Centralizes authentication logic
 */

import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export class AuthService {
  static async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  static async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  }

  static async signOut() {
    return await supabase.auth.signOut();
  }

  static async resetPassword(email: string) {
    return await supabase.auth.resetPasswordForEmail(email);
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }
}