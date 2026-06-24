const {
  calculateWeaponSlots,
  calculateTotalWeapons,
  getBaseInventory,
  getMaxEquippableWeapons,
  getAllowedWeaponTypes,
  validateWeaponSelection,
  rollDice,
  calculateDurabilityLoss,
  isWeaponBroken,
} = require('../src/gameLogic');

describe('calculateWeaponSlots', () => {
  test('base case: STR < 13, medium size => 1 slot', () => {
    expect(calculateWeaponSlots(10)).toBe(1);
    expect(calculateWeaponSlots(12)).toBe(1);
    expect(calculateWeaponSlots(8, false)).toBe(1);
  });

  test('STR >= 13 but < 17, medium size => 2 slots', () => {
    expect(calculateWeaponSlots(13)).toBe(2);
    expect(calculateWeaponSlots(15)).toBe(2);
    expect(calculateWeaponSlots(16)).toBe(2);
  });

  test('STR >= 17, medium size => 3 slots', () => {
    expect(calculateWeaponSlots(17)).toBe(3);
    expect(calculateWeaponSlots(20)).toBe(3);
  });

  test('STR < 13, large size => 2 slots', () => {
    expect(calculateWeaponSlots(10, true)).toBe(2);
    expect(calculateWeaponSlots(12, true)).toBe(2);
  });

  test('STR >= 13 but < 17, large size => 3 slots', () => {
    expect(calculateWeaponSlots(13, true)).toBe(3);
    expect(calculateWeaponSlots(16, true)).toBe(3);
  });

  test('STR >= 17, large size => 4 slots (maximum, capped)', () => {
    expect(calculateWeaponSlots(17, true)).toBe(4);
    expect(calculateWeaponSlots(20, true)).toBe(4);
  });

  test('maximum cap is 4 even with extreme stats', () => {
    expect(calculateWeaponSlots(30, true)).toBe(4);
  });
});

describe('calculateTotalWeapons', () => {
  test('basic formula calculation', () => {
    // T = (8 * 7) + (4 * 4) + (12 - 1) + 5 = 56 + 16 + 11 + 5 = 88
    const result = calculateTotalWeapons({
      totalSlots: 8,
      playerCount: 4,
      baseInventory: 5,
      roll2d4: 7,
      roll1d6: 4,
      roll2d8: 12,
      roll1d4: 1,
    });
    expect(result).toBe(88);
  });

  test('minimum dice rolls produce minimum inventory', () => {
    // T = (4 * 2) + (2 * 1) + (2 - 4) + 2 = 8 + 2 + (-2) + 2 = 10
    const result = calculateTotalWeapons({
      totalSlots: 4,
      playerCount: 2,
      baseInventory: 2,
      roll2d4: 2,
      roll1d6: 1,
      roll2d8: 2,
      roll1d4: 4,
    });
    expect(result).toBe(10);
  });

  test('maximum dice rolls produce maximum inventory', () => {
    // T = (16 * 8) + (6 * 6) + (16 - 1) + 8 = 128 + 36 + 15 + 8 = 187
    const result = calculateTotalWeapons({
      totalSlots: 16,
      playerCount: 6,
      baseInventory: 8,
      roll2d4: 8,
      roll1d6: 6,
      roll2d8: 16,
      roll1d4: 1,
    });
    expect(result).toBe(187);
  });

  test('single player party', () => {
    // T = (2 * 5) + (1 * 3) + (8 - 2) + 5 = 10 + 3 + 6 + 5 = 24
    const result = calculateTotalWeapons({
      totalSlots: 2,
      playerCount: 1,
      baseInventory: 5,
      roll2d4: 5,
      roll1d6: 3,
      roll2d8: 8,
      roll1d4: 2,
    });
    expect(result).toBe(24);
  });

  test('throws on invalid playerCount', () => {
    expect(() => calculateTotalWeapons({
      totalSlots: 4,
      playerCount: 0,
      baseInventory: 5,
      roll2d4: 4,
      roll1d6: 3,
      roll2d8: 8,
      roll1d4: 2,
    })).toThrow('Invalid parameters');
  });

  test('throws on negative totalSlots', () => {
    expect(() => calculateTotalWeapons({
      totalSlots: -1,
      playerCount: 4,
      baseInventory: 5,
      roll2d4: 4,
      roll1d6: 3,
      roll2d8: 8,
      roll1d4: 2,
    })).toThrow('Invalid parameters');
  });
});

describe('getBaseInventory', () => {
  test('beginner tier (level 1-4) returns 8', () => {
    expect(getBaseInventory(1)).toBe(8);
    expect(getBaseInventory(2)).toBe(8);
    expect(getBaseInventory(4)).toBe(8);
  });

  test('standard tier (level 5-15) returns 5', () => {
    expect(getBaseInventory(5)).toBe(5);
    expect(getBaseInventory(10)).toBe(5);
    expect(getBaseInventory(15)).toBe(5);
  });

  test('hardcore tier (level 16+) returns 2', () => {
    expect(getBaseInventory(16)).toBe(2);
    expect(getBaseInventory(20)).toBe(2);
  });

  test('throws on level < 1', () => {
    expect(() => getBaseInventory(0)).toThrow('Level must be at least 1');
    expect(() => getBaseInventory(-1)).toThrow('Level must be at least 1');
  });
});

