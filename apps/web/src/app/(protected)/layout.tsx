import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProtectedLayoutClient } from '@/components/layout/protected-layout-client';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <ProtectedLayoutClient
      userName={session.user.name}
      userRole={session.user.role}
      hospitalName={session.user.hospitalName}
    >
      {children}
    </ProtectedLayoutClient>
  );
}
