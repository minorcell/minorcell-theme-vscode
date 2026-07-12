'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

assert.equal(manifest.contributes.themes.length, 2);
assert.deepEqual(
  manifest.contributes.themes.map((theme) => theme.uiTheme).sort(),
  ['vs', 'vs-dark']
);

for (const theme of manifest.contributes.themes) {
  const themePath = path.join(root, theme.path);
  assert.ok(fs.existsSync(themePath), `${theme.path} does not exist`);
  const definition = JSON.parse(fs.readFileSync(themePath, 'utf8'));
  assert.ok(definition.colors, `${theme.path} has no workbench colors`);
  assert.ok(definition.tokenColors, `${theme.path} has no token colors`);
}

console.log('Manifest and theme files are valid.');
