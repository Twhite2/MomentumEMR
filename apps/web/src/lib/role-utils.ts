/**
 * Utility functions for role display and formatting
 */

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'doctor'
  | 'nurse'
  | 'pharmacist'
  | 'receptionist'
  | 'cashier'
  | 'lab_tech'
  | 'patient';

/**
 * Maps internal role identifiers to user-friendly display names
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  pharmacist: 'Pharmacist',
  receptionist: 'Receptionist',
  cashier: 'Cashier',
  lab_tech: 'Lab Scientist',
  patient: 'Patient',
};

/**
 * Get user-friendly display name for a role
 * @param role - The role identifier (e.g., 'lab_tech')
 * @returns The display name (e.g., 'Lab Scientist')
 */
export function getRoleDisplayName(role: string | undefined): string {
  if (!role) return 'Unknown';
  return ROLE_DISPLAY_NAMES[role as UserRole] || role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get role badge color classes
 */
export const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-purple-600 text-white',
  admin: 'bg-gray-600 text-white',
  doctor: 'bg-primary text-white',
  nurse: 'bg-green-haze text-white',
  pharmacist: 'bg-amaranth text-white',
  lab_tech: 'bg-danube text-white',
  cashier: 'bg-saffron text-black',
  receptionist: 'bg-purple-500 text-white',
  patient: 'bg-muted text-muted-foreground',
};

/**
 * Get role badge background color classes (lighter for backgrounds)
 */
export const ROLE_BADGE_BG_LIGHT: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-gray-100 text-gray-800',
  doctor: 'bg-primary/10 text-primary',
  nurse: 'bg-green-haze/10 text-green-haze',
  pharmacist: 'bg-amaranth/10 text-amaranth',
  lab_tech: 'bg-danube/10 text-danube',
  cashier: 'bg-saffron/10 text-saffron',
  receptionist: 'bg-purple-100 text-purple-800',
  patient: 'bg-muted text-muted-foreground',
};
