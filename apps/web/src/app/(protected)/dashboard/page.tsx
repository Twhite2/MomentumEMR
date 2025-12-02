import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/dashboard/admin-dashboard-new';
import DoctorDashboard from '@/components/dashboard/doctor-dashboard';
import NurseDashboard from '@/components/dashboard/nurse-dashboard';
import PharmacistDashboard from '@/components/dashboard/pharmacist-dashboard';
import ReceptionistDashboard from '@/components/dashboard/receptionist-dashboard';
import CashierDashboard from '@/components/dashboard/cashier-dashboard';
import LabTechDashboard from '@/components/dashboard/lab-tech-dashboard';
import PatientDashboard from '@/components/dashboard/patient-dashboard';
import SuperAdminDashboard from '@/app/(protected)/super-admin/page';

type UserRole = 'super_admin' | 'admin' | 'doctor' | 'nurse' | 'pharmacist' | 'receptionist' | 'cashier' | 'lab_tech' | 'patient';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const role = session.user.role as UserRole;

  // Show super admin dashboard directly (no redirect)
  if (role === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  // Route to appropriate dashboard based on role
  const dashboardComponents: Record<UserRole, React.ComponentType<any>> = {
    super_admin: SuperAdminDashboard, // Fallback, but handled above
    admin: AdminDashboard,
    doctor: DoctorDashboard,
    nurse: NurseDashboard,
    pharmacist: PharmacistDashboard,
    receptionist: ReceptionistDashboard,
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
