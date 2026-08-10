import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

const TOKEN_KEY = 'his_inks_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored session

  // ── On mount: rehydrate session from stored token ───────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.data.user);
        connectSocket(token);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── register ─────────────────────────────────────────────────────────────────
  async function register(formData) {
    // formData may include referralCode — pass it through to the backend as-is
    const res = await api.post('/auth/register', formData);
    const { user: newUser, token } = res.data.data;
    localStorage.setItem(TOKEN_KEY, token);
    setUser(newUser);
    connectSocket(token);
    return newUser;
  }

  // ── login ─────────────────────────────────────────────────────────────────────
  async function login(credentials) {
    const res = await api.post('/auth/login', credentials);
    const { user: loggedIn, token } = res.data.data;
    localStorage.setItem(TOKEN_KEY, token);
    setUser(loggedIn);
    connectSocket(token);
    return loggedIn;
  }

  // ── logout ────────────────────────────────────────────────────────────────────
  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore server errors — clear client state regardless
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      disconnectSocket();
    }
  }

  // ── googleLogin ───────────────────────────────────────────────────────────────
  // Called after Google Identity Services returns a credential (ID token).
  // Sends it to our backend which verifies it and returns our own JWT.
  // referralCode is optional — passed when coming from /register?ref=CODE.
  async function googleLogin(credential, referralCode) {
    const res = await api.post('/auth/google', {
      credential,
      referralCode: referralCode || undefined,
    });
    const { user: authedUser, token } = res.data.data;
    localStorage.setItem(TOKEN_KEY, token);
    setUser(authedUser);
    connectSocket(token);
    return authedUser;
  }

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    register,
    login,
    logout,
    googleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export default AuthContext;
