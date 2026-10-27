// Mirrors src/styles/tokens.css for places CSS variables cannot reach (viewport themeColor, OG images, emails).
export const OMDALA_COLORS = {
  space950: '#040816',
  space900: '#08101f',
  space850: '#0b1326',
  space800: '#101c33',
  blue700: '#153a72',
  blue600: '#1d5bbf',
  blue500: '#3d8bff',
  blue400: '#6bb2ff',
  cyan500: '#3de7ff',
  cyan400: '#7ef2ff',
  white100: '#f7fbff',
  white200: '#dde8f5',
  white300: '#bfcde1',
  glow: '#63f5ff',
  accent: '#6f8cff',
  success: '#3ee6a8',
  warning: '#ffb020',
  danger: '#ff6b6b',
} as const

export const OMDALA_THEME_COLOR = OMDALA_COLORS.space950

export const OMDALA_VIEWPORT = {
  themeColor: OMDALA_THEME_COLOR,
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
} as const
