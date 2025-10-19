'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface ProtectedLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  hospitalName: string;
}

export function ProtectedLayoutClient({
  children,
  userName,
  userRole,
  hospitalName,
}: ProtectedLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on large screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-muted">
      <Sidebar
        role={userRole as any}
        hospitalName={hospitalName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        <Header
          userName={userName}
          userRole={userRole}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
