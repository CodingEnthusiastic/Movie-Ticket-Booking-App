/**
 * ============================================================================
 * AUTH CONTEXT & PROVIDER (frontend/src/context/AuthContext.tsx)
 * ============================================================================
 *
 * 🎓 FOR VIBE CODERS - CONCEPT EXPLAINER:
 * ----------------------------------------------------------------------------
 * 1. What is React Context?
 *    Imagine your app is a huge building. Without Context, if the Penthouse (a page)
 *    needs to know who is logged in, you'd have to pass the user's name through every
 *    single floor (prop drilling).
 *    Context is like a central radio tower: any component in the app can tune in
 *    using `useAuth()` to instantly see the current user and login/logout functions!
 *
 * 2. What is `useState`?
 *    `useState` is a React hook that gives a component a "memory box".
 *    `const [user, setUser] = useState<User | null>(null);`
 *    - `user` is the current value inside the memory box.
 *    - `setUser` is the ONLY function allowed to update that box.
 *    - Whenever you call `setUser(...)`, React automatically re-renders the screen
 *      with the new value!
 *
 * 3. What is `useEffect`?
 *    `useEffect` is a React hook used to perform "side-effects" (things that happen
 *    outside React's render cycle, like fetching data from an API or reading localStorage).
 *    `useEffect(() => { ... }, []);`
 *    The empty array `[]` at the end is the dependency array. It tells React:
 *    "Run this code ONLY ONCE when the app first opens in the browser!"
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types.js';
import { api } from '../api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // `useState` Hook: Keeps track of the logged-in user object
  const [user, setUser] = useState<User | null>(null);

  // `useState` Hook: Keeps track of the JWT authentication token string
  const [token, setToken] = useState<string | null>(null);

  // `useState` Hook: Indicates if we are still checking localStorage on initial page load
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * `useEffect` Hook:
   * Runs once when the website loads in the browser.
   * Checks if user was previously logged in by reading token & user data from localStorage.
   */
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('yozigo_token');
      const savedUser = localStorage.getItem('yozigo_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to parse saved user credentials from localStorage:', e);
      localStorage.removeItem('yozigo_token');
      localStorage.removeItem('yozigo_user');
    } finally {
      setIsLoading(false);
    }
  }, []); // [] means "run only once on page mount"

  /**
   * Function: Log In with Email and Password
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      // Save credentials in component state
      setToken(receivedToken);
      setUser(receivedUser);

      // Persist in browser localStorage so page refreshes don't log the user out
      localStorage.setItem('yozigo_token', receivedToken);
      localStorage.setItem('yozigo_user', JSON.stringify(receivedUser));

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please check your credentials.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Function: Sign Up a New Customer
   */
  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post('/auth/signup', { name, email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      setToken(receivedToken);
      setUser(receivedUser);

      localStorage.setItem('yozigo_token', receivedToken);
      localStorage.setItem('yozigo_user', JSON.stringify(receivedUser));

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Signup failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Function: Log Out
   * Clears state and removes tokens from browser storage.
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('yozigo_token');
    localStorage.removeItem('yozigo_user');
  };

  // Helper boolean: returns true if logged-in user is an admin
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom Hook: `useAuth()`
 * Any component can call `const { user, login, logout } = useAuth()` to access auth state!
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider component.');
  }
  return context;
};
