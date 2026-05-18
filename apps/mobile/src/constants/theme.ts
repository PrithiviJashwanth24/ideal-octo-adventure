export const Colors = {
  // Core palette — dark luxury
  background: {
    primary: '#0A0A0B',
    secondary: '#111113',
    tertiary: '#18181C',
    elevated: '#1E1E23',
    glass: 'rgba(255,255,255,0.04)',
  },

  // Text
  text: {
    primary: '#F5F5F7',
    secondary: '#A1A1AA',
    tertiary: '#52525B',
    inverse: '#09090B',
    accent: '#D4AF37',
  },

  // Brand gold — luxury signature
  gold: {
    primary: '#D4AF37',
    light: '#F0D060',
    dark: '#A08020',
    muted: 'rgba(212,175,55,0.15)',
  },

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Borders
  border: {
    subtle: 'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.10)',
    strong: 'rgba(255,255,255,0.20)',
  },

  // Gradients (as arrays for LinearGradient)
  gradients: {
    gold: ['#D4AF37', '#A08020'] as const,
    dark: ['#18181C', '#0A0A0B'] as const,
    glass: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'] as const,
    luxe: ['#1a0a00', '#2d1810'] as const,
    hero: ['rgba(10,10,11,0)', '#0A0A0B'] as const,
  },
} as const;

export const Typography = {
  // Display
  display1: { fontSize: 48, fontWeight: '700', letterSpacing: -2, lineHeight: 52 },
  display2: { fontSize: 36, fontWeight: '700', letterSpacing: -1.5, lineHeight: 40 },
  display3: { fontSize: 28, fontWeight: '700', letterSpacing: -1, lineHeight: 34 },

  // Headings
  h1: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, lineHeight: 30 },
  h2: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2, lineHeight: 22 },
  h4: { fontSize: 15, fontWeight: '600', letterSpacing: 0, lineHeight: 20 },

  // Body
  body1: { fontSize: 16, fontWeight: '400', letterSpacing: 0, lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400', letterSpacing: 0, lineHeight: 20 },
  body3: { fontSize: 12, fontWeight: '400', letterSpacing: 0, lineHeight: 16 },

  // Special
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, lineHeight: 14 },
  mono: { fontSize: 13, fontWeight: '400', letterSpacing: 0, fontFamily: 'Courier' },
  luxe: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, lineHeight: 14 },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
