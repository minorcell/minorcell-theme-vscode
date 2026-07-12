'use strict';

const THEME_LABELS = {
  dark: 'Minorcell Dark',
  light: 'Minorcell Light'
};

const COLOR_ROLES = [
  'background',
  'surface',
  'foreground',
  'muted',
  'accent',
  'comment',
  'keyword',
  'string',
  'number',
  'function',
  'type'
];

const BORDER_COLOR_KEYS = [
  'activityBar.border',
  'checkbox.border',
  'debugExceptionWidget.border',
  'debugToolBar.border',
  'diffEditor.border',
  'dropdown.border',
  'editor.findMatchBorder',
  'editor.findMatchHighlightBorder',
  'editor.findRangeHighlightBorder',
  'editor.lineHighlightBorder',
  'editor.rangeHighlightBorder',
  'editor.selectionHighlightBorder',
  'editorBracketMatch.border',
  'editorError.border',
  'editorGroup.border',
  'editorHoverWidget.border',
  'editorInfo.border',
  'editorOverviewRuler.border',
  'editorSuggestWidget.border',
  'editorWarning.border',
  'editorWidget.border',
  'editorWidget.resizeBorder',
  'focusBorder',
  'input.border',
  'inputOption.activeBorder',
  'listFilterWidget.noMatchesOutline',
  'menu.border',
  'menu.selectionBorder',
  'notificationCenter.border',
  'notificationToast.border',
  'notifications.border',
  'panel.border',
  'panelSection.border',
  'panelTitle.activeBorder',
  'peekView.border',
  'peekViewEditor.matchHighlightBorder',
  'pickerGroup.border',
  'sideBar.border',
  'sideBarSectionHeader.border',
  'statusBar.border',
  'tab.activeBorder',
  'tab.activeBorderTop',
  'tab.border',
  'tab.hoverBorder',
  'terminal.border',
  'titleBar.border'
];

const SHADOW_COLOR_KEYS = ['scrollbar.shadow', 'widget.shadow'];

const WORKBENCH_ROLE_MAP = {
  background: [
    'editor.background',
    'editorGroup.emptyBackground',
    'editorGutter.background',
    'minimap.background',
    'panel.background',
    'terminal.background'
  ],
  surface: [
    'activityBar.background',
    'editorHoverWidget.background',
    'editorWidget.background',
    'input.background',
    'sideBar.background',
    'titleBar.activeBackground',
    'titleBar.inactiveBackground'
  ],
  foreground: [
    'editor.foreground',
    'foreground',
    'terminal.foreground'
  ],
  muted: [
    'descriptionForeground',
    'disabledForeground',
    'sideBarSectionHeader.foreground'
  ],
  accent: [
    'activityBarBadge.background',
    'button.background',
    'focusBorder',
    'progressBar.background',
    'textLink.foreground'
  ]
};

const TOKEN_ROLE_MAP = {
  comment: 'comments',
  keyword: 'keywords',
  string: 'strings',
  number: 'numbers',
  function: 'functions',
  type: 'types'
};

const SEMANTIC_ROLE_MAP = {
  comment: ['comment'],
  keyword: ['keyword'],
  string: ['string'],
  number: ['number'],
  function: ['function', 'method'],
  type: ['class', 'enum', 'interface', 'struct', 'type']
};

const OWNED_WORKBENCH_KEYS = [
  ...Object.values(WORKBENCH_ROLE_MAP).flat(),
  ...BORDER_COLOR_KEYS,
  ...SHADOW_COLOR_KEYS
];
const OWNED_TOKEN_KEYS = Object.values(TOKEN_ROLE_MAP);
const OWNED_SEMANTIC_KEYS = Object.values(SEMANTIC_ROLE_MAP).flat();

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readExplicitColors(configuration, variant) {
  return Object.fromEntries(
    COLOR_ROLES.flatMap((role) => {
      const value = configuration.inspect(`${variant}.${role}`)?.globalValue;
      return typeof value === 'string' ? [[role, value]] : [];
    })
  );
}

function buildOverrides(colors) {
  const workbench = {};
  const tokens = {};
  const semantic = {};

  for (const [role, color] of Object.entries(colors)) {
    for (const key of WORKBENCH_ROLE_MAP[role] ?? []) {
      workbench[key] = color;
    }

    const tokenKey = TOKEN_ROLE_MAP[role];
    if (tokenKey) {
      tokens[tokenKey] = color;
    }

    for (const semanticKey of SEMANTIC_ROLE_MAP[role] ?? []) {
      semantic[semanticKey] = color;
    }
  }

  return { workbench, tokens, semantic };
}

function buildAppearanceOverrides({ borders, shadows }) {
  const workbench = {};

  if (!borders) {
    for (const key of BORDER_COLOR_KEYS) {
      workbench[key] = '#00000000';
    }
  }

  if (!shadows) {
    for (const key of SHADOW_COLOR_KEYS) {
      workbench[key] = '#00000000';
    }
  }

  return workbench;
}

function mergeThemeSection(current, themeLabel, ownedKeys, nextValues) {
  const root = isObject(current) ? { ...current } : {};
  const selector = `[${themeLabel}]`;
  const theme = isObject(root[selector]) ? { ...root[selector] } : {};

  for (const key of ownedKeys) {
    delete theme[key];
  }
  Object.assign(theme, nextValues);

  if (Object.keys(theme).length === 0) {
    delete root[selector];
  } else {
    root[selector] = theme;
  }

  return Object.keys(root).length === 0 ? undefined : root;
}

function mergeSemanticSection(current, themeLabel, nextRules) {
  const root = isObject(current) ? { ...current } : {};
  const selector = `[${themeLabel}]`;
  const theme = isObject(root[selector]) ? { ...root[selector] } : {};
  const rules = isObject(theme.rules) ? { ...theme.rules } : {};

  for (const key of OWNED_SEMANTIC_KEYS) {
    delete rules[key];
  }
  Object.assign(rules, nextRules);

  if (Object.keys(rules).length === 0) {
    delete theme.rules;
  } else {
    theme.rules = rules;
  }

  if (Object.keys(theme).length === 0) {
    delete root[selector];
  } else {
    root[selector] = theme;
  }

  return Object.keys(root).length === 0 ? undefined : root;
}

module.exports = {
  BORDER_COLOR_KEYS,
  COLOR_ROLES,
  OWNED_TOKEN_KEYS,
  OWNED_WORKBENCH_KEYS,
  SHADOW_COLOR_KEYS,
  THEME_LABELS,
  buildAppearanceOverrides,
  buildOverrides,
  mergeSemanticSection,
  mergeThemeSection,
  readExplicitColors
};
