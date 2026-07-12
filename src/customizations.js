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

const OWNED_WORKBENCH_KEYS = Object.values(WORKBENCH_ROLE_MAP).flat();
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
  COLOR_ROLES,
  OWNED_TOKEN_KEYS,
  OWNED_WORKBENCH_KEYS,
  THEME_LABELS,
  buildOverrides,
  mergeSemanticSection,
  mergeThemeSection,
  readExplicitColors
};
