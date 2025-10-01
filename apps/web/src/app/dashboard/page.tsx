import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@momentum/database';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import DoctorDashboard from '@/components/dashboard/doctor-dashboard';
import NurseDashboard from '@/components/dashboard/nurse-dashboard';
import PharmacistDashboard from '@/components/dashboard/pharmacist-dashboard';
import CashierDashboard from '@/components/dashboard/cashier-dashboard';
import LabTechDashboard from '@/components/dashboard/lab-tech-dashboard';
import PatientDashboard from '@/components/dashboard/patient-dashboard';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const role = session.user.role;

  // Route to appropriate dashboard based on role
  const dashboardComponents: Record<UserRole, React.ComponentType<any>> = {
    admin: AdminDashboard,
    doctor: DoctorDashboard,
    nurse: NurseDashboard,
    pharmacist: PharmacistDashboard,
    cashier: CashierDashboard,
    lab_tech: LabTechDashboard,
    patient: PatientDashboard,
  };

  const DashboardComponent = dashboardComponents[role];

  if (!DashboardComponent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Dashboard Not Found</h1>
          <p className="text-muted-foreground">
            No dashboard available for role: {role}
          </p>
        </div>
      </div>
    );
  }

  return <DashboardComponent session={session} />;
}
