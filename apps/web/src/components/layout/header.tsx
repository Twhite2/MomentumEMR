'use client';

import { signOut } from 'next-auth/react';
import { Search, User, LogOut, Settings, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import NotificationsDropdown from './notifications-dropdown';

interface HeaderProps {
  userName: string;
  userRole: string;
}

export function Header({ userName, userRole }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const navigateTo = (path: string) => {
    setShowUserMenu(false);
    router.push(path);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['global-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return null;
      const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      return response.data;
    },
    enabled: searchQuery.length >= 2,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.length >= 2);
  };

  const handleSearchResultClick = (path: string) => {
    router.push(path);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <header className="h-16 bg-white border-b border-border sticky top-0 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patients, appointments, records..."
              className="w-full pl-10 pr-10 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full mt-2 w-full bg-white border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    Searching...
                  </div>
                ) : searchResults ? (
                  <>
                    {/* Patients */}
                    {searchResults.patients?.length > 0 && (
                      <div className="p-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1">
                          Patients
                        </p>
                        {searchResults.patients.map((patient: any) => (
                          <button
                            key={patient.id}
                            onClick={() => handleSearchResultClick(`/patients/${patient.id}`)}
                            className="w-full text-left px-3 py-2 hover:bg-spindle rounded text-sm"
                          >
                            <p className="font-medium">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {patient.patientType} • {patient.gender}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Appointments */}
                    {searchResults.appointments?.length > 0 && (
                      <div className="p-2 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1">
                          Appointments
                        </p>
                        {searchResults.appointments.map((appointment: any) => (
                          <button
                            key={appointment.id}
                            onClick={() => handleSearchResultClick(`/appointments/${appointment.id}`)}
                            className="w-full text-left px-3 py-2 hover:bg-spindle rounded text-sm"
                          >
                            <p className="font-medium">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(appointment.startTime).toLocaleString()}
                              {appointment.doctor && ` • ${appointment.doctor.name}`}
                              {appointment.department && ` • ${appointment.department}`}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Medical Records */}
                    {searchResults.medicalRecords?.length > 0 && (
                      <div className="p-2 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1">
                          Medical Records
                        </p>
                        {searchResults.medicalRecords.map((record: any) => (
                          <button
                            key={record.id}
                            onClick={() => handleSearchResultClick(`/medical-records/${record.id}`)}
                            className="w-full text-left px-3 py-2 hover:bg-spindle rounded text-sm"
                          >
                            <p className="font-medium">
                              {record.diagnosis || 'Medical Visit'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.patient.firstName} {record.patient.lastName} • {new Date(record.visitDate).toLocaleDateString()}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No Results */}
                    {!searchResults.patients?.length && 
                     !searchResults.appointments?.length && 
                     !searchResults.medicalRecords?.length && (
                      <div className="p-4 text-center text-muted-foreground">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Type to search...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationsDropdown />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 hover:bg-spindle rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-lg shadow-lg py-1">
                <button
                  onClick={() => navigateTo('/profile')}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-spindle transition-colors text-left"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => navigateTo('/settings')}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-spindle transition-colors text-left"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-ribbon hover:bg-red-ribbon/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

