/**
 * Game logic module for the 七钟残响 DND 5e campaign.
 * Extracted from the inline rules in index.html for testability.
 */

/**
 * Calculate the number of main weapon slots a character can carry.
 * Based on STR score and body size.
 *
 * Rules:
 * - Base slots: 1
 * - STR >= 13: +1
 * - STR >= 17: +1 (replaces the STR >= 13 bonus, so total +2 from STR)
 * - Large size: +1
 * - STR >= 17 AND Large: additional +1
 * - Maximum: 4
 *
 * @param {number} str - Strength score
 * @param {boolean} isLarge - Whether the character is Large size
 * @returns {number} Number of weapon slots (1-4)
 */
function calculateWeaponSlots(str, isLarge = false) {
  let slots = 1;

  if (str >= 17) {
    slots += 2;
  } else if (str >= 13) {
    slots += 1;
  }

  if (isLarge) {
    slots += 1;
    if (str >= 17) {
      slots += 1;
    }
  }

  return Math.min(slots, 4);
}

/**
 * Calculate total weapon inventory count for the depot.
 * Formula: T = (totalSlots * roll2d4) + (playerCount * roll1d6) + (roll2d8 - roll1d4) + baseInventory
 *
 * @param {Object} params
 * @param {number} params.totalSlots - Sum of all player weapon slots
 * @param {number} params.playerCount - Number of players
 * @param {number} params.baseInventory - Base inventory value (depends on tier)
 * @param {number} params.roll2d4 - Result of 2d4 roll (2-8)
 * @param {number} params.roll1d6 - Result of 1d6 roll (1-6)
 * @param {number} params.roll2d8 - Result of 2d8 roll (2-16)
 * @param {number} params.roll1d4 - Result of 1d4 roll (1-4)
 * @returns {number} Total weapon count T
 */
function calculateTotalWeapons({ totalSlots, playerCount, baseInventory, roll2d4, roll1d6, roll2d8, roll1d4 }) {
  if (totalSlots < 0 || playerCount < 1) {
    throw new Error('Invalid parameters: totalSlots must be >= 0 and playerCount must be >= 1');
  }
  return (totalSlots * roll2d4) + (playerCount * roll1d6) + (roll2d8 - roll1d4) + baseInventory;
}

/**
 * Get the base inventory value for the campaign tier.
 *
 * @param {number} level - Average party level
 * @returns {number} Base inventory value
 */
function getBaseInventory(level) {
  if (level < 1) {
    throw new Error('Level must be at least 1');
  }
  if (level < 5) {
    return 8; // Beginner tier
  }
  if (level <= 15) {
    return 5; // Standard tier
  }
  return 2; // Hardcore tier (16+)
}

/**
 * Get the maximum number of main weapons a character can equip based on level.
 *
 * @param {number} level - Character level (1-20)
 * @returns {number} Maximum equippable weapons
 */
function getMaxEquippableWeapons(level) {
  if (level < 1 || level > 20) {
    throw new Error('Level must be between 1 and 20');
  }
  if (level <= 4) return 1;
  if (level <= 12) return 2;
  if (level <= 16) return 3;
  return 4;
}

/**
 * Get allowed weapon categories based on character level.
 *
 * @param {number} level - Character level (1-20)
 * @returns {string[]} Array of allowed weapon type strings
 */
function getAllowedWeaponTypes(level) {
  if (level < 1 || level > 20) {
    throw new Error('Level must be between 1 and 20');
  }
  if (level <= 4) {
    return ['light', 'medium'];
  }
  if (level <= 8) {
    return ['light', 'medium', 'heavy'];
  }
  if (level <= 12) {
    return ['light', 'medium', 'heavy', 'special', 'rare'];
  }
  // Level 13+: no restrictions
  return ['light', 'medium', 'heavy', 'special', 'rare', 'magic'];
}

/**
 * Validate a weapon selection against level-based restrictions.
 *
 * @param {number} level - Character level
 * @param {Array<{type: string}>} selectedWeapons - Array of weapon objects with type property
 * @returns {{valid: boolean, reason: string|null}}
 */
function validateWeaponSelection(level, selectedWeapons) {
  const maxWeapons = getMaxEquippableWeapons(level);
  if (selectedWeapons.length > maxWeapons) {
    return { valid: false, reason: `Level ${level} characters can equip at most ${maxWeapons} weapon(s)` };
  }

  const allowedTypes = getAllowedWeaponTypes(level);
  for (const weapon of selectedWeapons) {
    if (!allowedTypes.includes(weapon.type)) {
      return { valid: false, reason: `Weapon type "${weapon.type}" is not allowed at level ${level}` };
    }
  }

  // Level 5-8: at most 1 heavy weapon
  if (level >= 5 && level <= 8) {
    const heavyCount = selectedWeapons.filter(w => w.type === 'heavy').length;
    if (heavyCount > 1) {
      return { valid: false, reason: 'Level 5-8 characters can equip at most 1 heavy weapon' };
    }
  }

  // Level 9-12: at most 1 special/rare weapon
  if (level >= 9 && level <= 12) {
    const specialCount = selectedWeapons.filter(w => w.type === 'special' || w.type === 'rare').length;
    if (specialCount > 1) {
      return { valid: false, reason: 'Level 9-12 characters can equip at most 1 special/rare weapon' };
    }
  }

  return { valid: true, reason: null };
}

/**
 * Simulate a dice roll. Returns a random integer between min and max inclusive.
 * For NdX: min = N, max = N*X
 *
 * @param {number} count - Number of dice
 * @param {number} sides - Number of sides per die
 * @returns {number} Roll result
 */
function rollDice(count, sides) {
  if (count < 1 || sides < 1) {
    throw new Error('Dice count and sides must be at least 1');
  }
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

/**
 * Calculate durability loss for a weapon based on usage.
 * Standard hit: -1 durability
 * Critical fail (natural 1): -2 durability
 * Special materials (e.g., Damascus steel): halved durability loss
 *
 * @param {number} currentDurability - Current weapon durability
 * @param {boolean} isCriticalFail - Whether the attack was a natural 1
 * @param {boolean} halvedLoss - Whether durability loss is halved (e.g., Damascus steel)
 * @returns {number} New durability value (minimum 0)
 */
function calculateDurabilityLoss(currentDurability, isCriticalFail = false, halvedLoss = false) {
  let loss = isCriticalFail ? 2 : 1;
  if (halvedLoss) {
    loss = Math.max(1, Math.floor(loss / 2));
  }
  return Math.max(0, currentDurability - loss);
}

/**
 * Determine if a weapon is broken (durability reached 0).
 *
 * @param {number} durability - Current durability
 * @returns {boolean}
 */
function isWeaponBroken(durability) {
  return durability <= 0;
}

module.exports = {
  calculateWeaponSlots,
  calculateTotalWeapons,
  getBaseInventory,
  getMaxEquippableWeapons,
  getAllowedWeaponTypes,
  validateWeaponSelection,
  rollDice,
  calculateDurabilityLoss,
  isWeaponBroken,
};
