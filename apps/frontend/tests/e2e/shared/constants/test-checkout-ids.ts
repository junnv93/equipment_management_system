/**
 * Test Checkout IDs for E2E Tests
 *
 * SSOT: These constants must match apps/backend/src/database/seed-data/operations/checkouts.seed.ts
 * These IDs are created by seed script and used across E2E tests
 *
 * @see apps/backend/src/database/seed-data/operations/checkouts.seed.ts - Source of truth
 */

// Pending checkouts (1-8)
export const CHECKOUT_001_ID = '10000000-0000-0000-0000-000000000001'; // pending - calibration (Suwon E)
export const CHECKOUT_002_ID = '10000000-0000-0000-0000-000000000002'; // pending - calibration (Suwon R)
export const CHECKOUT_003_ID = '10000000-0000-0000-0000-000000000003'; // pending - repair (Suwon E)
export const CHECKOUT_004_ID = '10000000-0000-0000-0000-000000000004'; // pending - repair (Uiwang W)
export const CHECKOUT_005_ID = '10000000-0000-0000-0000-000000000005'; // pending - rental (Suwon → Uiwang)
export const CHECKOUT_006_ID = '10000000-0000-0000-0000-000000000006'; // pending - rental (Uiwang → Suwon)
export const CHECKOUT_007_ID = '10000000-0000-0000-0000-000000000007'; // pending - calibration multi-equipment
export const CHECKOUT_008_ID = '10000000-0000-0000-0000-000000000008'; // pending - repair multi-equipment

// Approved checkouts (9-14)
export const CHECKOUT_009_ID = '10000000-0000-0000-0000-000000000009'; // approved - calibration
export const CHECKOUT_010_ID = '10000000-0000-0000-0000-000000000010'; // approved - repair
export const CHECKOUT_011_ID = '10000000-0000-0000-0000-000000000011'; // approved - rental
export const CHECKOUT_012_ID = '10000000-0000-0000-0000-000000000012'; // approved - calibration
export const CHECKOUT_013_ID = '10000000-0000-0000-0000-000000000013'; // approved - repair
export const CHECKOUT_014_ID = '10000000-0000-0000-0000-000000000014'; // approved - rental

// Rejected checkouts (15-18)
export const CHECKOUT_015_ID = '10000000-0000-0000-0000-000000000015'; // rejected - calibration
export const CHECKOUT_016_ID = '10000000-0000-0000-0000-000000000016'; // rejected - repair
export const CHECKOUT_017_ID = '10000000-0000-0000-0000-000000000017'; // rejected - rental (with reason)
export const CHECKOUT_018_ID = '10000000-0000-0000-0000-000000000018'; // rejected - calibration (with reason)

// Checked out checkouts (19-26)
export const CHECKOUT_019_ID = '10000000-0000-0000-0000-000000000019'; // checked_out - calibration
export const CHECKOUT_020_ID = '10000000-0000-0000-0000-000000000020'; // checked_out - repair
export const CHECKOUT_021_ID = '10000000-0000-0000-0000-000000000021'; // checked_out - calibration
export const CHECKOUT_022_ID = '10000000-0000-0000-0000-000000000022'; // checked_out - repair
export const CHECKOUT_023_ID = '10000000-0000-0000-0000-000000000023'; // checked_out - calibration
export const CHECKOUT_024_ID = '10000000-0000-0000-0000-000000000024'; // checked_out - repair
export const CHECKOUT_025_ID = '10000000-0000-0000-0000-000000000025'; // checked_out - rental
export const CHECKOUT_026_ID = '10000000-0000-0000-0000-000000000026'; // checked_out - rental

