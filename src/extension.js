'use strict';

const vscode = require('vscode');
const {
  COLOR_ROLES,
  OWNED_TOKEN_KEYS,
  OWNED_WORKBENCH_KEYS,
  THEME_LABELS,
  buildAppearanceOverrides,
  buildOverrides,
  mergeSemanticSection,
  mergeThemeSection,
  readExplicitColors
} = require('./customizations');

const CONFIGURED_KEY = 'minorcellTheme.systemSyncConfigured';

async function configureSystemSync(enabled) {
  const target = vscode.ConfigurationTarget.Global;
  const workbench = vscode.workspace.getConfiguration('workbench');
  const window = vscode.workspace.getConfiguration('window');

  if (enabled) {
    await workbench.update('preferredDarkColorTheme', THEME_LABELS.dark, target);
    await workbench.update('preferredLightColorTheme', THEME_LABELS.light, target);
  }
  await window.update('autoDetectColorScheme', enabled, target);
}

async function updateCustomizationSetting(section, value) {
  await vscode.workspace
    .getConfiguration()
    .update(section, value, vscode.ConfigurationTarget.Global);
}

async function synchronizeColors() {
  const themeConfiguration = vscode.workspace.getConfiguration('minorcellTheme');
  const rootConfiguration = vscode.workspace.getConfiguration();

  let workbench = rootConfiguration.inspect(
    'workbench.colorCustomizations'
  )?.globalValue;
  let tokens = rootConfiguration.inspect(
    'editor.tokenColorCustomizations'
  )?.globalValue;
  let semantic = rootConfiguration.inspect(
    'editor.semanticTokenColorCustomizations'
  )?.globalValue;
  const appearanceOverrides = buildAppearanceOverrides({
    borders: themeConfiguration.get('appearance.borders', true),
    shadows: themeConfiguration.get('appearance.shadows', true)
  });

  for (const variant of Object.keys(THEME_LABELS)) {
    const overrides = buildOverrides(readExplicitColors(themeConfiguration, variant));
    Object.assign(overrides.workbench, appearanceOverrides);
    const label = THEME_LABELS[variant];

    workbench = mergeThemeSection(
      workbench,
      label,
      OWNED_WORKBENCH_KEYS,
      overrides.workbench
    );
    tokens = mergeThemeSection(tokens, label, OWNED_TOKEN_KEYS, overrides.tokens);
    semantic = mergeSemanticSection(semantic, label, overrides.semantic);
  }

  await updateCustomizationSetting('workbench.colorCustomizations', workbench);
  await updateCustomizationSetting('editor.tokenColorCustomizations', tokens);
  await updateCustomizationSetting(
    'editor.semanticTokenColorCustomizations',
    semantic
  );
}

async function resetColors() {
  const configuration = vscode.workspace.getConfiguration('minorcellTheme');
  const updates = [];

  for (const variant of Object.keys(THEME_LABELS)) {
    for (const role of COLOR_ROLES) {
      updates.push(
        configuration.update(
          `${variant}.${role}`,
          undefined,
          vscode.ConfigurationTarget.Global
        )
      );
    }
  }

  await Promise.all(updates);
  await synchronizeColors();
  await vscode.window.showInformationMessage('Minorcell theme colors were reset.');
}

function reportError(error) {
  const message = error instanceof Error ? error.message : String(error);
  void vscode.window.showErrorMessage(`Minorcell Theme: ${message}`);
}

async function activate(context) {
  let syncQueue = Promise.resolve();
  const queueColorSync = () => {
    syncQueue = syncQueue.then(synchronizeColors, synchronizeColors);
    syncQueue.catch(reportError);
    return syncQueue;
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('minorcellTheme.openSettings', () =>
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        '@ext:minorcell.minorcell-theme'
      )
    ),
    vscode.commands.registerCommand(
      'minorcellTheme.configureSystemSync',
      async () => {
        await vscode.workspace
          .getConfiguration('minorcellTheme')
          .update('followSystem', true, vscode.ConfigurationTarget.Global);
        await configureSystemSync(true);
        await context.globalState.update(CONFIGURED_KEY, true);
      }
    ),
    vscode.commands.registerCommand('minorcellTheme.resetColors', resetColors),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('minorcellTheme.followSystem')) {
        const enabled = vscode.workspace
          .getConfiguration('minorcellTheme')
          .get('followSystem', true);
        configureSystemSync(enabled).catch(reportError);
      }

      if (
        event.affectsConfiguration('minorcellTheme.appearance') ||
        event.affectsConfiguration('minorcellTheme.dark') ||
        event.affectsConfiguration('minorcellTheme.light')
      ) {
        queueColorSync();
      }
    })
  );

  await queueColorSync();

  const configuration = vscode.workspace.getConfiguration('minorcellTheme');
  if (
    configuration.get('followSystem', true) &&
    !context.globalState.get(CONFIGURED_KEY, false)
  ) {
    await configureSystemSync(true);
    await context.globalState.update(CONFIGURED_KEY, true);
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
