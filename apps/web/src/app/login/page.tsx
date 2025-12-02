'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@momentum/ui';
import { toast } from 'sonner';
import Image from 'next/image';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

interface HospitalBranding {
  id: number;
  name: string;
  subdomain: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  tagline: string | null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [branding, setBranding] = useState<HospitalBranding | null>(null);
  const [brandingLoading, setBrandingLoading] = useState(true);

  // Fetch hospital branding based on subdomain
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await axios.get('/api/branding/public');
        setBranding(response.data.hospital);
        
        // Apply CSS variables for dynamic theming
        if (response.data.hospital) {
          document.documentElement.style.setProperty('--color-primary', response.data.hospital.primaryColor);
          document.documentElement.style.setProperty('--color-secondary', response.data.hospital.secondaryColor);
        }
      } catch (error) {
        console.log('No subdomain branding found, using default');
        // Use default branding
      } finally {
        setBrandingLoading(false);
      }
    };

    fetchBranding();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Login successful!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while branding loads
  if (brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tory-blue/5 to-spindle/20">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center" 
      style={{
        background: branding 
          ? `linear-gradient(to bottom right, ${branding.primaryColor}10, ${branding.secondaryColor}20)`
          : 'linear-gradient(to bottom right, rgba(15, 76, 129, 0.05), rgba(74, 144, 226, 0.2))'
      }}
    >
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Hospital Branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <div className="w-64 h-32 flex items-center justify-center overflow-hidden">
                <img 
                  src={branding?.logoUrl || '/logo.png'} 
                  alt={branding?.name || 'Momentum EMR'} 
                  className="w-full h-full object-contain" 
                />
              </div>
            </div>
            <h1 className="text-xl font-bold mb-1" style={{ color: branding?.primaryColor || '#0F4C81' }}>
              {branding?.name || 'Momentum EMR'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {branding?.tagline || 'Electronic Medical Records System'}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="user@hospital.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-12 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-muted-foreground">
                  Remember me
                </label>
              </div>
              <a
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-spindle/20 rounded-md">
            <p className="text-xs text-center text-muted-foreground">
              🔒 Secure login with 2FA for privileged users
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>© 2025 Momentum Healthcare Solutions. All rights reserved.</p>
            <p className="mt-1">
              Need help? <a href="https://www.momentumhealthcare.org/contact-us" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

