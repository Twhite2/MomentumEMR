import { NextRequest } from 'next/server';
import { prisma, NotificationType } from '@momentum/database';
import { requireRole, apiResponse, handleApiError } from '@/lib/api-utils';
import { sendNotification, NotificationTemplates } from '@/lib/notifications';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// GET /api/patients - List patients for hospital
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'doctor', 'nurse', 'receptionist', 'cashier', 'lab_tech', 'patient']);
    const hospitalId = parseInt(session.user.hospitalId);
    const userId = parseInt(session.user.id);
    const userRole = session.user.role;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const email = searchParams.get('email') || '';
    const patientType = searchParams.get('patientType') || undefined;
    const showAll = searchParams.get('showAll') === 'true'; // Admin can override filter
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { hospitalId };

    // Patients can only see their own record
    if (userRole === 'patient') {
      where.contactInfo = {
        path: ['email'],
        equals: session.user.email
      };
    }

    // Doctors see only their assigned patients unless showAll is true
    if (userRole === 'doctor' && !showAll) {
      where.primaryDoctorId = userId;
    }

    // Specific email filter (for finding patient by email)
    if (email && userRole !== 'patient') {
      where.contactInfo = {
        path: ['email'],
        equals: email
      };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { 
          contactInfo: { 
            path: ['email'], 
            string_contains: search 
          } 
        },
      ];
    }

    if (patientType) {
      where.patientType = patientType;
    }

    // Get patients with related data
    const patients = await prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        primaryDoctor: {
          select: { 
            id: true, 
            name: true, 
            email: true,
            role: true,
          },
        },
        hmo: {
          select: { id: true, policyName: true, provider: true },
        },
        corporateClient: {
          select: { id: true, companyName: true },
        },
      },
    });

    // Also get patient users who don't have patient records yet
    const patientUsers = await prisma.user.findMany({
      where: {
        hospitalId,
        role: 'patient',
        patientProfile: { is: null }, // Users without patient records
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform patient users to match patient format
    const transformedPatientUsers = patientUsers.map((user: any) => ({
      id: `user-${user.id}`, // Prefix to distinguish from real patients
      userId: user.id,
      firstName: user.name?.split(' ')[0] || 'N/A',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      dob: user.createdAt, // Use account creation as placeholder
      gender: null,
      patientType: 'self_pay',
      contactInfo: {
        email: user.email,
        phone: null,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      primaryDoctor: null,
      hmo: null,
      corporateClient: null,
      createdAt: user.createdAt,
      isUserOnly: true, // Flag to identify user-only records
    }));

    // Merge both lists
    const allPatients = [...patients, ...transformedPatientUsers];
    const total = await prisma.patient.count({ where }) + patientUsers.length;

    return apiResponse({
      patients: allPatients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/patients - Create new patient
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['admin', 'nurse', 'receptionist']);
    const hospitalId = parseInt(session.user.hospitalId);

    const body = await request.json();
    const {
      firstName,
      lastName,
      dob,
      gender,
      patientType,
      contactInfo,
      address,
      emergencyContact,
      insuranceId,
      corporateClientId,
      primaryDoctorId,
      userId, // Optional: If provided, link to existing user account
      password, // Optional: Custom password for patient account
    } = body;

    // Validation
    if (!firstName || !lastName || !dob || !patientType) {
      return apiResponse({ error: 'Missing required fields' }, 400);
    }

    // Validate email if provided
    const patientEmail = contactInfo?.email;
    if (!patientEmail) {
      return apiResponse({ error: 'Patient email is required to create account' }, 400);
    }

    let existingUser = null;
    let newUserCreated = false;

    // If userId is provided, verify it exists and matches the email
    if (userId) {
      existingUser = await prisma.user.findFirst({
        where: {
          id: userId,
          hospitalId,
        },
      });

      if (!existingUser) {
        return apiResponse({ error: 'User account not found' }, 404);
      }

      // Check if user already has a patient record
      const existingPatient = await prisma.patient.findUnique({
        where: { userId: existingUser.id },
      });

      if (existingPatient) {
        return apiResponse({ error: 'This user already has a patient record' }, 400);
      }
    } else {
      // Check if email already exists (only when NOT linking to existing user)
      existingUser = await prisma.user.findUnique({
        where: { email: patientEmail },
      });

      if (existingUser) {
        return apiResponse({ error: 'Email already exists in the system' }, 400);
      }
    }

    // Generate random password (8-12 characters, alphanumeric)
    const generatePassword = () => {
      const length = 10;
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let password = '';
      const randomBytes = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length];
      }
      return password;
    };

    let temporaryPassword = null;
    let hashedPassword = null;
    
    // Only generate password if creating a new user (not linking to existing)
    if (!userId) {
      // Use provided password or auto-generate one
      if (password && password.trim().length > 0) {
        temporaryPassword = password.trim();
        hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      } else {
        temporaryPassword = generatePassword();
        hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      }
    }

    // Create user and patient in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let userToLink;

      if (userId) {
        // Use existing user account
        userToLink = existingUser;
        newUserCreated = false;
      } else {
        // Create new user account
        userToLink = await tx.user.create({
          data: {
            hospitalId,
            name: `${firstName} ${lastName}`,
            email: patientEmail,
            hashedPassword: hashedPassword!,
            role: 'patient',
            active: true,
            mustChangePassword: true, // Force password change on first login
          },
        });
        newUserCreated = true;
      }

      // Create patient record linked to user
      const patient = await tx.patient.create({
        data: {
          hospitalId,
          userId: userToLink!.id,
          firstName,
          lastName,
          dob: new Date(dob),
          gender,
          patientType,
          contactInfo,
          address,
          emergencyContact,
          insuranceId: insuranceId ? parseInt(insuranceId) : null,
          corporateClientId: corporateClientId ? parseInt(corporateClientId) : null,
          primaryDoctorId: primaryDoctorId ? parseInt(primaryDoctorId) : null,
        },
        include: {
          primaryDoctor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          hmo: true,
          corporateClient: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return { patient, temporaryPassword, newUserCreated };
    });

    // Log credentials (development only) - only for new accounts
    if (result.newUserCreated && result.temporaryPassword) {
      console.log(`\n🔑 Patient account created for ${patientEmail}`);
      console.log(`   Temporary password: ${result.temporaryPassword}`);
      console.log(`   Patient must change password on first login\n`);
    } else {
      console.log(`\n✅ Patient record created for existing user: ${patientEmail}\n`);
    }

    // Send email notification with login credentials (only for new accounts)
    if (result.newUserCreated) {
      try {
        await sendNotification({
          userId: result.patient.user!.id.toString(),
          hospitalId: hospitalId.toString(),
          userEmail: patientEmail,
          userName: `${firstName} ${lastName}`,
          notificationId: 'momentum', // Using your existing notification template
          notificationType: NotificationType.account,
          message: `Welcome! Your patient account has been created. Please check your email for login credentials.`,
          referenceId: result.patient.id,
          referenceTable: 'patients',
          parameters: {
            patientName: `${firstName} ${lastName}`,
            email: patientEmail,
            temporaryPassword: result.temporaryPassword,
            loginUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
            hospitalName: session.user.hospitalName,
          },
        });
        console.log('✅ Account creation email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return apiResponse({
      patient: result.patient,
      accountCreated: result.newUserCreated,
      message: result.newUserCreated 
        ? 'Patient record and account created successfully. Login credentials have been sent to patient email.'
        : 'Patient record created successfully and linked to existing user account.',
      // Include password in development only for new accounts
      ...(process.env.NODE_ENV === 'development' && result.temporaryPassword && { temporaryPassword: result.temporaryPassword }),
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
