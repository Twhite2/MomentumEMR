'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@momentum/ui';
import { Building2, ArrowLeft, Save, MapPin, Phone, Mail, Palette, Upload, Image } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

export default function NewHospitalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    contactEmail: '',
    password: '',
    subscriptionPlan: 'Basic',
    active: true,
    logoUrl: '',
    primaryColor: '#1253b2', // Momentum tory-blue
    secondaryColor: '#729ad2', // Momentum danube
    tagline: '',
  });

  const [creationResult, setCreationResult] = useState<any>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.post('/api/hospitals', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Hospital created successfully');
      setCreationResult(data);
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    },
    onError: () => {
      toast.error('Failed to create hospital');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFormData((prev) => ({ ...prev, logoUrl: response.data.url }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Show success message with setup link
  if (creationResult) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-border p-8 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-haze/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-green-haze" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Hospital Created Successfully!</h1>
            <p className="text-muted-foreground">
              {creationResult.hospital.name} has been registered in the system
            </p>
          </div>

          <div className="bg-primary/5 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">Admin Account Created</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{creationResult.adminUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{creationResult.adminUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium">Hospital Admin</span>
              </div>
            </div>
          </div>

          <div className="bg-green-haze/10 border border-green-haze/20 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-haze mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Account Ready to Use
            </h3>
            <p className="text-sm text-muted-foreground">
              The hospital admin account has been created and activated. The admin can now login using the email address and password you provided.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/hospitals" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Hospitals
              </Button>
            </Link>
            <Link href={`/hospitals/${creationResult.hospital.id}`} className="flex-1">
              <Button variant="primary" className="w-full">
                View Hospital Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hospitals">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hospitals
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Building2 className="w-8 h-8" />
              Add New Hospital
            </h1>
            <p className="text-muted-foreground mt-1">Register a new hospital in the system</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hospital Information */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Hospital Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Hospital Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="City General Hospital"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact Email *</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="admin@hospital.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Admin Password *</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password for admin account"
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Password for the hospital admin account (min. 8 characters)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+234 800 000 0000"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subscription Plan</label>
                <select
                  value={formData.subscriptionPlan}
                  onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue"
                >
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address *</label>
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground mt-2" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  placeholder="123 Medical Drive, Lagos, Nigeria"
                  className="flex-1 px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-tory-blue border-border rounded"
              />
              <label htmlFor="active" className="text-sm font-medium">
                Hospital Active (can accept patients and appointments)
              </label>
            </div>
          </div>
        </div>

        {/* Branding Section */}
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Hospital Branding
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Customize the hospital's appearance on the login screen and throughout the system
          </p>
          
          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Hospital Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <Image className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={uploadingLogo}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended: 200x200px, PNG or SVG
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tagline */}
              <div>
                <label className="block text-sm font-medium mb-2">Tagline (Optional)</label>
                <Input 
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Your Health, Our Priority"
                />
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="h-10 w-20 border border-border rounded cursor-pointer"
                  />
                  <Input 
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#0F4C81"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-sm font-medium mb-2">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="h-10 w-20 border border-border rounded cursor-pointer"
                  />
                  <Input 
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    placeholder="#4A90E2"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 border border-border rounded-lg bg-muted/30">
              <h4 className="text-sm font-semibold mb-3">Preview</h4>
              <div className="bg-white p-6 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-4">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: formData.primaryColor }}>
                      {formData.name ? formData.name.charAt(0) : 'H'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-lg" style={{ color: formData.primaryColor }}>
                      {formData.name || 'Hospital Name'}
                    </p>
                    {formData.tagline && <p className="text-sm text-muted-foreground">{formData.tagline}</p>}
                  </div>
                </div>
                <Button type="button" style={{ backgroundColor: formData.primaryColor }} className="text-white">
                  Sample Button
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/hospitals">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" loading={createMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Create Hospital
          </Button>
        </div>
      </form>
    </div>
  );
}

