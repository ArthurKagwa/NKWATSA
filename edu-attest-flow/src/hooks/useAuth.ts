import { useState, useEffect } from 'react';
import { authManager, type User } from '@/lib/auth-client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authManager.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    authManager.loadFromStorage();
    
    // Subscribe to auth changes
    const unsubscribe = authManager.subscribe((user) => {
      setUser(user);
      setIsLoading(false);
    });

    setIsLoading(false);
    return unsubscribe;
  }, []);

  return {
    user,
    isLoading,
    signIn: authManager.signIn.bind(authManager),
    signOut: authManager.signOut.bind(authManager),
    hasRole: authManager.hasRole.bind(authManager),
    hasAnyRole: authManager.hasAnyRole.bind(authManager)
  };
}