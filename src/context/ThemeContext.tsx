import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  isAuto: boolean;
}

/**
 * Determina el tema según la hora local del usuario:
 * - Día (07:00 a 19:59): Modo claro ('light') - Versión principal de la web.
 * - Noche (20:00 a 06:59): Modo oscuro ('dark') - Automático nocturno.
 */
export const getAutoThemeByTime = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'light';
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 20 || currentHour < 7;
  return isNight ? 'dark' : 'light';
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  isAuto: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuto, setIsAuto] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !sessionStorage.getItem('gorilla_theme_manual_override');
  });

  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'light';

    // Limpieza de claves estáticas obsoletas de versiones previas
    try {
      localStorage.removeItem('gorilla_theme');
    } catch {
      // noop
    }

    // 1. Si el usuario alternó manualmente en esta sesión, respetar su decisión
    const manual = sessionStorage.getItem('gorilla_theme_manual_override');
    if (manual === 'light' || manual === 'dark') {
      return manual;
    }

    // 2. Si no hay elección manual, aplicar la lógica automática por hora:
    // De día -> claro ('light', versión principal)
    // De noche -> oscuro ('dark')
    return getAutoThemeByTime();
  });

  // Escuchar y actualizar automáticamente el tema cada minuto si está en modo automático
  useEffect(() => {
    const checkTimeTheme = () => {
      const manual = sessionStorage.getItem('gorilla_theme_manual_override');
      if (!manual) {
        const autoTheme = getAutoThemeByTime();
        setThemeState(prev => (prev !== autoTheme ? autoTheme : prev));
      }
    };

    // Verificación periódica por si cambia de día a noche con la pestaña abierta
    const interval = setInterval(checkTimeTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sincronizar clases CSS en el documento HTML
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
      if (document.body) {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      }
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
      if (document.body) {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      }
    }
  }, [theme]);

  const setTheme = (newTheme: 'dark' | 'light') => {
    try {
      sessionStorage.setItem('gorilla_theme_manual_override', newTheme);
    } catch {
      // noop
    }
    setIsAuto(false);
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        sessionStorage.setItem('gorilla_theme_manual_override', next);
      } catch {
        // noop
      }
      setIsAuto(false);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isAuto }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
