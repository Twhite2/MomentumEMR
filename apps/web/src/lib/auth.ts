import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@momentum/database';
import bcrypt from 'bcryptjs';

export const authOptions = {
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('🔐 [AUTH] Starting authorization...');
          console.log('📧 [AUTH] Email:', credentials?.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.error('❌ [AUTH] Missing credentials');
            throw new Error('Invalid credentials');
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          console.log('🔍 [AUTH] Querying database for user...');
          const user = await prisma.user.findFirst({
            where: { email },
            include: {
              hospital: true,
            },
          });
          
          console.log('👤 [AUTH] User found:', user ? 'YES' : 'NO');
          if (user) {
            console.log('📋 [AUTH] User details:', {
              id: user.id,
              email: user.email,
              role: user.role,
              active: user.active,
            });
          }

        if (!user) {
          console.error('❌ [AUTH] No user found with email:', email);
          throw new Error('No user found with this email');
        }

        if (!user.active) {
          console.error('❌ [AUTH] User account is inactive');
          throw new Error('Account is inactive. Please contact your hospital administrator.');
        }

        console.log('🔑 [AUTH] Checking password...');
        const hashedPassword = user.hashedPassword as string | null;
        if (!hashedPassword || typeof hashedPassword !== 'string') {
          console.error('❌ [AUTH] Invalid hashedPassword type:', typeof user.hashedPassword);
          throw new Error('Account configuration error. Please contact support.');
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          hashedPassword as string
        );
        
        console.log('🔐 [AUTH] Password valid:', isPasswordValid);

        if (!isPasswordValid) {
          console.error('❌ [AUTH] Invalid password for user:', email);
          throw new Error('Invalid password');
        }

        // Update last login
        console.log('📝 [AUTH] Updating last login...');
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        const authUser = {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          hospitalId: user.hospitalId.toString(),
          hospitalName: user.hospital.name,
          mustChangePassword: user.mustChangePassword || false,
        };
        
        console.log('✅ [AUTH] Authorization successful!');
        console.log('👤 [AUTH] Returning user:', authUser);
        return authUser;
        } catch (error: unknown) {
          console.error('💥 [AUTH] Authorization failed!');
          const err = error as Error;
          console.error('❌ [AUTH] Error details:', {
            message: err.message,
            stack: err.stack,
            name: err.name,
          });
          throw new Error(err.message || 'Authentication failed');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.hospitalId = user.hospitalId;
        token.hospitalName = user.hospitalName;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.hospitalId = token.hospitalId as string;
        session.user.hospitalName = token.hospitalName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
} satisfies NextAuthConfig;

// Ensure secret is set - NextAuth v5 picks this up automatically from AUTH_SECRET or NEXTAUTH_SECRET
// Only throw error at runtime, not during build
if (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) {
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    console.warn('Warning: Missing NEXTAUTH_SECRET or AUTH_SECRET environment variable');
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
