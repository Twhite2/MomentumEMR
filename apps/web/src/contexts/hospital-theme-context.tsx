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
            
            // Convert B2 direct URL to proxied URL for private buckets
            let logoUrl = hospitalTheme.logoUrl;
            if (logoUrl) {
              try {
                const parsedUrl = new URL(logoUrl);
                // Validate hostname exactly matches allowed B2 domains
                const allowedHosts = ['backblazeb2.com', 's3.us-west-004.backblazeb2.com'];
                if (allowedHosts.includes(parsedUrl.hostname)) {
                  // Extract the key from the B2 URL
                  const urlParts = logoUrl.split('/file/emr-uploads/');
                  if (urlParts.length > 1) {
                    logoUrl = `/api/images/${urlParts[1]}`;
                  }
                }
              } catch (e) {
                // Invalid URL, leave as is
              }
            }
            
            setTheme({
              primaryColor: hospitalTheme.primaryColor || defaultTheme.primaryColor,
              secondaryColor: hospitalTheme.secondaryColor || defaultTheme.secondaryColor,
              logoUrl: logoUrl,
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
