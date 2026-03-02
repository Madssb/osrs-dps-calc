import { availableEquipment } from '@/lib/Equipment';
import { getMonsters } from '@/lib/Monsters';
import { EquipmentPiece } from '@/types/Player';
import { Monster } from '@/types/Monster';

export type LookupType = 'equipment' | 'monster';

export interface LookupParams {
  type: LookupType;
  name: string;
  version?: string;
  exact?: boolean;
  limit?: number;
}

export interface EquipmentLookupResult {
  type: 'equipment';
  id: number;
  name: string;
  version: string;
  slot: EquipmentPiece['slot'];
}

export interface MonsterLookupResult {
  type: 'monster';
  id: number;
  name: string;
  version: string;
}

export type LookupResult = EquipmentLookupResult | MonsterLookupResult;

const monsters = getMonsters();

const normalize = (v: string): string => v.trim().toLowerCase();

const matches = (haystack: string, needle: string, exact: boolean): boolean => {
  if (exact) {
    return haystack === needle;
  }
  return haystack.includes(needle);
};

const clampLimit = (limit?: number): number => {
  const DEFAULT_LIMIT = 20;
  const MAX_LIMIT = 100;

  if (limit === undefined || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_LIMIT);
};

export const lookupByName = (params: LookupParams): LookupResult[] => {
  const query = normalize(params.name);
  if (query.length === 0) {
    return [];
  }

  const exact = params.exact || false;
  const version = params.version ? normalize(params.version) : undefined;
  const limit = clampLimit(params.limit);

  if (params.type === 'equipment') {
    return availableEquipment
      .filter((eq) => {
        const nameMatch = matches(normalize(eq.name), query, exact);
        if (!nameMatch) {
          return false;
        }

        if (!version) {
          return true;
        }

        return normalize(eq.version || '') === version;
      })
      .slice(0, limit)
      .map((eq) => ({
        type: 'equipment' as const,
        id: eq.id,
        name: eq.name,
        version: eq.version || '',
        slot: eq.slot,
      }));
  }

  return monsters
    .filter((m: Omit<Monster, 'inputs'>) => {
      const nameMatch = matches(normalize(m.name), query, exact);
      if (!nameMatch) {
        return false;
      }

      if (!version) {
        return true;
      }

      return normalize(m.version || '') === version;
    })
    .slice(0, limit)
    .map((m) => ({
      type: 'monster' as const,
      id: m.id,
      name: m.name,
      version: m.version || '',
    }));
};
