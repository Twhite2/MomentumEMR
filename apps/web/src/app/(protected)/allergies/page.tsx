'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Input, Select } from '@momentum/ui';
import { AlertTriangle, Search, Filter, Users, FileText } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  contactInfo: any;
  allergies: string[] | null;
  bloodGroup: string;
  _count: {
    medicalRecords: number;
  };
}

export default function AllergiesPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [allergyFilter, setAllergyFilter] = useState('all');

  const hasAccess = ['admin', 'doctor', 'nurse'].includes(session?.user?.role || '');

  // Fetch all patients with allergies
  const { data: patientsData, isLoading } = useQuery<{ patients: Patient[] }>({
    queryKey: ['patients-allergies', searchQuery],
    queryFn: async () => {
      const response = await axios.get('/api/patients', {
        params: {
          showAll: true,
          limit: 1000, // Get all patients for allergy summary
          search: searchQuery,
        },
      });
      return response.data;
    },
    enabled: hasAccess,
  });

  // Fetch all medical records to aggregate allergies
  const { data: medicalRecordsData } = useQuery<{ records: any[] }>({
    queryKey: ['medical-records-allergies'],
    queryFn: async () => {
      const response = await axios.get('/api/medical-records', {
        params: {
          limit: 10000, // Get all records
        },
      });
      return response.data;
    },
    enabled: hasAccess,
  });

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }

  // Aggregate all patient allergies
  const patients = patientsData?.patients || [];
  const medicalRecords = medicalRecordsData?.records || [];

  // Build map of patient ID to aggregated allergies
  const patientAllergyMap = new Map<number, Set<string>>();

  // Add allergies from patient profiles
  patients.forEach((p) => {
    if (p.allergies && Array.isArray(p.allergies) && p.allergies.length > 0) {
      if (!patientAllergyMap.has(p.id)) {
        patientAllergyMap.set(p.id, new Set());
      }
      p.allergies.forEach((a) => patientAllergyMap.get(p.id)!.add(a));
    }
  });

  // Add allergies from medical records
  medicalRecords.forEach((record: any) => {
    if (record.allergies) {
      try {
        const allergies = typeof record.allergies === 'string' 
          ? JSON.parse(record.allergies) 
          : record.allergies;
        
        if (Array.isArray(allergies) && allergies.length > 0) {
          if (!patientAllergyMap.has(record.patientId)) {
            patientAllergyMap.set(record.patientId, new Set());
          }
          allergies.forEach((a) => patientAllergyMap.get(record.patientId)!.add(a));
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  });

  // Convert map to enriched patient list with aggregated allergies
  const patientsWithAllergies = patients
    .filter((p: any) => patientAllergyMap.has(p.id) && !p.isUserOnly)
    .map((p) => ({
      ...p,
      allergies: Array.from(patientAllergyMap.get(p.id)!),
    }));

  // Get all unique allergies
  const allAllergies = new Set<string>();
  patientAllergyMap.forEach((allergies) => {
    allergies.forEach((a) => allAllergies.add(a));
  });

  const filteredPatients =
    allergyFilter === 'all'
      ? patientsWithAllergies
      : patientsWithAllergies.filter((p) =>
          p.allergies?.some((a) => a.toLowerCase().includes(allergyFilter.toLowerCase()))
        );

  // Stats
  const totalPatientsWithAllergies = patientsWithAllergies.length;
  const totalPatients = patients.filter((p: any) => !p.isUserOnly).length;
  const allergyPercentage =
    totalPatients > 0 ? ((totalPatientsWithAllergies / totalPatients) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          Patient Allergy Summary
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of all patient allergies in the system
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patients with Allergies</p>
              <p className="text-2xl font-bold">{totalPatientsWithAllergies}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Allergy Prevalence</p>
              <p className="text-2xl font-bold">{allergyPercentage}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unique Allergies</p>
              <p className="text-2xl font-bold">{allAllergies.size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Filter by allergy (e.g., Penicillin)..."
              value={allergyFilter === 'all' ? '' : allergyFilter}
              onChange={(e) => setAllergyFilter(e.target.value || 'all')}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Common Allergies */}
      {allAllergies.size > 0 && (
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Common Allergies in System</h2>
          <div className="flex flex-wrap gap-2">
            {Array.from(allAllergies)
              .sort()
              .map((allergy) => (
                <button
                  key={allergy}
                  onClick={() => setAllergyFilter(allergy)}
                  className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm hover:bg-red-100 transition-colors"
                >
                  {allergy}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Patients List */}
      <div className="bg-white rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">
            Patients with Allergies ({filteredPatients.length})
          </h2>
        </div>

        <div className="p-6">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading patients...</p>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {allergyFilter === 'all'
                  ? 'No patients with recorded allergies found'
                  : `No patients with "${allergyFilter}" allergy found`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/patients/${patient.id}`}
                  className="block p-4 rounded-lg border border-border hover:border-red-300 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          {patient.allergies?.length} {patient.allergies?.length === 1 ? 'Allergy' : 'Allergies'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground mb-3">
                        <div>
                          <span className="font-medium">DOB:</span>{' '}
                          {new Date(patient.dob).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Gender:</span> {patient.gender || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Blood Group:</span> {patient.bloodGroup || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Records:</span> {patient._count?.medicalRecords || 0}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {patient.allergies?.map((allergy, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded-full font-medium"
                          >
                            ⚠️ {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Warning Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Important:</strong> Always verify patient allergies before prescribing
          medications or administering treatment. Allergy information should be updated during each
          visit if new allergies are discovered.
        </p>
      </div>
    </div>
  );
}
