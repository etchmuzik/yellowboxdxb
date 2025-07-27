import { defineQuery, getFirestore } from '@google-cloud/dataconnect';
import { z } from 'zod';
import { EXPENSE_CATEGORIES } from './constants';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Zod schema for validating the input for the financial report query.
 */
const financialReportInputSchema = z.object({
  startDate: z.instanceof(Timestamp).optional(),
  endDate: z.instanceof(Timestamp).optional(),
}).optional();

/**
 * Defines the `financialReport` query.
 * This query aggregates all approved expenses to generate a summary,
 * as required by the finance workflow in `expense-management/requirements.md`.
 */
export const financialReport = defineQuery('financialReport', {
  input: financialReportInputSchema,
  async handler(input) {
    const db = getFirestore();
    // Start by querying only approved expenses, as they are the ones that count towards financials.
    let query: FirebaseFirestore.Query = db.collection('expenses').where('status', '==', 'APPROVED');

    if (input?.startDate) {
      query = query.where('createdAt', '>=', input.startDate);
    }
    if (input?.endDate) {
      query = query.where('createdAt', '<=', input.endDate);
    }

    const snapshot = await query.get();

    // Initialize aggregators.
    const summary: Record<string, { totalAmount: number, expenseCount: number }> = {};
    let totalExpenses = 0;

    // Process each expense document.
    snapshot.docs.forEach(doc => {
      const expense = doc.data();
      if (!summary[expense.category]) {
        summary[expense.category] = { totalAmount: 0, expenseCount: 0 };
      }
      summary[expense.category].totalAmount += expense.amount;
      summary[expense.category].expenseCount += 1;
      totalExpenses += expense.amount;
    });

    // Format the aggregated data to match the GraphQL schema.
    const categorySummaries = Object.entries(summary).map(([category, data]) => ({
      category,
      ...data,
    }));

    return {
      totalExpenses,
      totalExpenseCount: snapshot.size,
      categorySummaries,
    };
  },
});