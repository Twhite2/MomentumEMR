'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Input, Textarea } from '@momentum/ui';
import { Upload, Save, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Image from 'next/image';
import { useHospitalTheme } from '@/contexts/hospital-theme-context';

interface BrandingSettingsProps {
  hospitalId: number;
  initialData?: {
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    tagline?: string | null;
  };
}

export default function BrandingSettings({ hospitalId, initialData }: BrandingSettingsProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { updateTheme } = useHospitalTheme();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logoUrl || null);
  const [primaryColor, setPrimaryColor] = useState(initialData?.primaryColor || '#0F4C81');
  const [secondaryColor, setSecondaryColor] = useState(initialData?.secondaryColor || '#4A90E2');
  const [tagline, setTagline] = useState(initialData?.tagline || '');

  const canUpdate = ['admin', 'super_admin'].includes(session?.user?.role || '');

  const updateBranding = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.put(`/api/hospitals/${hospitalId}/branding`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Branding updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['hospital', hospitalId] });
      
      // Update logo preview with the new uploaded URL (with cache busting)
      const cacheBustedUrl = data.hospital?.logoUrl ? data.hospital.logoUrl + '?t=' + Date.now() : null;
      if (cacheBustedUrl) {
        setLogoPreview(cacheBustedUrl);
      }
      
      // Update theme context to refresh logo across the entire app (sidebar, etc.)
      updateTheme({
        logoUrl: cacheBustedUrl || undefined,
        primaryColor: data.hospital?.primaryColor || primaryColor,
        secondaryColor: data.hospital?.secondaryColor || secondaryColor,
        tagline: data.hospital?.tagline || tagline,
      });
      
      setLogoFile(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update branding');
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo file size must not exceed 2MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Logo must be an image file (JPEG, PNG, SVG, or WebP)');
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canUpdate) {
      toast.error('You do not have permission to update branding');
      return;
    }

    const formData = new FormData();
    
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    formData.append('primaryColor', primaryColor);
    formData.append('secondaryColor', secondaryColor);
    formData.append('tagline', tagline);

    updateBranding.mutate(formData);
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(initialData?.logoUrl || null);
  };

  return (
    <div className="bg-white rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold mb-6">Hospital Branding</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Hospital Logo</label>
          <div className="flex items-start gap-4">
            {logoPreview && (
              <div className="relative w-32 h-32 border border-border rounded-lg overflow-hidden bg-muted/20">
                <Image
                  src={logoPreview}
                  alt="Hospital Logo"
                  fill
                  className="object-contain p-2"
                  unoptimized
                  key={logoPreview}
                />
              </div>
            )}
            <div className="flex-1">
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {logoFile ? 'Change Logo' : 'Upload Logo'}
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                onChange={handleLogoChange}
                className="hidden"
                disabled={!canUpdate}
              />
              {logoFile && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{logoFile.name}</span>
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="text-red-ribbon hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Max file size: 2MB. Formats: JPEG, PNG, SVG, WebP
              </p>
            </div>
          </div>
        </div>

        {/* Primary Color */}
        <div>
          <label htmlFor="primaryColor" className="block text-sm font-medium mb-2">
            Primary Color
          </label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              id="primaryColor"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-12 w-24 border border-border rounded cursor-pointer"
              disabled={!canUpdate}
            />
            <Input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#0F4C81"
              className="flex-1 max-w-xs font-mono"
              disabled={!canUpdate}
            />
            <div 
              className="w-12 h-12 rounded border border-border"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Used for primary buttons, headers, and key UI elements
          </p>
        </div>

        {/* Secondary Color */}
        <div>
          <label htmlFor="secondaryColor" className="block text-sm font-medium mb-2">
            Secondary Color
          </label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              id="secondaryColor"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="h-12 w-24 border border-border rounded cursor-pointer"
              disabled={!canUpdate}
            />
            <Input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              placeholder="#4A90E2"
              className="flex-1 max-w-xs font-mono"
              disabled={!canUpdate}
            />
            <div 
              className="w-12 h-12 rounded border border-border"
              style={{ backgroundColor: secondaryColor }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Used for accents, links, and secondary UI elements
          </p>
        </div>

        {/* Tagline */}
        <div>
          <label htmlFor="tagline" className="block text-sm font-medium mb-2">
            Hospital Tagline
          </label>
          <Textarea
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Enter your hospital's tagline or motto"
            rows={3}
            disabled={!canUpdate}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Optional tagline displayed on login page and other public-facing areas
          </p>
        </div>

        {/* Submit Button */}
        {canUpdate && (
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              loading={updateBranding.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Branding
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