describe('getMaxEquippableWeapons', () => {
  test('level 1-4 => 1 weapon', () => {
    expect(getMaxEquippableWeapons(1)).toBe(1);
    expect(getMaxEquippableWeapons(4)).toBe(1);
  });

  test('level 5-12 => 2 weapons', () => {
    expect(getMaxEquippableWeapons(5)).toBe(2);
    expect(getMaxEquippableWeapons(8)).toBe(2);
    expect(getMaxEquippableWeapons(12)).toBe(2);
  });

  test('level 13-16 => 3 weapons', () => {
    expect(getMaxEquippableWeapons(13)).toBe(3);
    expect(getMaxEquippableWeapons(16)).toBe(3);
  });

  test('level 17-20 => 4 weapons', () => {
    expect(getMaxEquippableWeapons(17)).toBe(4);
    expect(getMaxEquippableWeapons(20)).toBe(4);
  });

  test('throws on invalid levels', () => {
    expect(() => getMaxEquippableWeapons(0)).toThrow('Level must be between 1 and 20');
    expect(() => getMaxEquippableWeapons(21)).toThrow('Level must be between 1 and 20');
  });
});

describe('getAllowedWeaponTypes', () => {
  test('level 1-4 => light and medium only', () => {
    expect(getAllowedWeaponTypes(1)).toEqual(['light', 'medium']);
    expect(getAllowedWeaponTypes(4)).toEqual(['light', 'medium']);
  });

  test('level 5-8 => includes heavy', () => {
    const types = getAllowedWeaponTypes(5);
    expect(types).toContain('light');
    expect(types).toContain('medium');
    expect(types).toContain('heavy');
    expect(types).not.toContain('special');
  });

  test('level 9-12 => includes special and rare', () => {
    const types = getAllowedWeaponTypes(9);
    expect(types).toContain('heavy');
    expect(types).toContain('special');
    expect(types).toContain('rare');
    expect(types).not.toContain('magic');
  });

  test('level 13+ => all types including magic', () => {
    const types = getAllowedWeaponTypes(13);
    expect(types).toContain('magic');
    expect(types).toContain('special');
    expect(types).toContain('rare');
  });

  test('throws on invalid levels', () => {
    expect(() => getAllowedWeaponTypes(0)).toThrow();
    expect(() => getAllowedWeaponTypes(21)).toThrow();
  });
});

describe('validateWeaponSelection', () => {
  test('valid selection at level 1', () => {
    const result = validateWeaponSelection(1, [{ type: 'light' }]);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeNull();
  });

  test('too many weapons at level 1', () => {
    const result = validateWeaponSelection(1, [{ type: 'light' }, { type: 'medium' }]);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('at most 1');
  });

  test('disallowed weapon type at level 3', () => {
    const result = validateWeaponSelection(3, [{ type: 'heavy' }]);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not allowed');
  });

  test('valid heavy weapon at level 5', () => {
    const result = validateWeaponSelection(5, [{ type: 'light' }, { type: 'heavy' }]);
    expect(result.valid).toBe(true);
  });

  test('too many heavy weapons at level 5-8', () => {
    const result = validateWeaponSelection(6, [{ type: 'heavy' }, { type: 'heavy' }]);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('at most 1 heavy');
  });

  test('valid special weapon at level 9', () => {
    const result = validateWeaponSelection(9, [{ type: 'medium' }, { type: 'special' }]);
    expect(result.valid).toBe(true);
  });

  test('too many special/rare weapons at level 9-12', () => {
    const result = validateWeaponSelection(10, [{ type: 'special' }, { type: 'rare' }]);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('at most 1 special/rare');
  });

  test('no restrictions at level 17+', () => {
    const result = validateWeaponSelection(17, [
      { type: 'heavy' },
      { type: 'magic' },
      { type: 'special' },
      { type: 'rare' },
    ]);
    expect(result.valid).toBe(true);
  });

  test('empty selection is valid', () => {
    const result = validateWeaponSelection(1, []);
    expect(result.valid).toBe(true);
  });
});

describe('rollDice', () => {
  test('1d6 returns value between 1 and 6', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDice(1, 6);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  test('2d4 returns value between 2 and 8', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDice(2, 4);
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(8);
    }
  });

  test('2d8 returns value between 2 and 16', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDice(2, 8);
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(16);
    }
  });

  test('throws on invalid input', () => {
    expect(() => rollDice(0, 6)).toThrow();
    expect(() => rollDice(1, 0)).toThrow();
    expect(() => rollDice(-1, 6)).toThrow();
  });
});

describe('calculateDurabilityLoss', () => {
  test('normal hit reduces durability by 1', () => {
    expect(calculateDurabilityLoss(10)).toBe(9);
    expect(calculateDurabilityLoss(5)).toBe(4);
  });

  test('critical fail reduces durability by 2', () => {
    expect(calculateDurabilityLoss(10, true)).toBe(8);
    expect(calculateDurabilityLoss(3, true)).toBe(1);
  });

  test('halved loss on normal hit still reduces by 1 (minimum 1)', () => {
    expect(calculateDurabilityLoss(10, false, true)).toBe(9);
  });

  test('halved loss on critical fail reduces by 1 instead of 2', () => {
    expect(calculateDurabilityLoss(10, true, true)).toBe(9);
  });

  test('durability cannot go below 0', () => {
    expect(calculateDurabilityLoss(0)).toBe(0);
    expect(calculateDurabilityLoss(1, true)).toBe(0);
  });
});

describe('isWeaponBroken', () => {
  test('durability 0 means broken', () => {
    expect(isWeaponBroken(0)).toBe(true);
  });

  test('negative durability means broken', () => {
    expect(isWeaponBroken(-1)).toBe(true);
  });

  test('positive durability means not broken', () => {
    expect(isWeaponBroken(1)).toBe(false);
    expect(isWeaponBroken(10)).toBe(false);
  });
});
