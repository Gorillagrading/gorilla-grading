import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { UserDto } from '../../shared/auth';

/** `error`: no se pudo comprobar la sesión (servidor sin respuesta). No es lo mismo que no haber iniciado sesión. */
type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error';

interface AuthContextType {
  status: AuthStatus;
  user: UserDto | null;
  isLoggedIn: boolean;
  userEmail: string | null;
  /** Envía un código de acceso al email. */
  requestCode: (email: string, locale: 'es' | 'en') => Promise<void>;
  /** Comprueba el código; si es correcto la sesión queda iniciada. */
  verifyCode: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Vuelve a comprobar la sesión tras un error. */
  retrySession: () => void;
}

const AuthContext = createContext<AuthContextType>({
  status: 'loading',
  user: null,
  isLoggedIn: false,
  userEmail: null,
  requestCode: async () => {},
  verifyCode: async () => {},
  logout: async () => {},
  retrySession: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserDto | null>(null);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // La sesión antigua se guardaba en localStorage y no tenía ninguna validez real.
    try {
      localStorage.removeItem('gorilla_auth_email');
    } catch {
      /* sin acceso a localStorage: no hay nada que limpiar */
    }

    let cancelled = false;
    // Hasta dos intentos de 8 s: un servidor que tarda en despertar no deja la página en blanco para siempre.
    const check = async () => {
      for (let i = 0; i < 2; i++) {
        try {
          const { user } = await api<{ user: UserDto }>('/me', { timeoutMs: 8000 });
          if (cancelled) return;
          setUser(user);
          setStatus('authenticated');
          return;
        } catch (err) {
          if (cancelled) return;
          // Un 401 es lo normal para quien no ha iniciado sesión.
          if (err instanceof ApiError && err.status === 401) {
            setUser(null);
            setStatus('anonymous');
            return;
          }
          console.warn('No se pudo comprobar la sesión', err);
        }
      }
      if (!cancelled) {
        setUser(null);
        setStatus('error');
      }
    };
    setStatus('loading');
    void check();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retrySession = useCallback(() => setAttempt((n) => n + 1), []);

  const requestCode = useCallback(async (email: string, locale: 'es' | 'en') => {
    await api('/auth/otp', { body: { email, locale } });
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    const { user } = await api<{ user: UserDto }>('/auth/otp/verify', { body: { email, code } });
    setUser(user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        isLoggedIn: status === 'authenticated',
        userEmail: user?.email ?? null,
        requestCode,
        verifyCode,
        logout,
        retrySession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
