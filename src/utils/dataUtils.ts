
/**
 * Format a number as currency in AED
 * @param amount - The amount to format
 * @returns A string representation of the amount in AED format
 */
export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} AED`;
};
