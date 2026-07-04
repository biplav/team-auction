export function normalizeRole(role: string): string {
  return role
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase()
    .replace(/\s+/g, "_");
}

export function formatRoleLabel(role: string): string {
  return role
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
