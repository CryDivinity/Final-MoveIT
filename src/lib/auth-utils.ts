/**
 * Utility functions for robust authentication state management and database cleanup
 */

/**
 * Comprehensive browser cleanup - clears all auth data, cache, and cookies
 */
export const clearAllBrowserData = () => {
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
    });
    
    // Clear cache if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    console.log('All browser data cleared successfully');
  } catch (error) {
    console.warn('Error during browser data cleanup:', error);
  }
};

/**
 * Cleans up all auth-related data from browser storage
 * This prevents auth "limbo" states where sessions get corrupted
 */
export const cleanupAuthState = () => {
  try {
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });

    // Remove from sessionStorage if available
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    }

    console.log('Auth state cleaned up successfully');
  } catch (error) {
    console.warn('Error during auth cleanup:', error);
  }
};

/**
 * Database cleanup function to remove incomplete user data
 */
export const cleanupIncompleteUser = async (supabase: any, userId: string) => {
  try {
    await supabase.rpc('cleanup_incomplete_user', { target_user_id: userId });
    console.log(`Cleaned up incomplete user data for ${userId}`);
  } catch (error) {
    console.error('Error cleaning up user data:', error);
  }
};

/**
 * Performs a robust sign out that handles corrupted session states
 */
export const robustSignOut = async (supabase: any) => {
  try {
    // First, clean up existing state
    cleanupAuthState();
    
    // Attempt global sign out (this might fail if session is corrupted)
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      // Ignore errors from corrupted sessions
      console.warn('Sign out attempt failed, but continuing with cleanup:', err);
    }
    
    // Force a page reload to ensure clean state
    window.location.href = '/auth';
  } catch (error) {
    // Even if everything fails, redirect to auth page
    console.error('Robust sign out error:', error);
    window.location.href = '/auth';
  }
};

/**
 * Complete system reset - clears everything and redirects to auth
 */
export const performSystemReset = async (supabase: any) => {
  try {
    console.log('Performing complete system reset...');
    
    // First try to sign out
    await robustSignOut(supabase);
    
    // Clear all browser data
    clearAllBrowserData();
    
    // Redirect to auth page
    window.location.href = '/auth';
  } catch (error) {
    console.error('System reset error:', error);
    // Force reload as fallback
    window.location.reload();
  }
};