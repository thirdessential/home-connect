// Sindoor Theme System
// Token-based light/dark themes with simple ThemeContext for React Native

import React, { createContext, useContext, useMemo } from 'react';
import { ColorSchemeName, useColorScheme, Dimensions } from 'react-native';

export type ColorRoles = {
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    primary: string;
    disablePrimary: string;
    themeTextColor: string;
    lightBackground: string;
    slateColor: string;
    primaryStrong: string;
    primaryWeak: string;
    success: string;
    warning: string;
    error: string;
    focus: string;
    disabled: string;
    skeletonBase: string;
    skeletonHighlight: string;
    gray1: string;
};

export type Typography = {
    h1: { fontSize: number; lineHeight: number; fontWeight: '800' | '700' | '600' };
    h2: { fontSize: number; lineHeight: number; fontWeight: '800' | '700' | '600' };
    h3: { fontSize: number; lineHeight: number; fontWeight: '700' | '600' };
    h4: { fontSize: number; lineHeight: number; fontWeight: '600' | '500' };
    button1: { fontSize: number; lineHeight: number; fontWeight: '600' | '500' };
    body: { fontSize: number; lineHeight: number; fontWeight: '400' | '500', color?: string };
    small: { fontSize: number; lineHeight: number; fontWeight: '400' | '500' };
    text: { fontSize: number; lineHeight: number; fontWeight: '400' | '500' };
    iconText: { fontSize: number; lineHeight: number; fontWeight: '600' | '500' };
    fontFamily?: string; // Add font family support
};

export type Spacing = { xs: number; s: number; m: number; l: number; xl: number; xxl: number };

export type Radii = { s: number; m: number; l: number; pill: number };

export type IconSizes = {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
};

export type Theme = {
    isDark: boolean;
    colors: ColorRoles;
    typography: Typography;
    spacing: Spacing;
    radii: Radii;
    iconSizes: IconSizes;
    elevation: { card1: any; card2: any; modal: any };
};

export const screenSize = {
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
};


//Global function
export function getWidth(size: any) {
    return (size / 375) * screenSize.width;
}
export function getHeight(size: any) {
    return (size / 812) * screenSize.height;
}


const spacing: Spacing = {
    xs: getWidth(4),
    s: getWidth(8),
    m: getWidth(12),
    l: getWidth(16),
    xl: getWidth(24),
    xxl: getWidth(32)
};
const radii: Radii = {
    s: getWidth(8),
    m: getWidth(12),
    l: getWidth(16),
    pill: getWidth(24)
};
const iconSizes: IconSizes = {
    xs: getWidth(16),
    sm: getWidth(20),
    md: getWidth(24),
    lg: getWidth(28),
    xl: getWidth(44),
    xxl: getWidth(32)
};

// Typography matching HTML: font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif
const typography: Typography = {
    h1: { fontSize: getWidth(24), lineHeight: getHeight(30), fontWeight: '700' },
    h2: { fontSize: getWidth(22), lineHeight: getHeight(28), fontWeight: '800' },
    h3: { fontSize: getWidth(18), lineHeight: getHeight(24), fontWeight: '700' },
    h4: { fontSize: getWidth(16), lineHeight: getHeight(20), fontWeight: '600' },
    body: { fontSize: getWidth(16), lineHeight: getHeight(22), fontWeight: '400', color: '#1F2937' }, // color: var(--text)
    button1: { fontSize: getWidth(14), lineHeight: getHeight(20), fontWeight: '600' },
    text: { fontSize: getWidth(14), lineHeight: getHeight(20), fontWeight: '400' },
    small: { fontSize: getWidth(12), lineHeight: getHeight(18), fontWeight: '400' },
    iconText: { fontSize: getWidth(12), lineHeight: getHeight(16), fontWeight: '600' },
    fontFamily: 'System', // React Native will use system font (San Francisco on iOS, Roboto on Android)
};

