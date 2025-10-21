'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';

interface HMO {
  id: number;
  policyName: string;
  provider: string;
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
  const { data: session } = useSession();
  const [patientType, setPatientType] = useState('self_pay');
  
  // Nurses cannot assign doctors or manage insurance/billing
  const isNurse = session?.user?.role === 'nurse';
  const canAssignDoctor = !isNurse;

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    patientType: 'self_pay',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    insuranceId: '',
    corporateClientId: '',
    primaryDoctorId: '',
  });

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
      
      // Show temporary password in development
      if (data.temporaryPassword) {
        toast.success(`Account created! Temporary password: ${data.temporaryPassword}`, {
          duration: 10000,
        });
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

    // Build contact info
    const contactInfo: any = {};
    if (formData.phone) contactInfo.phone = formData.phone;
    if (formData.email) contactInfo.email = formData.email;

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dob: formData.dob,
      gender: formData.gender,
      patientType: formData.patientType,
      contactInfo,
      address: formData.address || null,
      emergencyContact: formData.emergencyContact || null,
      insuranceId: formData.patientType === 'hmo' && formData.insuranceId ? formData.insuranceId : null,
      corporateClientId:
        formData.patientType === 'corporate' && formData.corporateClientId
          ? formData.corporateClientId
          : null,
      primaryDoctorId: formData.primaryDoctorId || null,
    };

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
                      {hmo.policyName} - {hmo.provider}
                    </option>
                  ))}
                </Select>
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
              />
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
