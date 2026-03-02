import { expect, test } from '@jest/globals';
import { lookupByName } from '@/lib/api/lookup';

test('lookupByName finds equipment by partial name', () => {
  const res = lookupByName({
    type: 'equipment',
    name: 'abyssal whip',
  });

  expect(res.length).toBeGreaterThan(0);
  expect(res[0].type).toBe('equipment');
  expect(res.some((r) => r.name === 'Abyssal whip')).toBe(true);
});

test('lookupByName exact equipment match narrows results', () => {
  const res = lookupByName({
    type: 'equipment',
    name: 'Abyssal whip',
    exact: true,
  });

  expect(res.length).toBeGreaterThan(0);
  expect(res.every((r) => r.name === 'Abyssal whip')).toBe(true);
});

test('lookupByName finds monster by exact name', () => {
  const res = lookupByName({
    type: 'monster',
    name: 'Abyssal demon',
    exact: true,
  });

  expect(res.length).toBeGreaterThan(0);
  expect(res[0].type).toBe('monster');
  expect(res.every((r) => r.name === 'Abyssal demon')).toBe(true);
});
