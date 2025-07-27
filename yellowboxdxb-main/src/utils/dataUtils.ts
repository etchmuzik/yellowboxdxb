
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

/**
 * Format a date for display
 * @param date - The date to format (Date object or string)
 * @returns A formatted date string
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-AE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
