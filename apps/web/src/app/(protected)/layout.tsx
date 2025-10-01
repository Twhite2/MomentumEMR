import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

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
    <div className="flex h-screen bg-muted">
      <Sidebar role={session.user.role} hospitalName={session.user.hospitalName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={session.user.name} userRole={session.user.role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
