'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { ArrowLeft, Save, Info, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

interface HMO {
  id: number;
  name: string;
  policyName?: string;
  provider?: string;
}

interface CorporateClient {
  id: number;
  companyName: string;
}

interface Staff {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function NewPatientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const { data: session } = useSession();
  const [patientType, setPatientType] = useState('self_pay');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Nurses cannot assign doctors or manage insurance/billing
  const isNurse = session?.user?.role === 'nurse';
  const canAssignDoctor = !isNurse;

  // Fetch user data if userId is provided
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await axios.get(`/api/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    patientType: 'self_pay',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    emergencyContact: '',
    insuranceId: '',
    hmoEnrolleeNumber: '',
    corporateClientId: '',
    primaryDoctorId: '',
  });

  // Pre-fill form with user data if available
  useEffect(() => {
    if (userData) {
      // Split name into first and last name
      const nameParts = userData.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData(prev => ({
        ...prev,
        firstName,
        lastName,
        email: userData.email || '',
      }));
    }
  }, [userData]);

  // Fetch HMO policies
  const { data: hmoList } = useQuery<HMO[]>({
    queryKey: ['hmo'],
    queryFn: async () => {
      const response = await axios.get('/api/hmo');
      return response.data;
    },
  });

  // Fetch Corporate Clients
  const { data: corporateClients } = useQuery<CorporateClient[]>({
    queryKey: ['corporate-clients'],
    queryFn: async () => {
      const response = await axios.get('/api/corporate-clients');
      return response.data;
    },
  });

  // Fetch Doctors/Staff for assignment
  const { data: staffData } = useQuery<{ staff: Staff[] }>({
    queryKey: ['staff-doctors'],
    queryFn: async () => {
      const response = await axios.get('/api/staff?role=doctor');
      return response.data;
    },
  });

  // Create patient mutation
  const createPatient = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/patients', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Patient registered successfully!');
      
      // Show password confirmation
      if (data.temporaryPassword) {
        if (formData.password) {
          // Custom password was used
          toast.success(`Account created with your custom password`, {
            duration: 5000,
          });
        } else {
          // Auto-generated password
          toast.success(`Account created! Auto-generated password: ${data.temporaryPassword}`, {
            duration: 10000,
          });
        }
      }
      
      router.push(`/patients/${data.patient.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to register patient');
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'patientType') {
      setPatientType(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match if password is provided
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Build contact info
    const contactInfo: any = {};
    if (formData.phone) contactInfo.phone = formData.phone;
    if (formData.email) contactInfo.email = formData.email;

    const payload: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dob: formData.dob,
      gender: formData.gender,
      patientType: formData.patientType,
      contactInfo,
      password: formData.password || undefined, // Include password if provided
      address: formData.address || null,
      emergencyContact: formData.emergencyContact || null,
      insuranceId: formData.patientType === 'hmo' && formData.insuranceId ? formData.insuranceId : null,
      hmoEnrolleeNumber: formData.patientType === 'hmo' && formData.hmoEnrolleeNumber ? formData.hmoEnrolleeNumber : null,
      corporateClientId:
        formData.patientType === 'corporate' && formData.corporateClientId
          ? formData.corporateClientId
          : null,
      primaryDoctorId: formData.primaryDoctorId || null,
    };

    // Include userId if creating record for existing account
    if (userId) {
      payload.userId = parseInt(userId);
    }

    createPatient.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/patients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patients
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Register New Patient</h1>
          <p className="text-muted-foreground mt-1">Enter patient information</p>
        </div>
      </div>

      {/* Pre-fill notification banner */}
      {userId && userData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Creating record for existing account
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Name and email have been pre-filled from the user account. Please complete the remaining information.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border border-border p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                placeholder="John"
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                placeholder="Doe"
              />
              <Input
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleInputChange}
                required
              />
              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </div>

          {/* Doctor Assignment - Hidden for nurses */}
          {canAssignDoctor && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Primary Care Doctor</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Assign Primary Doctor"
                  name="primaryDoctorId"
                  value={formData.primaryDoctorId}
                  onChange={handleInputChange}
                >
                  <option value="">Select doctor (optional)</option>
                  {staffData?.staff?.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.email}
                    </option>
                  ))}
                </Select>
                <div className="flex items-end">
                  <p className="text-sm text-muted-foreground">
                    Assign this patient to a primary care doctor. This helps doctors manage their patient list.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Patient Type */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Patient Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Patient Type"
                name="patientType"
                value={formData.patientType}
                onChange={handleInputChange}
                required
              >
                <option value="self_pay">Self Pay</option>
                <option value="hmo">HMO</option>
                <option value="corporate">Corporate</option>
              </Select>

              {patientType === 'hmo' && (
                <>
                  <Select
                    label="HMO Policy"
                    name="insuranceId"
                    value={formData.insuranceId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select HMO policy</option>
                    {hmoList?.map((hmo) => (
                      <option key={hmo.id} value={hmo.id}>
                        {hmo.name}{hmo.policyName ? ` - ${hmo.policyName}` : ''}{hmo.provider ? ` (${hmo.provider})` : ''}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="HMO Enrollee Number"
                    name="hmoEnrolleeNumber"
                    value={formData.hmoEnrolleeNumber}
                    onChange={handleInputChange}
                    placeholder="Enter member/enrollee number"
                    required
                  />
                </>
              )}

              {patientType === 'corporate' && (
                <Select
                  label="Corporate Client"
                  name="corporateClientId"
                  value={formData.corporateClientId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select corporate client</option>
                  {corporateClients?.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+234-800-123-4567"
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="patient@email.com"
                required
              />
              <div className="relative">
                <Input
                  label="New Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">
                  💡 Leave password fields blank to auto-generate a secure random password
                </p>
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Home Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Enter complete home address"
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Emergency Contact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Name - Relationship - Phone Number"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href="/patients">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              loading={createPatient.isPending}
              disabled={createPatient.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Register Patient
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
