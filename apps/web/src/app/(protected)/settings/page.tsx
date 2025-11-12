'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Input } from '@momentum/ui';
import { Settings, Bell, Lock, Eye, Globe, Save, Palette, Upload, Image } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import BrandingSettings from '@/components/settings/BrandingSettings';

export default function SettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const isPatient = session?.user?.role === 'patient';
  const isLabTech = session?.user?.role === 'lab_tech';
  const canManageBranding = ['admin', 'super_admin'].includes(session?.user?.role || '');
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
      const response = await axios.get(`/api/hospitals/${session.user.hospitalId}/branding`);
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
    mutationFn: async (data: Partial<typeof brandingData>) => {
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
      // Don't send logoUrl - it should only be updated via the branding upload endpoint
      const { logoUrl, ...dataWithoutLogo } = brandingData;
      saveBrandingMutation.mutate(dataWithoutLogo);
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
            {canManageBranding && (
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
            )}
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
                      <p className="font-medium">{isPatient ? 'Appointment Reminders' : 'New Appointments'}</p>
                      <p className="text-sm text-muted-foreground">
                        {isPatient 
                          ? 'Get notified about your upcoming appointments'
                          : 'Get notified when new appointments are scheduled'}
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5 text-primary" />
                  </div>
                  {isPatient && (
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Test Results</p>
                        <p className="text-sm text-muted-foreground">
                          Notifications when lab results are released
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  {isPatient && (
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Billing Updates</p>
                        <p className="text-sm text-muted-foreground">
                          Notifications about new bills and payments
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  {!isPatient && (
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">{isLabTech ? 'Lab Test Updates' : 'Patient Updates'}</p>
                        <p className="text-sm text-muted-foreground">
                          {isLabTech 
                            ? 'Notifications about new lab test orders'
                            : 'Notifications about patient record changes'}
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  {!isPatient && !isLabTech && (
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Low Stock Alerts</p>
                        <p className="text-sm text-muted-foreground">
                          Alert when inventory items are running low
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex items-center justify-between py-3">
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
          {activeTab === 'branding' && canManageBranding && session?.user?.hospitalId && (
            <BrandingSettings 
              hospitalId={parseInt(session.user.hospitalId)}
              initialData={hospital}
            />
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
                  {!isPatient && !isLabTech && (
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
                  )}
                  {isPatient && (
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Medical Record Access</p>
                        <p className="text-sm text-muted-foreground">
                          Your medical records are only accessible to authorized hospital staff
                        </p>
                      </div>
                      <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <Lock className="w-4 h-4" />
                        Protected
                      </span>
                    </div>
                  )}
                  {!isPatient && !isLabTech && (
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <p className="font-medium">Activity Status</p>
                        <p className="text-sm text-muted-foreground">
                          Show when you're online
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">Data Sharing</p>
                      <p className="text-sm text-muted-foreground">
                        {isPatient
                          ? 'Share anonymized health data for medical research'
                          : 'Share anonymized data for research purposes'}
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

