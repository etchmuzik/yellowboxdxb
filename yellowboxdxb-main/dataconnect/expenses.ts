import { defineMutation, defineQuery, getFirestore } from '@google-cloud/dataconnect';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { APPROVAL_STATUSES, EXPENSE_CATEGORIES } from './constants';
import { getAuthenticatedUser } from './auth';

/**
 * Zod schema for validating the input for creating a new expense.
 */
const createExpenseInputSchema = z.object({
  riderId: z.string(),
  amount: z.number().positive({ message: "Amount must be positive" }),
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().optional(),
  receiptUrl: z.string().url({ message: "Invalid URL format" }).optional(),
});

/**
 * Defines the `createExpense` mutation.
 * This creates an expense document and sets its initial status to 'PENDING'.
 */
export const createExpense = defineMutation('createExpense', {
  input: createExpenseInputSchema,
  async handler(input, context) {
    // Any authenticated user can create an expense.
    getAuthenticatedUser(context);
    const now = Timestamp.now();
    const db = getFirestore();
    const newExpenseData = {
      ...input,
      status: 'PENDING', // All new expenses start as pending.
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await db.collection('expenses').add(newExpenseData);
    return {
      id: docRef.id,
      ...newExpenseData,
    };
  },
});

/**
 * Zod schema for updating an expense's status.
 * It uses a refinement to conditionally require `rejectionReason`.
 */
const updateExpenseStatusInputSchema = z.object({
  id: z.string(),
  status: z.enum(APPROVAL_STATUSES),
  rejectionReason: z.string().optional(),
}).refine(data => {
  // If the status is 'REJECTED', a rejectionReason must be provided.
  return data.status !== 'REJECTED' || (typeof data.rejectionReason === 'string' && data.rejectionReason.length > 0);
}, {
  message: "A rejection reason is required when rejecting an expense.",
  path: ["rejectionReason"], // Point the error to the rejectionReason field.
});

/**
 * Defines the `updateExpenseStatus` mutation.
 * This allows for approving or rejecting an expense, as required by the
 * finance workflow in `expense-management/requirements.md`.
 */
export const updateExpenseStatus = defineMutation('updateExpenseStatus', {
  input: updateExpenseStatusInputSchema,
  async handler(input, context) {
    const authenticatedUser = getAuthenticatedUser(context);

    // Authorization check: Only Finance users can approve or reject.
    if (authenticatedUser.role !== 'Finance' && authenticatedUser.role !== 'Admin') {
      throw new Error('PERMISSION_DENIED: You must be a Finance user to update expense status.');
    }

    const db = getFirestore();
    const expenseRef = db.collection('expenses').doc(input.id);

    const updateData = {
      status: input.status,
      rejectionReason: input.status === 'REJECTED' ? input.rejectionReason : null,
      updatedAt: Timestamp.now(),
    };

    await expenseRef.update(updateData);
    const updatedDoc = await expenseRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  },
});

/**
 * Zod schema for validating the input for the expenses query.
 */
const expensesQueryInputSchema = z.object({
  riderId: z.string().optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  status: z.enum(APPROVAL_STATUSES).optional(),
}).optional();

/**
 * Defines the `expenses` query.
 * This lists expenses from Firestore and allows filtering.
 */
export const expenses = defineQuery('expenses', {
  input: expensesQueryInputSchema,
  async handler(input, context) {
    // Any authenticated user can view expenses, security rules will filter.
    getAuthenticatedUser(context);
    const db = getFirestore();
    let query: FirebaseFirestore.Query = db.collection('expenses');

    if (input?.riderId) {
      query = query.where('riderId', '==', input.riderId);
    }
    if (input?.category) {
      query = query.where('category', '==', input.category);
    }
    if (input?.status) {
      query = query.where('status', '==', input.status);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      };
    });
  },
});