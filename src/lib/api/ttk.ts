import { INITIAL_MONSTER_INPUTS, getMonsters } from '@/lib/Monsters';
import {
  availableEquipment,
  calculateAttackSpeed,
  calculateEquipmentBonusesFromGear,
} from '@/lib/Equipment';
import PlayerVsNPCCalc from '@/lib/PlayerVsNPCCalc';
import { Monster } from '@/types/Monster';
import { EquipmentPiece, Player, PlayerEquipment, PlayerSkills } from '@/types/Player';
import { Prayer } from '@/enums/Prayer';
import Potion from '@/enums/Potion';
import { PlayerCombatStyle } from '@/types/PlayerCombatStyle';
import { EquipmentCategory } from '@/enums/EquipmentCategory';
import { PartialDeep } from 'type-fest';
import merge from 'lodash.mergewith';

type EquipmentSlot = keyof PlayerEquipment;

export interface TtkApiSetupInput {
  name?: string;
  equipment: Partial<Record<EquipmentSlot, number | string | null>>;
  style?: PlayerCombatStyle;
  skills?: Partial<PlayerSkills>;
  boosts?: Partial<PlayerSkills>;
  prayers?: Prayer[];
  buffs?: Partial<Player['buffs']>;
}

export interface TtkApiRequest {
  monsterId: number | string;
  monsterVersion?: string;
  monsterInputs?: PartialDeep<Monster['inputs']>;
  setup: TtkApiSetupInput;
}

export interface TtkApiResult {
  ttk: number | null;
  dps: number;
  maxHit: number;
  accuracy: number;
  attackSpeed: number;
  monster: {
    id: number;
    name: string;
    version?: string;
    currentHp: number;
  };
}

const equipmentById = new Map<number, EquipmentPiece>(availableEquipment.map((eq) => [eq.id, eq]));

const monsters = getMonsters();

const typedMerge = <T>(base: T, updates: PartialDeep<T>): T => merge({}, base, updates);
const normalize = (v: string): string => v.trim().toLowerCase();

const makeBasePlayer = (): Player => ({
  name: 'API Setup',
  style: { name: 'Punch', type: 'crush', stance: 'Accurate' },
  skills: {
    atk: 99,
    def: 99,
    hp: 99,
    magic: 99,
    prayer: 99,
    ranged: 99,
    str: 99,
    mining: 99,
    herblore: 99,
  },
  boosts: {
    atk: 0,
    def: 0,
    hp: 0,
    magic: 0,
    prayer: 0,
    ranged: 0,
    str: 0,
    mining: 0,
    herblore: 0,
  },
  equipment: {
    ammo: null,
    body: null,
    cape: null,
    feet: null,
    hands: null,
    head: null,
    legs: null,
    neck: null,
    ring: null,
    shield: null,
    weapon: null,
  },
  attackSpeed: 4,
  prayers: [],
  bonuses: {
    str: 0,
    ranged_str: 0,
    magic_str: 0,
    prayer: 0,
  },
  defensive: {
    stab: 0,
    slash: 0,
    crush: 0,
    magic: 0,
    ranged: 0,
  },
  offensive: {
    stab: 0,
    slash: 0,
    crush: 0,
    magic: 0,
    ranged: 0,
  },
  buffs: {
    potions: [] as Potion[],
    onSlayerTask: true,
    inWilderness: false,
    kandarinDiary: true,
    chargeSpell: false,
    markOfDarknessSpell: false,
    forinthrySurge: false,
    soulreaperStacks: 0,
    baAttackerLevel: 0,
    chinchompaDistance: 4,
    usingSunfireRunes: false,
  },
  spell: null,
});

const parseMonsterNameAndVersion = (idOrName: number | string, explicitVersion?: string): { ref: number | string, version?: string } => {
  if (typeof idOrName !== 'string') {
    return { ref: idOrName, version: explicitVersion };
  }

  if (explicitVersion) {
    return { ref: idOrName, version: explicitVersion };
  }

  const splitIx = idOrName.lastIndexOf('#');
  if (splitIx < 0) {
    return { ref: idOrName, version: undefined };
  }

  const name = idOrName.slice(0, splitIx).trim();
  const version = idOrName.slice(splitIx + 1).trim();
  if (!name || !version) {
    return { ref: idOrName, version: undefined };
  }

  return { ref: name, version };
};