const lightColors: ColorRoles = {
    background: '#FCFBF8', // var(--bg) from HTML
    surface: '#FFFFFF', // var(--card) from HTML
    surfaceAlt: '#F1F5F9', // Slate 100 - from web app
    border: '#E2E8F0', // Slate 200 - from web app
    textPrimary: '#1F2937', // var(--text) from HTML - exact match
    textSecondary: '#6B7280', // var(--muted) from HTML - exact match
    primary: '#EA580C', // var(--accent) from HTML - exact match
    disablePrimary: '#FDBA74',
    themeTextColor: '#F97316',
    lightBackground: '#FFF7ED',
    slateColor: '#f3f4f6',
    primaryStrong: '#1E40AF', // Blue 800 - from web app
    primaryWeak: '#EFF6FF', // Blue 50 - from web app
    success: '#10B981', // Green 500 - from web app
    warning: '#F59E0B', // Yellow 500 - from web app
    error: '#EF4444', // Red 500 - from web app
    focus: '#2DD4BF', // Teal 400 - from web app
    disabled: '#CBD5E1', // Slate 300
    skeletonBase: '#E2E8F0',
    skeletonHighlight: '#F8FAFC',
    gray1: '#F9FAFB',
};

const darkColors: ColorRoles = {
    background: '#0F172A', // Slate 900
    surface: '#1E293B', // Slate 800
    surfaceAlt: '#334155', // Slate 700
    border: '#475569', // Slate 600
    textPrimary: '#F8FAFC', // Slate 50 (corrected from #374151 which is Slate 700 and was making text invisible on dark bg)
    textSecondary: '#CBD5E1', // Slate 300
    primary: '#818CF8', // Indigo 400/500 for dark
    disablePrimary: '#a5b4fc',
    themeTextColor: '#C7D2FE',
    lightBackground: '#1E293B',
    slateColor: '#1e293b',
    primaryStrong: '#6366F1',
    primaryWeak: '#111827',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#FB7185',
    focus: '#22D3EE',
    disabled: '#334155',
    skeletonBase: '#334155',
    skeletonHighlight: '#1E293B',
    gray1: '#1F2937',
};

const elevation = (isDark: boolean) => ({
    card1: isDark ? { elevation: 1 } : { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: getWidth(4), shadowOffset: { width: 0, height: getHeight(2) } },
    card2: isDark ? { elevation: 2 } : { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: getWidth(8), shadowOffset: { width: 0, height: getHeight(4) } },
    modal: isDark ? { elevation: 8 } : { shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: getWidth(16), shadowOffset: { width: 0, height: getHeight(8) } },
});

export const buildTheme = (scheme: ColorSchemeName): Theme => {
    const isDark = scheme === 'dark';
    const colors = isDark ? darkColors : lightColors;
    return { isDark, colors, typography, spacing, radii, iconSizes, elevation: elevation(isDark) };
};

const ThemeContext = createContext<Theme | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode; forceScheme?: ColorSchemeName }> = ({ children, forceScheme }) => {
    const scheme = useColorScheme();
    const theme = useMemo(() => buildTheme(forceScheme ?? scheme ?? 'light'), [forceScheme, scheme]);
    return React.createElement(ThemeContext.Provider, { value: theme }, children);
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
};

export const navFromTheme = (t: Theme) => ({
    dark: t.isDark,
    colors: {
        primary: t.colors.primary,
        background: t.colors.background,
        card: t.colors.surface,
        text: t.colors.textPrimary,
        border: t.colors.border,
        notification: t.colors.primaryStrong,
    },
    // Provide fonts expected by React Navigation v7
    fonts: {
        regular: { fontFamily: 'System', fontWeight: '400' as const },
        medium: { fontFamily: 'System', fontWeight: '500' as const },
        bold: { fontFamily: 'System', fontWeight: '700' as const },
        heavy: { fontFamily: 'System', fontWeight: '800' as const },
    },
});

export const palette = {
    blue: { bg: "#EFF6FF", border: "#3B82F6", title: "#1E40AF", sub: "#1F2937", icon: "#3B82F6" },
    yellow: { bg: "#FEF9C3", border: "#F59E0B", title: "#92400E", sub: "#374151", icon: "#F59E0B" },
    green: { bg: "#DCFCE7", border: "#10B981", title: "#065F46", sub: "#374151", icon: "#10B981" },
};