const { JSDOM } = require('jsdom');
const {
  initNavigation,
  switchSection,
  getActiveSection,
  getActiveNavTarget,
  getAllSectionIds,
} = require('../src/navigation');

/**
 * Helper to create a minimal DOM structure resembling the site.
 */
function createTestDOM() {
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <div class="sidebar">
        <ul class="menu-items">
          <li class="nav-btn active" data-target="home">Home</li>
          <li class="nav-btn" data-target="wpn-light">Light Weapons</li>
          <li class="nav-btn" data-target="wpn-medium">Medium Weapons</li>
          <li class="nav-btn" data-target="wpn-heavy">Heavy Weapons</li>
          <li class="nav-btn" data-target="armor-shop">Armor</li>
        </ul>
      </div>
      <div class="main-content">
        <div id="home" class="content-section active">Home Content</div>
        <div id="wpn-light" class="content-section">Light Weapons Content</div>
        <div id="wpn-medium" class="content-section">Medium Weapons Content</div>
        <div id="wpn-heavy" class="content-section">Heavy Weapons Content</div>
        <div id="armor-shop" class="content-section">Armor Content</div>
      </div>
    </body>
    </html>
  `;
  const dom = new JSDOM(html);
  return dom.window.document;
}

describe('getActiveSection', () => {
  test('returns the initially active section', () => {
    const doc = createTestDOM();
    expect(getActiveSection(doc)).toBe('home');
  });

  test('returns null when no section is active', () => {
    const doc = createTestDOM();
    doc.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    expect(getActiveSection(doc)).toBeNull();
  });
});

describe('getActiveNavTarget', () => {
  test('returns data-target of active nav button', () => {
    const doc = createTestDOM();
    expect(getActiveNavTarget(doc)).toBe('home');
  });

  test('returns null when no button is active', () => {
    const doc = createTestDOM();
    doc.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    expect(getActiveNavTarget(doc)).toBeNull();
  });
});

describe('getAllSectionIds', () => {
  test('returns all section IDs from nav buttons', () => {
    const doc = createTestDOM();
    const ids = getAllSectionIds(doc);
    expect(ids).toEqual(['home', 'wpn-light', 'wpn-medium', 'wpn-heavy', 'armor-shop']);
  });

  test('returns empty array when no nav buttons exist', () => {
    const dom = new JSDOM('<html><body></body></html>');
    const ids = getAllSectionIds(dom.window.document);
    expect(ids).toEqual([]);
  });
});

describe('switchSection', () => {
  test('switches active section to target', () => {
    const doc = createTestDOM();
    const lightBtn = doc.querySelector('[data-target="wpn-light"]');

    switchSection(doc, lightBtn);

    expect(getActiveSection(doc)).toBe('wpn-light');
    expect(getActiveNavTarget(doc)).toBe('wpn-light');
  });

  test('removes active from previous section', () => {
    const doc = createTestDOM();
    const lightBtn = doc.querySelector('[data-target="wpn-light"]');

    switchSection(doc, lightBtn);

    const homeSection = doc.getElementById('home');
    expect(homeSection.classList.contains('active')).toBe(false);
  });

  test('removes active from previous nav button', () => {
    const doc = createTestDOM();
    const homeBtn = doc.querySelector('[data-target="home"]');
    const lightBtn = doc.querySelector('[data-target="wpn-light"]');

    switchSection(doc, lightBtn);

    expect(homeBtn.classList.contains('active')).toBe(false);
    expect(lightBtn.classList.contains('active')).toBe(true);
  });

  test('returns the target section ID', () => {
    const doc = createTestDOM();
    const heavyBtn = doc.querySelector('[data-target="wpn-heavy"]');

    const result = switchSection(doc, heavyBtn);
    expect(result).toBe('wpn-heavy');
  });

  test('can switch between multiple sections sequentially', () => {
    const doc = createTestDOM();

    const sections = ['wpn-light', 'wpn-medium', 'wpn-heavy', 'armor-shop', 'home'];
    for (const target of sections) {
      const btn = doc.querySelector(`[data-target="${target}"]`);
      switchSection(doc, btn);
      expect(getActiveSection(doc)).toBe(target);
      expect(getActiveNavTarget(doc)).toBe(target);
    }
  });

  test('only one section is active at a time', () => {
    const doc = createTestDOM();
    const mediumBtn = doc.querySelector('[data-target="wpn-medium"]');

    switchSection(doc, mediumBtn);

    const activeSections = doc.querySelectorAll('.content-section.active');
    expect(activeSections.length).toBe(1);
  });

  test('only one nav button is active at a time', () => {
    const doc = createTestDOM();
    const armorBtn = doc.querySelector('[data-target="armor-shop"]');

    switchSection(doc, armorBtn);

    const activeButtons = doc.querySelectorAll('.nav-btn.active');
    expect(activeButtons.length).toBe(1);
  });
});

describe('switchSection edge cases', () => {
  test('handles button with non-existent target gracefully', () => {
    const dom = new JSDOM(`
      <html><body>
        <li class="nav-btn active" data-target="home">Home</li>
        <li class="nav-btn" data-target="nonexistent">Missing</li>
        <div id="home" class="content-section active">Home</div>
      </body></html>
    `);
    const doc = dom.window.document;
    const btn = doc.querySelector('[data-target="nonexistent"]');

    // Should not throw even when target section doesn't exist
    expect(() => switchSection(doc, btn)).not.toThrow();
    expect(getActiveSection(doc)).toBeNull();
  });
});

describe('initNavigation', () => {
  test('attaches click handlers to all nav buttons', () => {
    const doc = createTestDOM();
    initNavigation(doc);

    // Simulate clicking on the light weapons button
    const lightBtn = doc.querySelector('[data-target="wpn-light"]');
    lightBtn.click();

    expect(getActiveSection(doc)).toBe('wpn-light');
    expect(getActiveNavTarget(doc)).toBe('wpn-light');
  });

  test('click on another button switches section', () => {
    const doc = createTestDOM();
    initNavigation(doc);

    const heavyBtn = doc.querySelector('[data-target="wpn-heavy"]');
    heavyBtn.click();

    expect(getActiveSection(doc)).toBe('wpn-heavy');
  });

  test('multiple clicks work correctly', () => {
    const doc = createTestDOM();
    initNavigation(doc);

    const mediumBtn = doc.querySelector('[data-target="wpn-medium"]');
    const armorBtn = doc.querySelector('[data-target="armor-shop"]');

    mediumBtn.click();
    expect(getActiveSection(doc)).toBe('wpn-medium');

    armorBtn.click();
    expect(getActiveSection(doc)).toBe('armor-shop');
  });
});
