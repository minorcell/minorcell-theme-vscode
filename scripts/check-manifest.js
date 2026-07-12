'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const icon = fs.readFileSync(path.join(root, manifest.icon));

assert.equal(icon.subarray(1, 4).toString('ascii'), 'PNG');
assert.ok(icon.readUInt32BE(16) >= 128, 'icon width must be at least 128px');
assert.ok(icon.readUInt32BE(20) >= 128, 'icon height must be at least 128px');

assert.equal(manifest.contributes.themes.length, 2);
assert.deepEqual(
  manifest.contributes.themes.map((theme) => theme.uiTheme).sort(),
  ['vs', 'vs-dark']
);
assert.equal(
  manifest.contributes.configuration.properties[
    'minorcellTheme.appearance.borders'
  ].default,
  true
);
assert.equal(
  manifest.contributes.configuration.properties[
    'minorcellTheme.appearance.shadows'
  ].default,
  true
);

for (const theme of manifest.contributes.themes) {
  const themePath = path.join(root, theme.path);
  assert.ok(fs.existsSync(themePath), `${theme.path} does not exist`);
  const definition = JSON.parse(fs.readFileSync(themePath, 'utf8'));
  assert.ok(definition.colors, `${theme.path} has no workbench colors`);
  assert.ok(definition.tokenColors, `${theme.path} has no token colors`);
}

console.log('Manifest and theme files are valid.');
