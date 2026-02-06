# Rental Checkout Fields Implementation Guide

## Overview

This document provides a complete guide to implement rental-specific fields for checkout creation. The tests in `b3-create-rental.spec.ts` are currently marked as `.fixme()` because the frontend UI does not have the required rental fields.

## Current Status

- **Database Schema**: ✅ Ready - `lenderTeamId` and `lenderSiteId` exist in `checkouts` table
- **Backend API**: ❌ Missing - `CreateCheckoutDto` needs to include these fields
- **Frontend API Client**: ✅ Ready - `Checkout` interface already has `lenderTeamId` and `lenderSiteId`
- **Frontend UI**: ❌ Missing - Conditional fields need to be implemented

## Implementation Steps

### 1. Backend Changes

#### Update `CreateCheckoutDto` in `apps/backend/src/modules/checkouts/dto/create-checkout.dto.ts`

Add the following fields to both the Zod schema and DTO class:

```typescript
// In createCheckoutSchema:
export const createCheckoutSchema = z.object({
  equipmentIds: z
    .array(z.string().uuid('유효한 UUID 형식이 아닙니다'))
    .min(1, '최소 1개의 장비를 선택해야 합니다'),
  purpose: z.enum([...CHECKOUT_PURPOSE_VALUES] as [string, ...string[]], {
    message: '유효하지 않은 반출 목적입니다.',
  }),
  destination: z.string().min(1, '반출 장소를 입력해주세요'),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  reason: z.string().min(1, '반출 사유를 입력해주세요'),
  expectedReturnDate: z.string().datetime({ message: '유효한 날짜 형식이 아닙니다' }),
  notes: z.string().optional(),

  // ADD THESE FIELDS:
  lenderTeamId: z.string().uuid('유효한 팀 UUID가 아닙니다').optional(),
  lenderSiteId: z.string().optional(),
});

// In CreateCheckoutDto class:
export class CreateCheckoutDto {
  // ... existing fields ...

  @ApiProperty({
    description: '대여 제공 팀 UUID (외부 대여 시 필수)',
    example: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
    required: false,
  })
  lenderTeamId?: string;

  @ApiProperty({
    description: '대여 제공 사이트 (외부 대여 시 필수)',
    enum: ['suwon', 'uiwang', 'pyeongtaek'],
    example: 'suwon',
    required: false,
  })
  lenderSiteId?: string;
}
```

#### Update `CheckoutsService` to handle rental fields

In `apps/backend/src/modules/checkouts/checkouts.service.ts`, ensure the `create()` method properly stores `lenderTeamId` and `lenderSiteId`:

```typescript
async create(createCheckoutDto: CreateCheckoutInput, userId: string) {
  // Validate rental-specific fields
  if (createCheckoutDto.purpose === 'rental') {
    if (!createCheckoutDto.lenderTeamId || !createCheckoutDto.lenderSiteId) {
      throw new BadRequestException(
        '외부 대여 시 대여 제공 팀과 사이트를 선택해야 합니다.'
      );
    }
  }

  // Create checkout with rental fields
  const checkoutData = {
    requesterId: userId,
    equipmentIds: createCheckoutDto.equipmentIds,
    purpose: createCheckoutDto.purpose,
    destination: createCheckoutDto.destination,
    phoneNumber: createCheckoutDto.phoneNumber,
    address: createCheckoutDto.address,
    reason: createCheckoutDto.reason,
    expectedReturnDate: new Date(createCheckoutDto.expectedReturnDate),
    lenderTeamId: createCheckoutDto.lenderTeamId, // Add this
    lenderSiteId: createCheckoutDto.lenderSiteId, // Add this
    status: 'pending',
  };

  // ... rest of the create logic
}
```

### 2. Frontend Changes

#### Update `CreateCheckoutDto` in `apps/frontend/lib/api/checkout-api.ts`

```typescript
export interface CreateCheckoutDto {
  equipmentIds: string[];
  destination: string;
  phoneNumber?: string;
  address?: string;
  purpose: string;
  reason: string;
  expectedReturnDate: string;
  notes?: string;

  // ADD THESE FIELDS:
  lenderTeamId?: string; // 대여 제공 팀 (rental purpose only)
  lenderSiteId?: string; // 대여 제공 사이트 (rental purpose only)
}
```

#### Update UI in `apps/frontend/app/(dashboard)/checkouts/create/page.tsx`

Add state management for rental fields:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
// ... existing imports ...
import teamsApi from '@/lib/api/teams-api'; // Add teams API
import { SITE_CONFIG, Site } from '@/lib/api/teams-api'; // Add site config

