/**
 * Navigation module for the 七钟残响 player resource site.
 * Handles section switching, active state management, and scroll behavior.
 */

/**
 * Initialize navigation by attaching click listeners to all nav buttons.
 *
 * @param {Document} doc - The document object (for testability with jsdom)
 */
function initNavigation(doc) {
  const buttons = doc.querySelectorAll('.nav-btn');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      switchSection(doc, button);
    });
  });
}

/**
 * Switch the active section based on the clicked button.
 *
 * @param {Document} doc - The document object
 * @param {HTMLElement} button - The clicked navigation button
 */
function switchSection(doc, button) {
  // 1. Update navigation highlight
  doc.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  button.classList.add('active');

  // 2. Toggle content sections
  doc.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
  const targetId = button.getAttribute('data-target');
  const targetSection = doc.getElementById(targetId);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  return targetId;
}

/**
 * Get the currently active section ID.
 *
 * @param {Document} doc - The document object
 * @returns {string|null} The ID of the active section, or null if none
 */
function getActiveSection(doc) {
  const activeSection = doc.querySelector('.content-section.active');
  return activeSection ? activeSection.id : null;
}

/**
 * Get the currently active navigation button's target.
 *
 * @param {Document} doc - The document object
 * @returns {string|null} The data-target of the active nav button, or null
 */
function getActiveNavTarget(doc) {
  const activeBtn = doc.querySelector('.nav-btn.active');
  return activeBtn ? activeBtn.getAttribute('data-target') : null;
}

/**
 * Get all available section IDs from the navigation.
 *
 * @param {Document} doc - The document object
 * @returns {string[]} Array of section target IDs
 */
function getAllSectionIds(doc) {
  const buttons = doc.querySelectorAll('.nav-btn');
  return Array.from(buttons).map(btn => btn.getAttribute('data-target'));
}

module.exports = {
  initNavigation,
  switchSection,
  getActiveSection,
  getActiveNavTarget,
  getAllSectionIds,
};