// Rental 4-step checkouts (27-41)
export const CHECKOUT_027_ID = '10000000-0000-0000-0000-000000000027'; // lender_checked - rental
export const CHECKOUT_028_ID = '10000000-0000-0000-0000-000000000028'; // lender_checked - rental
export const CHECKOUT_029_ID = '10000000-0000-0000-0000-000000000029'; // lender_checked - rental (multi)
export const CHECKOUT_030_ID = '10000000-0000-0000-0000-000000000030'; // borrower_received - rental
export const CHECKOUT_031_ID = '10000000-0000-0000-0000-000000000031'; // borrower_received - rental
export const CHECKOUT_032_ID = '10000000-0000-0000-0000-000000000032'; // borrower_received - rental
export const CHECKOUT_033_ID = '10000000-0000-0000-0000-000000000033'; // in_use - rental
export const CHECKOUT_034_ID = '10000000-0000-0000-0000-000000000034'; // in_use - rental
export const CHECKOUT_035_ID = '10000000-0000-0000-0000-000000000035'; // in_use - rental (multi)
export const CHECKOUT_036_ID = '10000000-0000-0000-0000-000000000036'; // borrower_returned - rental
export const CHECKOUT_037_ID = '10000000-0000-0000-0000-000000000037'; // borrower_returned - rental
export const CHECKOUT_038_ID = '10000000-0000-0000-0000-000000000038'; // borrower_returned - rental
export const CHECKOUT_039_ID = '10000000-0000-0000-0000-000000000039'; // lender_received - rental
export const CHECKOUT_040_ID = '10000000-0000-0000-0000-000000000040'; // lender_received - rental
export const CHECKOUT_041_ID = '10000000-0000-0000-0000-000000000041'; // lender_received - rental

// Returned checkouts (42-49)
export const CHECKOUT_042_ID = '10000000-0000-0000-0000-000000000042'; // returned - calibration (with inspections)
export const CHECKOUT_043_ID = '10000000-0000-0000-0000-000000000043'; // returned - repair (with inspections)
export const CHECKOUT_044_ID = '10000000-0000-0000-0000-000000000044'; // returned - calibration (with inspections)
export const CHECKOUT_045_ID = '10000000-0000-0000-0000-000000000045'; // returned - repair (with inspections)
export const CHECKOUT_046_ID = '10000000-0000-0000-0000-000000000046'; // returned - calibration (without inspections)
export const CHECKOUT_047_ID = '10000000-0000-0000-0000-000000000047'; // returned - repair (without inspections)
export const CHECKOUT_048_ID = '10000000-0000-0000-0000-000000000048'; // returned - rental (without inspections)
export const CHECKOUT_049_ID = '10000000-0000-0000-0000-000000000049'; // returned - rental (without inspections)

// Return approved checkouts (50-55)
export const CHECKOUT_050_ID = '10000000-0000-0000-0000-000000000050'; // return_approved - calibration
export const CHECKOUT_051_ID = '10000000-0000-0000-0000-000000000051'; // return_approved - repair
export const CHECKOUT_052_ID = '10000000-0000-0000-0000-000000000052'; // return_approved - rental
export const CHECKOUT_053_ID = '10000000-0000-0000-0000-000000000053'; // return_approved - calibration
export const CHECKOUT_054_ID = '10000000-0000-0000-0000-000000000054'; // return_approved - repair
export const CHECKOUT_055_ID = '10000000-0000-0000-0000-000000000055'; // return_approved - rental

// Overdue checkouts (56-61)
export const CHECKOUT_056_ID = '10000000-0000-0000-0000-000000000056'; // overdue - pending
export const CHECKOUT_057_ID = '10000000-0000-0000-0000-000000000057'; // overdue - pending
export const CHECKOUT_058_ID = '10000000-0000-0000-0000-000000000058'; // overdue - pending
export const CHECKOUT_059_ID = '10000000-0000-0000-0000-000000000059'; // overdue - checked_out
export const CHECKOUT_060_ID = '10000000-0000-0000-0000-000000000060'; // overdue - checked_out
export const CHECKOUT_061_ID = '10000000-0000-0000-0000-000000000061'; // overdue - checked_out

// Canceled checkouts (62-64)
export const CHECKOUT_062_ID = '10000000-0000-0000-0000-000000000062'; // canceled
export const CHECKOUT_063_ID = '10000000-0000-0000-0000-000000000063'; // canceled
export const CHECKOUT_064_ID = '10000000-0000-0000-0000-000000000064'; // canceled

// Multi-equipment variations (65-68)
export const CHECKOUT_065_ID = '10000000-0000-0000-0000-000000000065'; // 3 equipment
export const CHECKOUT_066_ID = '10000000-0000-0000-0000-000000000066'; // 3 equipment
export const CHECKOUT_067_ID = '10000000-0000-0000-0000-000000000067'; // 3 equipment
export const CHECKOUT_068_ID = '10000000-0000-0000-0000-000000000068'; // 3 equipment
