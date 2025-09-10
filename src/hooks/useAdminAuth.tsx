import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminSession, setAdminSession] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated and has admin role
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user has admin role
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
          
        if (!error && roleData) {
          setIsAdmin(true);
          setAdminSession(user.id);
        } else {
          setIsAdmin(false);
          setAdminSession(null);
        }
      } else {
        // Check for admin session token in localStorage for backwards compatibility
        const adminToken = localStorage.getItem('admin_session');
        if (adminToken && adminToken.startsWith('admin_')) {
          // Authenticate with hardcoded admin credentials
          const { error } = await supabase.auth.signInWithPassword({
            email: 'admin@admin.com',
            password: 'admin123456'
          });
          
          if (!error) {
            setAdminSession(adminToken);
            setIsAdmin(true);
          } else {
            localStorage.removeItem('admin_session');
            setIsAdmin(false);
            setAdminSession(null);
          }
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setAdminSession(null);
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (username: string, password: string) => {
    try {
      // Use the database function to authenticate admin
      const { data, error } = await supabase.rpc('authenticate_admin', {
        username_input: username,
        password_input: password
      });

      if (error) {
        console.error('Admin authentication error:', error);
        return { success: false, error: 'Authentication failed' };
      }

      // Type cast the response from the RPC function
      const result = data as { success: boolean; user_id?: string; message?: string };

      if (result?.success) {
        const sessionToken = 'admin_' + Date.now();
        localStorage.setItem('admin_session', sessionToken);
        setAdminSession(result.user_id || '');
        setIsAdmin(true);
        return { success: true };
      } else {
        return { success: false, error: result?.message || 'Invalid admin credentials' };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const adminLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local storage and state
      localStorage.removeItem('admin_session');
      setAdminSession(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Admin logout error:', error);
      // Ensure cleanup even if there's an error
      localStorage.removeItem('admin_session');
      setAdminSession(null);
      setIsAdmin(false);
    }
  };

  return {
    isAdmin,
    loading,
    adminSession,
    adminLogin,
    adminLogout,
    checkAdminStatus
  };
};