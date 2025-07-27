/**
 * Shared constants to ensure consistency between different parts of the application.
 */

// Defines the possible application stages for a rider.
// This provides a single source of truth for the enum values used in
// both the GraphQL schema and the Zod validation schemas.
export const APPLICATION_STAGES = [
  'APPLIED',
  'DOCUMENT_VERIFICATION',
  'THEORY_TEST',
  'ROAD_TEST',
  'MEDICAL',
  'ID_ISSUED',
  'ACTIVE',
  'REJECTED',
] as const;

// Defines the possible categories for an expense, based on
// `expense-management/requirements.md`.
export const EXPENSE_CATEGORIES = [
  'VISA_FEES', 'RTA_TESTS', 'MEDICAL', 'RESIDENCY_ID', 'TRAINING', 'UNIFORM', 'OTHER'
] as const;

// Defines the approval status for an expense.
export const APPROVAL_STATUSES = [
  'PENDING', 'APPROVED', 'REJECTED'
] as const;

// Defines the possible statuses for a company bike.
export const BIKE_STATUSES = ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE'] as const;

// Defines the types of historical events for a bike.
export const BIKE_EVENT_TYPES = ['ASSIGNED', 'UNASSIGNED', 'MAINTENANCE_START', 'MAINTENANCE_END'] as const;