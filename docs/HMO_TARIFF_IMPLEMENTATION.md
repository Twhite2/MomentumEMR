# HMO Tariff Management System

## Overview
This system allows you to import and manage HMO tariff data from different HMO providers (Reliance, Leadway, AXA Mansard) and integrate them into the claims processing workflow.

## Database Schema

### New Model: `HmoTariff`
```prisma
model HmoTariff {
  id               Int       @id @default(autoincrement())
  hmoId            Int       // Reference to HMO
  code             String    // Service/procedure/drug code
  name             String    // Item/service name
  category         String?   // e.g., "Medication", "Procedure", "Package"
  unit             String?   // e.g., "Tab", "Vial", "Session"
  basePrice        Decimal   // Base/default price
  tier0Price       Decimal?  // For tiered pricing (Reliance)
  tier1Price       Decimal?
  tier2Price       Decimal?
  tier3Price       Decimal?
  tier4Price       Decimal?
  isPARequired     Boolean   // Pre-authorization required
  effectiveDate    DateTime?
  expiryDate       DateTime?
  active           Boolean
  metadata         Json?     // Additional HMO-specific fields
  createdAt        DateTime
  updatedAt        DateTime
}
```

## Implementation Steps

### 1. Database Migration
```bash
cd packages/database
pnpm prisma migrate dev --name add_hmo_tariffs
pnpm generate
```

### 2. Import HMO Tariffs

#### API Endpoint
**POST** `/api/hmo/[id]/tariffs/import`

#### Request
- **Method**: POST (multipart/form-data)
- **Headers**: Authorization required (super_admin or admin)
- **Body**:
  - `file`: Excel file (.xlsx)
  - `hmoType`: String - "reliance" | "leadway" | "axa"

#### Example Usage (Frontend)
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('hmoType', 'reliance'); // or 'leadway', 'axa'

const response = await fetch(`/api/hmo/${hmoId}/tariffs/import`, {
  method: 'POST',
  body: formData,
});
```

### 3. Search/Query Tariffs

#### API Endpoint
**GET** `/api/hmo/[id]/tariffs`

#### Query Parameters
- `search`: string - Search by name or code
- `category`: string - Filter by category
- `limit`: number - Results per page (default: 50)
- `page`: number - Page number (default: 1)

#### Example Usage
```typescript
// Search for a medication
const response = await fetch(
  `/api/hmo/${hmoId}/tariffs?search=paracetamol&category=Medication`
);
```

## Supported HMO Formats

### 1. Reliance HMO
**File Format**: Drug tariff with tiered pricing
```
| S/N | LINE ITEM | Unit | Tier 4 | Tier 3 | Tier 2 | Tier 1 | Tier 0 |
|-----|-----------|------|--------|--------|--------|--------|--------|
| 1   | Drug Name | Tab  | 100.00 | 120.00 | 150.00 | 180.00 | 200.00 |
```

**Features**:
- 5 pricing tiers (Tier 0-4)
- Unit of measure included
- Category: "Medication"

### 2. Leadway Provider Network
**File Format**: Procedure codes with single pricing
```
| Proceedure Code | Proceedure Name | Amount |
|-----------------|-----------------|---------|
| 10100001        | Service Name    | ₦15,000 |
```

**Features**:
- Single price per procedure
- Category: "Procedure"

### 3. AXA Mansard
**File Format**: Service packages with categories
```
| Code     | Name | Category | IsPARequired | Tariff | EffectiveDate |
|----------|------|----------|--------------|--------|---------------|
| Pack0001 | ...  | Wellness | TRUE         | ₦0.00  | Nov 27, 2023  |
```

**Features**:
- Pre-authorization flag
- Effective date tracking
- Category classification

## Integration with Claims Processing

### 1. During Billing/Claims Creation
When creating a billing item for an HMO patient:

```typescript
// Look up tariff
const tariff = await prisma.hmoTariff.findFirst({
  where: {
    hmoId: patient.hmoId,
    code: serviceCode,
    active: true,
  },
});

// Use tariff price
const billingItem = await prisma.encounterBillingItem.create({
  data: {
    encounterId,
    serviceId: tariff.code,
    description: tariff.name,
    unitCost: tariff.basePrice, // or appropriate tier price
    quantity: 1,
    totalCost: tariff.basePrice,
    isCoveredByHmo: true,
    hmoCoverage: 100, // percentage
    hmoAmount: tariff.basePrice,
    patientAmount: 0,
  },
});
```

### 2. Pre-Authorization Check
```typescript
if (tariff.isPARequired) {
  // Prompt for authorization code
  // Store in encounter.authorizationCode
}
```

### 3. Price Tier Selection (Reliance)
For Reliance HMO with tiered pricing:
```typescript
const patientTier = patient.hmoPlan.tier || 0; // Get from patient's plan
const price = tariff[`tier${patientTier}Price`] || tariff.basePrice;
```

## Frontend Integration

### HMO Tariff Management Page
Create a page at `/hmo/[id]/tariffs` with:

1. **Import Section**
   - File upload
   - HMO type selector (Reliance/Leadway/AXA)
   - Import button

2. **Search & View Section**
   - Search bar
   - Category filter
   - Tariff list/table
   - Pricing display (with tier info for Reliance)

3. **Actions**
   - Clear all tariffs
   - Export to Excel
   - Edit individual tariff

### Example React Component
```tsx
'use client';

import { useState } from 'react';
import { Button, Input } from '@momentum/ui';
import { Upload } from 'lucide-react';

export default function HmoTariffsPage({ params }: { params: { id: string } }) {
  const [file, setFile] = useState<File | null>(null);
  const [hmoType, setHmoType] = useState('reliance');
  const [uploading, setUploading] = useState(false);

  const handleImport = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hmoType', hmoType);

    try {
      const response = await fetch(`/api/hmo/${params.id}/tariffs/import`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`Imported ${data.imported} tariffs successfully!`);
      }
    } catch (error) {
      alert('Import failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">HMO Tariff Management</h1>
      
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Import Tariffs</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">HMO Type</label>
            <select 
              value={hmoType}
              onChange={(e) => setHmoType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="reliance">Reliance HMO</option>
              <option value="leadway">Leadway Provider Network</option>
              <option value="axa">AXA Mansard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Excel File</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>

          <Button 
            onClick={handleImport}
            disabled={!file || uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Importing...' : 'Import Tariffs'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Benefits

1. **Accurate Billing**: Use HMO-approved pricing for claims
2. **Pre-Authorization**: Flag services that require PA
3. **Multi-HMO Support**: Handle different HMO tariff formats
4. **Easy Updates**: Import new tariffs as HMOs update pricing
5. **Audit Trail**: Track effective dates and changes
6. **Claims Validation**: Ensure billing matches HMO tariffs before submission

## Next Steps

1. Run database migration
2. Create frontend page for tariff management
3. Import the 3 HMO tariff files
4. Integrate with billing/claims workflow
5. Add price lookup during service selection
6. Display tariff info in billing interface

## File Locations

- **Schema**: `packages/database/prisma/schema.prisma`
- **Import API**: `apps/web/src/app/api/hmo/[id]/tariffs/import/route.ts`
- **Query API**: `apps/web/src/app/api/hmo/[id]/tariffs/route.ts`
- **Tariff Files**: 
  - `drive-download-20250926T082524Z-1-001/Reliance Tariff.xlsx`
  - `drive-download-20250926T082524Z-1-001/Leadway Provider Network.xlsx`
  - `drive-download-20250926T082524Z-1-001/Axa Mansard Tariff.xlsx`
