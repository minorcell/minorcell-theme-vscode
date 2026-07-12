'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  OWNED_TOKEN_KEYS,
  OWNED_WORKBENCH_KEYS,
  buildOverrides,
  mergeSemanticSection,
  mergeThemeSection,
  readExplicitColors
} = require('../src/customizations');

test('readExplicitColors returns only explicitly configured global colors', () => {
  const values = {
    'dark.background': { globalValue: '#101010' },
    'dark.accent': { defaultValue: '#61afef' }
  };
  const configuration = { inspect: (key) => values[key] };

  assert.deepEqual(readExplicitColors(configuration, 'dark'), {
    background: '#101010'
  });
});

test('buildOverrides maps one setting to the relevant VS Code colors', () => {
  assert.deepEqual(buildOverrides({ accent: '#ff0000', function: '#00ff00' }), {
    workbench: {
      'activityBarBadge.background': '#ff0000',
      'button.background': '#ff0000',
      focusBorder: '#ff0000',
      'progressBar.background': '#ff0000',
      'textLink.foreground': '#ff0000'
    },
    tokens: { functions: '#00ff00' },
    semantic: { function: '#00ff00', method: '#00ff00' }
  });
});

test('mergeThemeSection replaces owned keys and preserves user customizations', () => {
  const current = {
    '[Minorcell Dark]': {
      'editor.background': '#old',
      'editorCursor.foreground': '#user'
    },
    '[Other Theme]': { 'editor.background': '#other' }
  };

  const result = mergeThemeSection(
    current,
    'Minorcell Dark',
    OWNED_WORKBENCH_KEYS,
    { 'editor.background': '#new' }
  );

  assert.deepEqual(result, {
    '[Minorcell Dark]': {
      'editorCursor.foreground': '#user',
      'editor.background': '#new'
    },
    '[Other Theme]': { 'editor.background': '#other' }
  });
});

test('mergeThemeSection removes an empty extension-owned theme section', () => {
  const result = mergeThemeSection(
    { '[Minorcell Dark]': { comments: '#old' } },
    'Minorcell Dark',
    OWNED_TOKEN_KEYS,
    {}
  );

  assert.equal(result, undefined);
});

test('mergeSemanticSection preserves unrelated semantic rules', () => {
  const current = {
    '[Minorcell Light]': {
      enabled: true,
      rules: { function: '#old', variable: '#user' }
    }
  };

  assert.deepEqual(
    mergeSemanticSection(current, 'Minorcell Light', { function: '#new' }),
    {
      '[Minorcell Light]': {
        enabled: true,
        rules: { variable: '#user', function: '#new' }
      }
    }
  );
});
