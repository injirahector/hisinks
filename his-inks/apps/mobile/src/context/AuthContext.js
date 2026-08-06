import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── On mount: rehydrate session ──────────────────────────────────────────────
  useEffect(() => {
    const rehydrate = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) return;
        const res = await api.get('/auth/me');
        setUser(res.data.data.user);
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    rehydrate();
  }, []);

  // ── register ──────────────────────────────────────────────────────────────────
  async function register(formData) {
    const res = await api.post('/auth/register', formData);
    const { user: newUser, token } = res.data.data;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setUser(newUser);
    return newUser;
  }

  // ── login ─────────────────────────────────────────────────────────────────────
  async function login(credentials) {
    const res = await api.post('/auth/login', credentials);
    const { user: loggedIn, token } = res.data.data;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setUser(loggedIn);
    return loggedIn;
  }

  // ── logout ────────────────────────────────────────────────────────────────────
  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore server error — always clear local state
    } finally {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: Boolean(user), register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
