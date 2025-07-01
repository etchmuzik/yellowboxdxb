
/**
 * Parse a date string safely, returning a Date object
 */
export const parseDate = (dateStr: string): Date => {
  try {
    return new Date(dateStr);
  } catch (e) {
    return new Date();
  }
};

/**
 * Format a date as a string using the Dubai timezone (Asia/Dubai)
 */
export const formatDubaiDate = (date: Date): string => {
  return date.toLocaleString("en-AE", { timeZone: "Asia/Dubai" });
};