const resolveMonster = (idOrName: number | string, version?: string): Omit<Monster, 'inputs'> => {
  const parsed = parseMonsterNameAndVersion(idOrName, version);
  const ref = parsed.ref;
  const parsedVersion = parsed.version;

  let candidates: Omit<Monster, 'inputs'>[];
  if (typeof ref === 'number') {
    candidates = monsters.filter((m) => m.id === ref);
  } else {
    const query = normalize(ref);
    const exact = monsters.filter((m) => normalize(m.name) === query);
    candidates = exact.length > 0 ? exact : monsters.filter((m) => normalize(m.name).includes(query));
  }

  if (candidates.length === 0) {
    throw new Error(`Unknown monster "${idOrName}"`);
  }

  if (parsedVersion) {
    const versionQuery = normalize(parsedVersion);
    const exact = candidates.find((m) => normalize(m.version || '') === versionQuery);
    if (!exact) {
      throw new Error(`Monster "${idOrName}" has no version "${parsedVersion}"`);
    }
    return exact;
  }

  if (candidates.length > 1) {
    const labels = candidates
      .slice(0, 5)
      .map((m) => `${m.name}${m.version ? `#${m.version}` : ''}`)
      .join(', ');
    throw new Error(`Monster "${idOrName}" is ambiguous. Use monsterVersion or numeric ID. Matches: ${labels}`);
  }

  return candidates[0];
};

const resolveEquipment = (slot: EquipmentSlot, itemIdOrName: number | string | null | undefined): EquipmentPiece | null => {
  if (itemIdOrName === null || itemIdOrName === undefined) {
    return null;
  }

  let found: EquipmentPiece | undefined;
  if (typeof itemIdOrName === 'number') {
    found = equipmentById.get(itemIdOrName);
  } else {
    const query = normalize(itemIdOrName);
    const slotCandidates = availableEquipment.filter((e) => e.slot === slot);
    const exact = slotCandidates.filter((e) => normalize(e.name) === query);
    const matches = exact.length > 0 ? exact : slotCandidates.filter((e) => normalize(e.name).includes(query));
    if (matches.length === 1) {
      [found] = matches;
    } else if (matches.length > 1) {
      const labels = matches
        .slice(0, 5)
        .map((e) => `${e.name}${e.version ? `#${e.version}` : ''}`)
        .join(', ');
      throw new Error(`Equipment "${itemIdOrName}" is ambiguous for slot ${slot}. Use numeric ID. Matches: ${labels}`);
    }
  }

  if (!found) {
    throw new Error(`Unknown equipment "${itemIdOrName}" for slot ${slot}`);
  }

  if (found.slot !== slot) {
    throw new Error(`Equipment "${itemIdOrName}" is a ${found.slot} item, not ${slot}`);
  }

  return found;
};

const resolveStyle = (player: Player, inputStyle?: PlayerCombatStyle): PlayerCombatStyle => {
  if (inputStyle) {
    return inputStyle;
  }

  const category = player.equipment.weapon?.category || EquipmentCategory.NONE;
  if ([EquipmentCategory.BOW, EquipmentCategory.CROSSBOW, EquipmentCategory.THROWN, EquipmentCategory.CHINCHOMPA].includes(category)) {
    return { name: 'Accurate', type: 'ranged', stance: 'Accurate' };
  }

  if ([EquipmentCategory.POWERED_STAFF, EquipmentCategory.POWERED_WAND].includes(category)) {
    return { name: 'Accurate', type: 'magic', stance: 'Accurate' };
  }

  if (category === EquipmentCategory.NONE) {
    return { name: 'Punch', type: 'crush', stance: 'Accurate' };
  }

  return { name: 'Lunge', type: 'stab', stance: 'Accurate' };
};

export const computeTtkForSetup = (input: TtkApiRequest): TtkApiResult => {
  const monsterBase = resolveMonster(input.monsterId, input.monsterVersion);
  const monster: Monster = typedMerge(
    {
      ...monsterBase,
      inputs: {
        ...INITIAL_MONSTER_INPUTS,
        monsterCurrentHp: monsterBase.skills.hp,
      },
    },
    input.monsterInputs || {},
  );

  const basePlayer = makeBasePlayer();
  const equipped: PlayerEquipment = {
    ammo: resolveEquipment('ammo', input.setup.equipment.ammo),
    body: resolveEquipment('body', input.setup.equipment.body),
    cape: resolveEquipment('cape', input.setup.equipment.cape),
    feet: resolveEquipment('feet', input.setup.equipment.feet),
    hands: resolveEquipment('hands', input.setup.equipment.hands),
    head: resolveEquipment('head', input.setup.equipment.head),
    legs: resolveEquipment('legs', input.setup.equipment.legs),
    neck: resolveEquipment('neck', input.setup.equipment.neck),
    ring: resolveEquipment('ring', input.setup.equipment.ring),
    shield: resolveEquipment('shield', input.setup.equipment.shield),
    weapon: resolveEquipment('weapon', input.setup.equipment.weapon),
  };

  let player = typedMerge(basePlayer, {
    name: input.setup.name || basePlayer.name,
    equipment: equipped,
    skills: input.setup.skills || {},
    boosts: input.setup.boosts || {},
    prayers: input.setup.prayers || [],
    buffs: input.setup.buffs || {},
  });

  player = {
    ...player,
    style: resolveStyle(player, input.setup.style),
  };

  const gearTotals = calculateEquipmentBonusesFromGear(player, monster);
  player = {
    ...player,
    ...gearTotals,
    attackSpeed: calculateAttackSpeed(player, monster),
  };

  const calc = new PlayerVsNPCCalc(player, monster, { loadoutName: player.name });
  const rawTtk = calc.getTtk();
  const ttk = Number.isFinite(rawTtk) ? rawTtk : null;

  return {
    ttk,
    dps: calc.getDps(),
    maxHit: calc.getMax(),
    accuracy: calc.getHitChance(),
    attackSpeed: player.attackSpeed,
    monster: {
      id: monster.id,
      name: monster.name,
      version: monster.version,
      currentHp: monster.inputs.monsterCurrentHp,
    },
  };
};