export default function CreateCheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Existing state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [destination, setDestination] = useState('');
  const [customDestination, _setCustomDestination] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [purpose, setPurpose] = useState<'calibration' | 'repair' | 'rental'>('calibration');
  const [reason, setReason] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState<Date>(addDays(new Date(), 7));

  // ADD RENTAL FIELDS STATE:
  const [lenderTeamId, setLenderTeamId] = useState<string>('');
  const [lenderSiteId, setLenderSiteId] = useState<Site | ''>('');

  // Fetch teams for rental purpose
  const { data: teamsData } = useQuery({
    queryKey: ['teams', lenderSiteId],
    queryFn: async () => {
      if (!lenderSiteId) return { data: [], meta: { pagination: { total: 0 } } };
      return teamsApi.getTeams({ site: lenderSiteId, pageSize: 100 });
    },
    enabled: purpose === 'rental' && !!lenderSiteId,
  });

  // ... existing equipment query and mutation ...

  // Update submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ... existing validation ...

    // ADD RENTAL FIELD VALIDATION:
    if (purpose === 'rental') {
      if (!lenderTeamId || !lenderSiteId) {
        toast({
          title: '대여 정보를 입력해주세요',
          description: '외부 대여 시 대여 제공 팀과 사이트를 선택해야 합니다.',
          variant: 'destructive',
        });
        return;
      }
    }

    const checkoutData: CreateCheckoutDto = {
      equipmentIds: selectedEquipments.map((e) => String(e.id)),
      destination: destination === 'other' ? customDestination : destination,
      phoneNumber: phoneNumber || undefined,
      address: address || undefined,
      purpose,
      reason: reason.trim(),
      expectedReturnDate: expectedReturnDate.toISOString(),

      // ADD RENTAL FIELDS:
      lenderTeamId: purpose === 'rental' ? lenderTeamId : undefined,
      lenderSiteId: purpose === 'rental' ? lenderSiteId : undefined,
    };

    createCheckoutMutation.mutate(checkoutData);
  };

  return (
    <div className="container mx-auto py-6">
      {/* ... existing JSX ... */}

      {/* In the form section, ADD RENTAL FIELDS after the reason field: */}
      <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
        {/* ... existing fields (purpose, destination, reason, phoneNumber, address) ... */}

        {/* ADD RENTAL-SPECIFIC FIELDS (conditionally rendered) */}
        {purpose === 'rental' && (
          <>
            {/* Lender Site Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="lenderSiteId">
                대여 제공 사이트 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={lenderSiteId}
                onValueChange={(value) => {
                  setLenderSiteId(value as Site);
                  setLenderTeamId(''); // Reset team when site changes
                }}
              >
                <SelectTrigger id="lenderSiteId">
                  <SelectValue placeholder="사이트를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SITE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lender Team Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="lenderTeamId">
                대여 제공 팀 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={lenderTeamId}
                onValueChange={setLenderTeamId}
                disabled={!lenderSiteId}
              >
                <SelectTrigger id="lenderTeamId">
                  <SelectValue placeholder="팀을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {teamsData?.data?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!lenderSiteId && (
                <p className="text-xs text-muted-foreground">
                  먼저 사이트를 선택하세요
                </p>
              )}
            </div>
          </>
        )}

        {/* ... existing expectedReturnDate field ... */}
      </form>
    </div>
  );
}
```

### 3. Test Verification

After implementing the changes:

1. Remove `.fixme()` from all three tests in `b3-create-rental.spec.ts`
2. Run the tests:
   ```bash
   cd apps/frontend
   pnpm test:e2e tests/e2e/checkouts/group-b/b3-create-rental.spec.ts
   ```

### Expected Test Results

- **B-12**: Should create a rental checkout with lenderTeamId and lenderSiteId
- **B-13**: Rental fields should appear when purpose="rental" and hide when changed to "calibration"
- **B-14**: Should create a cross-site rental from Suwon to Uiwang

## Database Schema Reference

The `checkouts` table already has these columns:

```typescript
lenderTeamId: uuid('lender_team_id'), // 빌려주는 측 팀 ID
lenderSiteId: varchar('lender_site_id', { length: 50 }), // 빌려주는 측 사이트 ID
```

Located in: `packages/db/src/schema/checkouts.ts` lines 68-69

## API Endpoints

- **Teams**: `GET /api/teams?site=suwon` - Fetch teams by site
- **Checkout**: `POST /api/checkouts` - Create checkout with rental fields

## Label Mappings

For E2E tests to work correctly, ensure these exact labels:

- **Purpose Dropdown**: `반출 목적` (label for Select)
  - Options: `교정` (calibration), `수리` (repair), `외부 대여` (rental)
- **Lender Site**: `대여 제공 사이트` (label for Select)
  - Options: `수원`, `의왕`, `평택`
- **Lender Team**: `대여 제공 팀` (label for Select)
  - Options: Team names like `FCC EMC/RF`, `General EMC`, etc.

## Related Files

- Backend DTO: `apps/backend/src/modules/checkouts/dto/create-checkout.dto.ts`
- Backend Service: `apps/backend/src/modules/checkouts/checkouts.service.ts`
- Frontend API: `apps/frontend/lib/api/checkout-api.ts`
- Frontend UI: `apps/frontend/app/(dashboard)/checkouts/create/page.tsx`
- Teams API: `apps/frontend/lib/api/teams-api.ts`
- Database Schema: `packages/db/src/schema/checkouts.ts`
- Test File: `apps/frontend/tests/e2e/checkouts/group-b/b3-create-rental.spec.ts`

## Priority

- **B-12**: P0 (Critical) - Core rental checkout functionality
- **B-13**: P2 - UI conditional rendering verification
- **B-14**: P2 - Cross-site rental workflow

## Notes

1. The rental fields should **only appear** when `purpose="rental"` is selected
2. The lenderSiteId should be selected **before** lenderTeamId (teams are filtered by site)
3. Backend validation should enforce that rental checkouts have both lenderTeamId and lenderSiteId
4. The existing seed data (`checkouts.seed.ts`) has 22 rental checkouts with proper lender information for reference
