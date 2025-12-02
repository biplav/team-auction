export interface FormattedPlayerStat {
  key: string;
  label: string;
  value: string;
  isPhoneNumber: boolean;
}

/**
 * Filters and formats player stats for display
 * - Removes empty/null/undefined values
 * - Masks phone numbers for privacy
 * - Formats field names from camelCase to Title Case
 * - Orders common fields predictably
 */
export function getDisplayablePlayerStats(stats: any): FormattedPlayerStat[] {
  if (!stats || typeof stats !== 'object') return [];

  const formattedStats = Object.entries(stats)
    .filter(([_, value]) => {
      // Filter out empty, null, undefined, "N/A", empty arrays/objects
      if (value === null || value === undefined || value === '') return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      if (typeof value === 'string' && value.toLowerCase() === 'n/a') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === 'object' && Object.keys(value).length === 0) return false;
      return true;
    })
    .map(([key, value]) => {
      const isPhoneNumber = key.toLowerCase().includes('phone');
      const displayValue = isPhoneNumber && String(value).length > 4
        ? `****${String(value).slice(-4)}`
        : String(value);

      // Convert camelCase to Title Case
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();

      return {
        key,
        label,
        value: displayValue,
        isPhoneNumber,
      };
    });

  // Sort stats by predefined order for common fields, then alphabetically
  const fieldOrder = ['phoneNumber', 'battingStyle', 'bowlingStyle', 'matches', 'runs', 'wickets', 'jerseyNumber', 'city'];

  return formattedStats.sort((a, b) => {
    const aIndex = fieldOrder.indexOf(a.key);
    const bIndex = fieldOrder.indexOf(b.key);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.key.localeCompare(b.key);
  });
}
