'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface HospitalTheme {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  tagline?: string;
}

interface HospitalThemeContextType {
  theme: HospitalTheme;
  updateTheme: (theme: Partial<HospitalTheme>) => void;
}

const defaultTheme: HospitalTheme = {
  primaryColor: '#1253b2', // Momentum tory-blue
  secondaryColor: '#729ad2', // Momentum danube
};

const HospitalThemeContext = createContext<HospitalThemeContextType>({
  theme: defaultTheme,
  updateTheme: () => {},
});

export function HospitalThemeProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<HospitalTheme>(defaultTheme);

  useEffect(() => {
    // Only load hospital theme for hospital users, NOT for super admins
    const loadHospitalTheme = async () => {
      // Super admin should always see default Momentum theme
      if (session?.user?.role === 'super_admin') {
        setTheme(defaultTheme);
        return;
      }

      // Load custom theme for hospital staff
      if (session?.user?.hospitalId) {
        try {
          const response = await fetch(`/api/hospitals/${session.user.hospitalId}/theme`);
          if (response.ok) {
            const hospitalTheme = await response.json();
            setTheme({
              primaryColor: hospitalTheme.primaryColor || defaultTheme.primaryColor,
              secondaryColor: hospitalTheme.secondaryColor || defaultTheme.secondaryColor,
              logoUrl: hospitalTheme.logoUrl,
              tagline: hospitalTheme.tagline,
            });
          }
        } catch (error) {
          console.error('Failed to load hospital theme:', error);
          setTheme(defaultTheme);
        }
      } else {
        // No hospitalId means use default theme
        setTheme(defaultTheme);
      }
    };

    loadHospitalTheme();
  }, [session?.user?.hospitalId, session?.user?.role]);

  // Apply theme colors to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', theme.primaryColor);
    document.documentElement.style.setProperty('--color-secondary', theme.secondaryColor);
  }, [theme]);

  const updateTheme = (newTheme: Partial<HospitalTheme>) => {
    setTheme((prev) => ({ ...prev, ...newTheme }));
  };

  return (
    <HospitalThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </HospitalThemeContext.Provider>
  );
}

export function useHospitalTheme() {
  const context = useContext(HospitalThemeContext);
  if (!context) {
    throw new Error('useHospitalTheme must be used within HospitalThemeProvider');
  }
  return context;
}
