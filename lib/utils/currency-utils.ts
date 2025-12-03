/**
 * Formats a number with comma separators for Indian number system
 * Example: 1000000 -> "10,00,000"
 */
export function formatNumberWithCommas(value: number | string): string {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const numValue = typeof value === "string" ? parseInt(value) || 0 : value;

  // Use Indian number format with commas
  return numValue.toLocaleString("en-IN");
}

/**
 * Parses a comma-separated string to a number
 * Example: "10,00,000" -> 1000000
 */
export function parseNumberFromCommas(value: string): number {
  if (!value) return 0;

  // Remove all commas and parse to integer
  const cleaned = value.replace(/,/g, "");
  return parseInt(cleaned) || 0;
}

/**
 * Handles input change for currency fields
 * Removes non-numeric characters except commas
 */
export function sanitizeCurrencyInput(value: string): string {
  // Remove all non-numeric characters except commas
  return value.replace(/[^\d,]/g, "");
}
