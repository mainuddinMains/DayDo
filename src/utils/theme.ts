export const theme = {
  colors: {
    // Backgrounds
    bg: '#0e0e10',
    surface: '#151517',
    surfaceHover: '#1c1c1f',
    surfaceBorder: '#2a2a2e',

    // Gold accent
    accent: '#c9a96e',
    accentHover: '#d9bb84',
    accentMuted: 'rgba(201, 169, 110, 0.15)',
    accentBorder: 'rgba(201, 169, 110, 0.35)',

    // Text
    textPrimary: '#f0ece4',
    textSecondary: '#9b9690',
    textMuted: '#5c5a56',
    textInverse: '#0e0e10',

    // Semantic
    success: '#4caf7d',
    successMuted: 'rgba(76, 175, 125, 0.15)',
    danger: '#e05c5c',
    dangerMuted: 'rgba(224, 92, 92, 0.15)',
    warning: '#e0a94a',
    warningMuted: 'rgba(224, 169, 74, 0.15)',

    // Overlays
    overlay: 'rgba(14, 14, 16, 0.75)',
    shadow: '0 4px 24px rgba(0, 0, 0, 0.55)',
    shadowSm: '0 2px 8px rgba(0, 0, 0, 0.40)',
  },

  fonts: {
    heading: '"DM Serif Display", Georgia, serif',
    sans: '"DM Sans", system-ui, sans-serif',
    mono: 'ui-monospace, "Cascadia Code", Consolas, monospace',
  },

  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    md: '1.125rem',   // 18px
    lg: '1.25rem',    // 20px
    xl: '1.5rem',     // 24px
    '2xl': '1.875rem',// 30px
    '3xl': '2.25rem', // 36px
    '4xl': '3rem',    // 48px
    '5xl': '3.75rem', // 60px
  },

  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeights: {
    tight: '1.2',
    snug: '1.35',
    normal: '1.5',
    relaxed: '1.65',
  },

  letterSpacings: {
    tight: '-0.03em',
    snug: '-0.01em',
    normal: '0em',
    wide: '0.04em',
    wider: '0.08em',
    widest: '0.14em',
  },

  radius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
    32: '128px',
  },

  transitions: {
    fast: '120ms ease',
    base: '200ms ease',
    slow: '350ms ease',
  },

  zIndex: {
    base: 0,
    raised: 10,
    dropdown: 100,
    sticky: 200,
    overlay: 300,
    modal: 400,
    toast: 500,
  },
} as const

export type Theme = typeof theme
