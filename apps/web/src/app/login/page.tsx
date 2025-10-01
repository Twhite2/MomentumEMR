'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@momentum/ui';
import { toast } from 'sonner';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tory-blue/5 to-spindle/20">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Hospital Branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Momentum EMR" className="w-full h-full object-contain" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-tory-blue">Momentum EMR</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Electronic Medical Records System
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
                className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue"
                placeholder="user@hospital.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-tory-blue focus:ring-tory-blue border-border rounded"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-muted-foreground">
                  Remember me
                </label>
              </div>
              <a
                href="/forgot-password"
                className="text-sm text-tory-blue hover:underline"
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
              Need help? <a href="/support" className="text-tory-blue hover:underline">Contact Support</a>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-4 p-4 bg-white rounded-lg shadow">
          <p className="text-xs font-semibold mb-2">Demo Credentials:</p>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>Admin: admin@citygeneralhospital.com</p>
            <p>Doctor: sarah.johnson@citygeneralhospital.com</p>
            <p>Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
