# Login Enhancement for Multi-Hospital Support

## Current Behavior (After Fix)
- User enters email and password
- System finds first user with that email
- Logs into that user's first hospital

## Issue
If user exists in multiple hospitals, they can only access the first one found in the database.

---

## Recommended Enhancement

### Option 1: Hospital Selector on Login Page

**Login Flow:**
1. User enters email (no password yet)
2. System checks if email exists in multiple hospitals
3. If yes, show dropdown of hospitals
4. User selects hospital
5. User enters password
6. Authenticate against selected hospital

**Implementation:**

```typescript
// Step 1: Check email endpoint
// File: apps/web/src/app/api/auth/check-email/route.ts
import { prisma } from '@momentum/database';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  
  const users = await prisma.user.findMany({
    where: { email },
    select: {
      hospitalId: true,
      hospital: {
        select: { id: true, name: true }
      }
    }
  });
  
  return Response.json({
    exists: users.length > 0,
    multipleHospitals: users.length > 1,
    hospitals: users.map(u => u.hospital)
  });
}
```

**Updated Login Component:**

```tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<number | null>(null);
  const [step, setStep] = useState<'email' | 'hospital' | 'password'>('email');

  const handleEmailSubmit = async () => {
    const res = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    const data = await res.json();
    
    if (!data.exists) {
      alert('No account found with this email');
      return;
    }
    
    if (data.multipleHospitals) {
      setHospitals(data.hospitals);
      setStep('hospital');
    } else {
      setSelectedHospital(data.hospitals[0].id);
      setStep('password');
    }
  };

  const handleLogin = async () => {
    const result = await signIn('credentials', {
      email,
      password,
      hospitalId: selectedHospital,
      redirect: false,
    });
    
    if (result?.error) {
      alert(result.error);
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div>
      {step === 'email' && (
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <button onClick={handleEmailSubmit}>Next</button>
        </div>
      )}
      
      {step === 'hospital' && (
        <div>
          <h3>Select Hospital</h3>
          <select 
            value={selectedHospital || ''} 
            onChange={(e) => {
              setSelectedHospital(Number(e.target.value));
              setStep('password');
            }}
          >
            <option value="">Choose hospital...</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      )}
      
      {step === 'password' && (
        <div>
          <p>Logging into: {hospitals.find(h => h.id === selectedHospital)?.name}</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      )}
    </div>
  );
}
```

**Updated Auth Config:**

```typescript
// File: apps/web/src/lib/auth.ts
async authorize(credentials) {
  const email = credentials.email as string;
  const password = credentials.password as string;
  const hospitalId = credentials.hospitalId as string;

  // If hospitalId provided, use it
  const whereClause = hospitalId 
    ? { email, hospitalId: parseInt(hospitalId) }
    : { email };

  const user = await prisma.user.findFirst({
    where: whereClause,
    include: { hospital: true },
  });

  // ... rest of authentication
}
```

---

### Option 2: Remember Last Hospital

Store user's last used hospital in localStorage:

```typescript
// After successful login
localStorage.setItem(`lastHospital_${email}`, hospitalId);

// On login page load
const lastHospital = localStorage.getItem(`lastHospital_${email}`);
if (lastHospital) {
  setSelectedHospital(parseInt(lastHospital));
}
```

---

### Option 3: Hospital Switcher in Dashboard

Allow users to switch hospitals after login without re-authenticating:

```typescript
// Add to user menu/header
const switchHospital = async (newHospitalId: number) => {
  // Re-authenticate with new hospital
  await signIn('credentials', {
    email: session.user.email,
    password: '(cached)',  // Need secure session token approach
    hospitalId: newHospitalId,
  });
};
```

---

## Quick Fix (Current)

For now, logins will work but users can only access their first hospital. To access other hospitals:

1. User must know which hospital they're logging into
2. If wrong hospital, they need to contact admin
3. Or implement one of the options above

---

## Priority

**Immediate**: Login works (DONE ✅)  
**Short-term**: Add hospital selector (Option 1)  
**Long-term**: Add hospital switcher in dashboard (Option 3)

