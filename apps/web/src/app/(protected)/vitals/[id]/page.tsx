'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@momentum/ui';
import { Activity, User, Calendar, Heart, Thermometer, Wind, Droplet, Weight, Ruler, TrendingUp, FileText, UserCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/shared/BackButton';
import axios from 'axios';
import { useParams } from 'next/navigation';

interface VitalRecord {
  id: number;
  hospitalId: number;
  patientId: number;
  recordedBy: number;
  appointmentId: number | null;
  temperature: number | null;
  bloodPressureSys: number | null;
  bloodPressureDia: number | null;
  bloodPressure: string | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  notes: string | null;
  recordedAt: string;
  createdAt: string;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    patientType: string;
  };
  recordedByUser: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  appointment: {
    id: number;
    startTime: string;
    doctor: {
      id: number;
      name: string;
    };
  } | null;
}

export default function VitalDetailPage() {
  const params = useParams();
  const vitalId = params.id as string;
  const { data: session } = useSession();

  const { data: vital, isLoading, error } = useQuery<VitalRecord>({
    queryKey: ['vital', vitalId],
    queryFn: async () => {
      const response = await axios.get(`/api/vitals/${vitalId}`);
      return response.data;
    },
  });

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !vital) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-ribbon mb-4">Failed to load vital record</p>
          <Link href="/vitals">
            <Button variant="outline">Back to Vitals</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Vital Signs Record</h1>
            <p className="text-muted-foreground mt-1">Complete vital measurements</p>
          </div>
        </div>
      </div>

      {/* Patient Info Banner */}
      <div className="bg-primary/5 border-2 border-primary rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {vital.patient.firstName.charAt(0)}
                {vital.patient.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {vital.patient.firstName} {vital.patient.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {calculateAge(vital.patient.dob)} years • {vital.patient.gender} • {vital.patient.patientType.toUpperCase()}
              </p>
            </div>
          </div>
          <Link href={`/patients/${vital.patient.id}`}>
            <Button variant="outline">
              <User className="w-4 h-4 mr-2" />
              View Patient Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Recording Info */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recording Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Recorded Date & Time</p>
            <p className="font-medium flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-primary" />
              {formatDateTime(vital.recordedAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Recorded By</p>
            <p className="font-medium flex items-center gap-2 mt-1">
              <UserCircle className="w-4 h-4 text-primary" />
              {vital.recordedByUser.name} ({vital.recordedByUser.role})
            </p>
          </div>
          {vital.appointment && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Associated Appointment</p>
              <p className="font-medium flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-primary" />
                Appointment with Dr. {vital.appointment.doctor.name} on{' '}
                {new Date(vital.appointment.startTime).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Vital Measurements */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Vital Measurements
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Blood Pressure */}
          {vital.bloodPressure && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Blood Pressure</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{vital.bloodPressure}</p>
              <p className="text-sm text-muted-foreground mt-1">mmHg</p>
            </div>
          )}

          {/* Heart Rate */}
          {vital.heartRate && (
            <div className="p-4 bg-pink-50 border-2 border-pink-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-pink-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{vital.heartRate}</p>
              <p className="text-sm text-muted-foreground mt-1">beats per minute</p>
            </div>
          )}

          {/* Temperature */}
          {vital.temperature && (
            <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Thermometer className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Temperature</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{vital.temperature}</p>
              <p className="text-sm text-muted-foreground mt-1">°C</p>
            </div>
          )}

          {/* Oxygen Saturation */}
          {vital.oxygenSaturation && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Oxygen Saturation</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{vital.oxygenSaturation}</p>
              <p className="text-sm text-muted-foreground mt-1">% SpO2</p>
            </div>
          )}

          {/* Respiratory Rate */}
          {vital.respiratoryRate && (
            <div className="p-4 bg-cyan-50 border-2 border-cyan-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <Wind className="w-5 h-5 text-cyan-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Respiratory Rate</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{vital.respiratoryRate}</p>
              <p className="text-sm text-muted-foreground mt-1">breaths per minute</p>
            </div>
          )}

          {/* Weight */}
          {vital.weight && (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Weight className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Weight</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{vital.weight}</p>
              <p className="text-sm text-muted-foreground mt-1">kg</p>
            </div>
          )}

          {/* Height */}
          {vital.height && (
            <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Height</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{vital.height}</p>
              <p className="text-sm text-muted-foreground mt-1">cm</p>
            </div>
          )}

          {/* BMI */}
          {vital.bmi && (
            <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Body Mass Index</p>
              </div>
              <p className="text-3xl font-bold text-foreground">{vital.bmi}</p>
              <p className="text-sm text-muted-foreground mt-1">kg/m²</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {vital.notes && (
        <div className="bg-white rounded-lg border border-border p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Additional Notes
          </h3>
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-foreground whitespace-pre-wrap">{vital.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
