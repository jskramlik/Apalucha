export interface ColorTokens {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryText: string;
  secondary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  error: string;
  overlay: string;
  tabBarBackground: string;
  tabBarInactive: string;
}

export const darkColors: ColorTokens = {
  background: '#0F1210',
  surface: '#1A1F1D',
  surfaceElevated: '#232928',
  primary: '#FF6B4A',
  primaryText: '#FFFFFF',
  secondary: '#2DD4BF',
  textPrimary: '#F5F5F4',
  textSecondary: '#B8BDBA',
  textMuted: '#767C79',
  border: '#2A302E',
  success: '#4ADE80',
  error: '#F87171',
  overlay: 'rgba(0,0,0,0.6)',
  tabBarBackground: 'rgba(26,31,29,0.85)',
  tabBarInactive: '#767C79',
};

export const lightColors: ColorTokens = {
  background: '#FAFAF9',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  primary: '#E85D3D',
  primaryText: '#FFFFFF',
  secondary: '#0D9488',
  textPrimary: '#1A1A1A',
  textSecondary: '#5A5F5C',
  textMuted: '#9A9F9C',
  border: '#E8E6E3',
  success: '#16A34A',
  error: '#DC2626',
  overlay: 'rgba(0,0,0,0.4)',
  tabBarBackground: 'rgba(255,255,255,0.85)',
  tabBarInactive: '#9A9F9C',
};
