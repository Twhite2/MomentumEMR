'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@momentum/ui';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  variant?: 'ghost' | 'outline' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * BackButton - Navigates to the previous page in browser history
 * 
 * This component uses router.back() to return to the previous page,
 * regardless of where the user came from. This provides better UX
 * than hardcoded routes.
 * 
 * @example
 * <BackButton />
 * <BackButton label="Back to Dashboard" />
 * <BackButton variant="outline" size="md" />
 */
export function BackButton({ 
  label = 'Back', 
  variant = 'ghost', 
  size = 'sm',
  className = ''
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleBack}
      className={className}
      type="button"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}
