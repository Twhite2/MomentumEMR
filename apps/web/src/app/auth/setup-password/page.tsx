'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Input } from '@momentum/ui';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Link from 'next/link';

function SetupPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/auth/setup-password?token=${token}`);
        setValidToken(true);
        setUserInfo(response.data.user);
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Invalid or expired token');
        setValidToken(false);
      } finally {
        setVerifying(false);
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Check password strength
  useEffect(() => {
    setPasswordStrength({
      length: formData.password.length >= 8,
      uppercase: /[A-Z]/.test(formData.password),
      lowercase: /[a-z]/.test(formData.password),
      number: /[0-9]/.test(formData.password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    });
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/setup-password', {
        token,
        password: formData.password,
      });

      toast.success('Password set successfully!');
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
        <div className="text-center">
          <Lock className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your link...</p>
        </div>
      </div>
    );
  }

  if (!token || !validToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid or Expired Link</h1>
          <p className="text-muted-foreground mb-6">
            This password setup link is invalid or has expired. Please contact your administrator for a new link.
          </p>
          <Link href="/login">
            <Button variant="primary">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Password Set Successfully!</h1>
          <p className="text-muted-foreground mb-6">
            Your account is now active. Redirecting you to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Set Up Your Password</h1>
          <p className="text-muted-foreground">Welcome to Momentum EMR</p>
        </div>

        {/* User Info */}
        {userInfo && (
          <div className="bg-primary/5 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">Setting up account for:</p>
            <p className="font-semibold text-foreground">{userInfo.name}</p>
            <p className="text-sm text-muted-foreground">{userInfo.email}</p>
            <p className="text-xs text-primary mt-1">
              {userInfo.hospitalName} • {userInfo.role.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicators */}
          {formData.password && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Password Requirements:</p>
              <div className="space-y-1">
                <div className={`flex items-center gap-2 text-xs ${passwordStrength.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordStrength.length ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 border border-current rounded-full" />}
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordStrength.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordStrength.uppercase ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 border border-current rounded-full" />}
                  <span>One uppercase letter</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordStrength.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordStrength.lowercase ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 border border-current rounded-full" />}
                  <span>One lowercase letter</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${passwordStrength.number ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {passwordStrength.number ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 border border-current rounded-full" />}
                  <span>One number</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
            disabled={loading || formData.password !== formData.confirmPassword || formData.password.length < 8}
          >
            Set Password & Activate Account
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Having trouble? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
        <div className="text-center">
          <Lock className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SetupPasswordForm />
    </Suspense>
  );
}
