
/**
 * Format date for display in Dubai format
 */
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-AE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format currency in AED format
 */
export const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-AE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " AED";
};
