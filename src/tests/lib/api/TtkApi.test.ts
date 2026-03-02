import { expect, test } from '@jest/globals';
import { computeTtkForSetup } from '@/lib/api/ttk';
import { findEquipment, getTestMonster } from '@/tests/utils/TestUtils';

test('computeTtkForSetup returns finite ttk for basic melee setup', () => {
  const monster = getTestMonster('Abyssal demon', 'Standard');
  const whip = findEquipment('Abyssal whip');
  const fury = findEquipment('Amulet of fury');

  const result = computeTtkForSetup({
    monsterId: monster.id,
    setup: {
      equipment: {
        weapon: whip.id,
        neck: fury.id,
      },
    },
  });

  expect(result.ttk).not.toBeNull();
  expect(result.ttk!).toBeGreaterThan(0);
  expect(result.dps).toBeGreaterThan(0);
});

test('computeTtkForSetup throws for unknown equipment id', () => {
  expect(() => computeTtkForSetup({
    monsterId: 415,
    setup: {
      equipment: {
        weapon: 999999999,
      },
    },
  })).toThrow('Unknown equipment');
});

test('computeTtkForSetup accepts monster and equipment names', () => {
  const result = computeTtkForSetup({
    monsterId: 'abyssal demon',
    monsterVersion: 'Standard',
    setup: {
      equipment: {
        weapon: 'abyssal whip',
        neck: 'amulet of strength',
      },
    },
  });

  expect(result.ttk).not.toBeNull();
  expect(result.ttk!).toBeGreaterThan(0);
});

test('computeTtkForSetup accepts monster name with inline version', () => {
  const result = computeTtkForSetup({
    monsterId: 'yama#normal',
    setup: {
      equipment: {
        weapon: 'abyssal whip',
        neck: 'amulet of strength',
      },
    },
  });

  expect(result.monster.name).toBe('Yama');
  expect(result.ttk).not.toBeNull();
});
