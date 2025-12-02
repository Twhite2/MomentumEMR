'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button, Input, Select, Textarea } from '@momentum/ui';
import { Save, Calendar as CalendarIcon, Calendar } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/shared/BackButton';
import axios from 'axios';
import { toast } from 'sonner';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
}

interface Doctor {
  id: number;
  name: string;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const preSelectedPatientId = searchParams.get('patientId');

  const [formData, setFormData] = useState({
    patientId: preSelectedPatientId || '',
    doctorId: '',
    department: '',
    appointmentType: 'OPD',
    date: '',
    startTime: '',
    duration: '30',
  });

  // Fetch patients
  const { data: patients } = useQuery<{ patients: Patient[] }>({
    queryKey: ['patients-all'],
    queryFn: async () => {
      const response = await axios.get('/api/patients?limit=100');
      return response.data;
    },
  });

  // Fetch doctors
  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ['doctors'],
    queryFn: async () => {
      const response = await axios.get('/api/users/doctors');
      return response.data;
    },
  });

  // Book appointment mutation
  const bookAppointment = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/appointments', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Appointment booked successfully!');
      router.push(`/appointments/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to book appointment');
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    
    // Calculate end time
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(formData.duration));

    // For patient users, find their patient record
    let patientIdToUse = formData.patientId;
    
    if (session?.user?.role === 'patient') {
      try {
        // Patient API now returns only the user's own record
        const response = await axios.get('/api/patients?limit=1');
        if (response.data.patients && response.data.patients.length > 0) {
          patientIdToUse = response.data.patients[0].id;
        } else {
          toast.error('Patient record not found. Please contact support.');
          return;
        }
      } catch (error) {
        toast.error('Failed to find patient record');
        return;
      }
    }

    // Validation
    if (!patientIdToUse) {
      toast.error('Please select a patient');
      return;
    }

    if (!formData.doctorId) {
      toast.error('Please select a doctor');
      return;
    }

    const payload = {
      patientId: patientIdToUse,
      doctorId: formData.doctorId,
      department: formData.department || null,
      appointmentType: formData.appointmentType,
      status: 'scheduled',
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    };

    bookAppointment.mutate(payload);
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold">Book Appointment</h1>
          <p className="text-muted-foreground mt-1">
            {session?.user?.role === 'patient' 
              ? 'Schedule your appointment with a doctor'
              : 'Schedule a new patient appointment'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border border-border p-6 space-y-6">
          {/* Patient & Doctor Selection */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {session?.user?.role === 'patient' ? 'Select Doctor' : 'Patient & Doctor'}
            </h2>
            <div className={`grid grid-cols-1 ${session?.user?.role === 'patient' ? '' : 'md:grid-cols-2'} gap-4`}>
              {session?.user?.role !== 'patient' && (
                <Select
                  label="Patient"
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select patient</option>
                  {patients?.patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} (ID: P-{patient.id.toString().padStart(6, '0')})
                    </option>
                  ))}
                </Select>
              )}

              <Select
                label="Doctor"
                name="doctorId"
                value={formData.doctorId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select doctor</option>
                {doctors?.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Appointment Details */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Appointment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Appointment Type"
                name="appointmentType"
                value={formData.appointmentType}
                onChange={handleInputChange}
                required
              >
                <option value="OPD">OPD (Outpatient)</option>
                <option value="IPD">IPD (Inpatient)</option>
                <option value="surgery">Surgery</option>
                <option value="lab">Lab Test</option>
                <option value="follow_up">Follow-up</option>
              </Select>

              <Select
                label="Department (Optional)"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
              >
                <option value="">Select Department</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Surgery">Surgery</option>
                <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Emergency">Emergency</option>
                <option value="Dentistry">Dentistry</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="ENT">ENT (Ear, Nose, Throat)</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Neurology">Neurology</option>
                <option value="Radiology">Radiology</option>
              </Select>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                min={today}
                required
              />

              <Input
                label="Start Time"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />

              <Select
                label="Duration (minutes)"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </Select>
            </div>
          </div>

          {/* Summary */}
          {formData.date && formData.startTime && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-primary">Appointment Summary</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {formData.date && new Date(formData.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {' at '}
                {formData.startTime}
                {' for '}
                {formData.duration} minutes
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href="/appointments">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              loading={bookAppointment.isPending}
              disabled={bookAppointment.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

