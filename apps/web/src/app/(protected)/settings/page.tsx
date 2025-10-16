'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Input } from '@momentum/ui';
import { Settings, Bell, Lock, Eye, Globe, Save, Palette, Upload, Image } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function SettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [brandingData, setBrandingData] = useState({
    name: '',
    tagline: '',
    primaryColor: '#1253b2', // Momentum tory-blue
    secondaryColor: '#729ad2', // Momentum danube
    logoUrl: '',
  });

  // Fetch current hospital branding
  const { data: hospital } = useQuery({
    queryKey: ['hospital-branding', session?.user?.hospitalId],
    queryFn: async () => {
      if (!session?.user?.hospitalId) return null;
      const response = await axios.get(`/api/hospitals/${session.user.hospitalId}/theme`);
      return response.data;
    },
    enabled: !!session?.user?.hospitalId,
  });

  // Update form when hospital data loads
  useEffect(() => {
    if (hospital) {
      setBrandingData({
        name: hospital.name || '',
        tagline: hospital.tagline || '',
        primaryColor: hospital.primaryColor || '#1253b2',
        secondaryColor: hospital.secondaryColor || '#729ad2',
        logoUrl: hospital.logoUrl || '',
      });
    }
  }, [hospital]);

  // Save branding mutation
  const saveBrandingMutation = useMutation({
    mutationFn: async (data: typeof brandingData) => {
      const response = await axios.put(`/api/hospitals/${session?.user?.hospitalId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Branding updated successfully - Please refresh the page to see changes');
      queryClient.invalidateQueries({ queryKey: ['hospital-branding'] });
      // Reload page to apply new theme
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    },
    onError: () => {
      toast.error('Failed to update branding');
    },
  });

  const handleSave = () => {
    if (activeTab === 'branding') {
      saveBrandingMutation.mutate(brandingData);
    } else {
      toast.success('Settings saved successfully');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-border">
        <div className="border-b border-border">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'general'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'security'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'privacy'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Privacy
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'branding'
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Branding
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  General Preferences
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue">
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="yo">Yoruba</option>
                      <option value="ha">Hausa</option>
                      <option value="ig">Igbo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Timezone</label>
                    <select className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue">
                      <option value="WAT">West Africa Time (WAT)</option>
                      <option value="GMT">GMT</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date Format</label>
                    <select className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-tory-blue">
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium">New Appointments</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new appointments are scheduled
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium">Patient Updates</p>
                      <p className="text-sm text-muted-foreground">
                        Notifications about patient record changes
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium">Low Stock Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Alert when inventory items are running low
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive email summaries of your notifications
                      </p>
                    </div>
                    <input type="checkbox" className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Security Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Password</label>
                    <Input type="password" placeholder="Enter current password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">New Password</label>
                    <Input type="password" placeholder="Enter new password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                  <Button>Update Password</Button>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <h4 className="font-semibold mb-3">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </div>
            </div>
          )}

          {/* Branding Settings */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Hospital Branding
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Customize your hospital's appearance on the login screen and throughout the system
                </p>
                
                <div className="space-y-6">
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Hospital Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Recommended: 200x200px, PNG or SVG
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hospital Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Hospital Name</label>
                    <Input 
                      value={brandingData.name}
                      onChange={(e) => setBrandingData({ ...brandingData, name: e.target.value })}
                      placeholder="City General Hospital" 
                    />
                  </div>

                  {/* Tagline */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Tagline (Optional)</label>
                    <Input 
                      value={brandingData.tagline}
                      onChange={(e) => setBrandingData({ ...brandingData, tagline: e.target.value })}
                      placeholder="Your Health, Our Priority" 
                    />
                  </div>

                  {/* Primary Color */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={brandingData.primaryColor}
                        onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                        className="h-10 w-20 border border-border rounded cursor-pointer"
                      />
                      <Input 
                        value={brandingData.primaryColor}
                        onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                        placeholder="#0F4C81"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for buttons, headers, and primary UI elements
                    </p>
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Secondary Color</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={brandingData.secondaryColor}
                        onChange={(e) => setBrandingData({ ...brandingData, secondaryColor: e.target.value })}
                        className="h-10 w-20 border border-border rounded cursor-pointer"
                      />
                      <Input 
                        value={brandingData.secondaryColor}
                        onChange={(e) => setBrandingData({ ...brandingData, secondaryColor: e.target.value })}
                        placeholder="#4A90E2"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for accents and secondary UI elements
                    </p>
                  </div>

                  {/* Preview */}
                  <div className="mt-6 p-4 border border-border rounded-lg bg-muted/30">
                    <h4 className="text-sm font-semibold mb-3">Preview</h4>
                    <div className="bg-white p-6 rounded-lg border border-border">
                      <div className="flex items-center gap-3 mb-4">
                        {brandingData.logoUrl ? (
                          <img src={brandingData.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                        ) : (
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: brandingData.primaryColor }}>
                            {brandingData.name ? brandingData.name.charAt(0) : 'H'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-lg" style={{ color: brandingData.primaryColor }}>
                            {brandingData.name || 'Hospital Name'}
                          </p>
                          {brandingData.tagline && (
                            <p className="text-sm text-muted-foreground">{brandingData.tagline}</p>
                          )}
                        </div>
                      </div>
                      <Button style={{ backgroundColor: brandingData.primaryColor }} className="text-white">
                        Sample Button
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Privacy Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium">Profile Visibility</p>
                      <p className="text-sm text-muted-foreground">
                        Control who can see your profile information
                      </p>
                    </div>
                    <select className="px-3 py-2 border border-border rounded-md text-sm">
                      <option>Everyone</option>
                      <option>Hospital Staff Only</option>
                      <option>Private</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium">Activity Status</p>
                      <p className="text-sm text-muted-foreground">
                        Show when you're online
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">Data Sharing</p>
                      <p className="text-sm text-muted-foreground">
                        Share anonymized data for research purposes
                      </p>
                    </div>
                    <input type="checkbox" className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 pt-6 border-t border-border">
            <Button 
              onClick={handleSave}
              loading={activeTab === 'branding' && saveBrandingMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

