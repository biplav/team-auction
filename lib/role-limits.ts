import { normalizeRole } from "@/lib/roles";

export type RoleLimit = {
  min?: number;
  max?: number;
};

export type RoleLimits = Record<string, RoleLimit>;

export function parseRoleLimits(input: unknown): RoleLimits {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const parsed: RoleLimits = {};
  for (const [rawRole, rawLimit] of Object.entries(input as Record<string, unknown>)) {
    if (!rawRole || typeof rawRole !== "string") continue;
    if (!rawLimit || typeof rawLimit !== "object" || Array.isArray(rawLimit)) continue;

    const role = normalizeRole(rawRole);
    const candidate = rawLimit as Record<string, unknown>;
    const min = typeof candidate.min === "number" ? Math.max(0, Math.floor(candidate.min)) : undefined;
    const max = typeof candidate.max === "number" ? Math.max(0, Math.floor(candidate.max)) : undefined;

    parsed[role] = {
      ...(min !== undefined ? { min } : {}),
      ...(max !== undefined ? { max } : {}),
    };
  }

  return parsed;
}

export function getRoleMaxLimit(roleLimits: unknown, role: string): number | null {
  const parsed = parseRoleLimits(roleLimits);
  const normalizedRole = normalizeRole(role);
  const limit = parsed[normalizedRole];

  if (!limit || typeof limit.max !== "number") {
    return null;
  }

  return limit.max;
}
