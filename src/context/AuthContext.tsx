import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { UserDto } from '../../shared/auth';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

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
}

const AuthContext = createContext<AuthContextType>({
  status: 'loading',
  user: null,
  isLoggedIn: false,
  userEmail: null,
  requestCode: async () => {},
  verifyCode: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserDto | null>(null);

  useEffect(() => {
    // La sesión antigua se guardaba en localStorage y no tenía ninguna validez real.
    try {
      localStorage.removeItem('gorilla_auth_email');
    } catch {
      /* sin acceso a localStorage: no hay nada que limpiar */
    }

    let cancelled = false;
    api<{ user: UserDto }>('/me')
      .then(({ user }) => {
        if (cancelled) return;
        setUser(user);
        setStatus('authenticated');
      })
      .catch((err) => {
        if (cancelled) return;
        // Un 401 es lo normal para quien no ha iniciado sesión; otros errores (servidor
        // caído) también se tratan como anónimo para no bloquear las páginas públicas.
        if (!(err instanceof ApiError) || err.status !== 401) console.warn('No se pudo comprobar la sesión', err);
        setUser(null);
        setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
