import { SiweMessage } from 'siwe';
import { dataStore } from './storage';

export interface User {
  wallet: string;
  roles: string[];
  displayName?: string;
}

export class AuthManager {
  private static instance: AuthManager;
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify() {
    this.listeners.forEach(callback => callback(this.currentUser));
  }

  async signIn(wallet: string, signature: string, message: string): Promise<boolean> {
    try {
      const siweMessage = new SiweMessage(message);
      const fields = await siweMessage.verify({ signature });

      if (!fields.success) {
        throw new Error('Invalid signature');
      }

      // Check if user exists, if not create them
      let userData = await dataStore.getUserProfile(wallet);
      if (!userData) {
        await dataStore.registerNewUser(wallet);
        userData = await dataStore.getUserProfile(wallet);
      }

      const roles = await dataStore.getUserRoles(wallet);

      this.currentUser = {
        wallet,
        roles,
        displayName: userData?.display_name ?? undefined
      };

      localStorage.setItem('nkwatsa-ai-session', JSON.stringify(this.currentUser));

      this.notify();
      return true;
    } catch (error) {
      console.error('Sign in failed:', error);
      return false;
    }
  }

  signOut() {
    this.currentUser = null;
    localStorage.removeItem('nkwatsa-ai-session');
    this.notify();
  }

  loadFromStorage() {
    const stored = localStorage.getItem('nkwatsa-ai-session');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        this.notify();
      } catch (error) {
        localStorage.removeItem('nkwatsa-ai-session');
      }
    }
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role) ?? false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }
}

export const authManager = AuthManager.getInstance();
