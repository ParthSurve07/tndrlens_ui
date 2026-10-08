'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { THEME_PRESETS, applyThemeToElement } from '@/lib/theme';

interface ThemeContextType {
  preset: string;
  setPreset: (p: string) => void;
  themeMode: string;
  setThemeMode: (m: string) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  fontWeight: string;
  setFontWeight: (w: string) => void;
  letterSpacing: string;
  setLetterSpacing: (s: string) => void;
  lineHeight: string;
  setLineHeight: (h: string) => void;
  componentStyle: string;
  setComponentStyle: (s: string) => void;
  animationSpeed: string;
  setAnimationSpeed: (s: string) => void;
  sidebarStyle: string;
  setSidebarStyle: (s: string) => void;
  cardStyle: string;
  setCardStyle: (s: string) => void;
  buttonStyle: string;
  setButtonStyle: (s: string) => void;
  iconStyle: string;
  setIconStyle: (s: string) => void;
  density: string;
  setDensity: (d: string) => void;
  customPrimary: string;
  setCustomPrimary: (c: string) => void;
  customBg: string;
  setCustomBg: (c: string) => void;
  customSurface: string;
  setCustomSurface: (c: string) => void;
  customText: string;
  setCustomText: (c: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preset, setPreset] = useState<string>('dark-professional');
  const [themeMode, setThemeMode] = useState<string>('dark-professional');
  const [fontFamily, setFontFamily] = useState<string>('Inter');
  const [fontWeight, setFontWeight] = useState<string>('500');
  const [letterSpacing, setLetterSpacing] = useState<string>('normal');
  const [lineHeight, setLineHeight] = useState<string>('normal');
  const [componentStyle, setComponentStyle] = useState<string>('soft');
  const [animationSpeed, setAnimationSpeed] = useState<string>('balanced');
  const [sidebarStyle, setSidebarStyle] = useState<string>('classic');
  const [cardStyle, setCardStyle] = useState<string>('glass');
  const [buttonStyle, setButtonStyle] = useState<string>('soft');
  const [iconStyle, setIconStyle] = useState<string>('outlined');
  const [density, setDensity] = useState<string>('comfortable');
  const [customPrimary, setCustomPrimary] = useState<string>('#3B82F6');
  const [customBg, setCustomBg] = useState<string>('#0F172A');
  const [customSurface, setCustomSurface] = useState<string>('#111827');
  const [customText, setCustomText] = useState<string>('#F8FAFC');

  // Load stored preferences on client mount
  useEffect(() => {
    const storedPreset = localStorage.getItem('ds-preset');
    if (storedPreset && storedPreset in THEME_PRESETS) setPreset(storedPreset);

    const storedMode = localStorage.getItem('ds-mode');
    if (storedMode && storedMode in THEME_PRESETS) setThemeMode(storedMode);

    if (localStorage.getItem('ds-font')) setFontFamily(localStorage.getItem('ds-font')!);
    if (localStorage.getItem('ds-weight')) setFontWeight(localStorage.getItem('ds-weight')!);
    if (localStorage.getItem('ds-spacing')) setLetterSpacing(localStorage.getItem('ds-spacing')!);
    if (localStorage.getItem('ds-lineheight')) setLineHeight(localStorage.getItem('ds-lineheight')!);
    if (localStorage.getItem('ds-comp-style')) setComponentStyle(localStorage.getItem('ds-comp-style')!);
    if (localStorage.getItem('ds-anim-speed')) setAnimationSpeed(localStorage.getItem('ds-anim-speed')!);
    if (localStorage.getItem('ds-sidebar-style')) setSidebarStyle(localStorage.getItem('ds-sidebar-style')!);
    if (localStorage.getItem('ds-card-style')) setCardStyle(localStorage.getItem('ds-card-style')!);
    if (localStorage.getItem('ds-btn-style')) setButtonStyle(localStorage.getItem('ds-btn-style')!);
    if (localStorage.getItem('ds-icon-style')) setIconStyle(localStorage.getItem('ds-icon-style')!);
    if (localStorage.getItem('ds-density')) setDensity(localStorage.getItem('ds-density')!);
    if (localStorage.getItem('ds-c-primary')) setCustomPrimary(localStorage.getItem('ds-c-primary')!);
    if (localStorage.getItem('ds-c-bg')) setCustomBg(localStorage.getItem('ds-c-bg')!);
    if (localStorage.getItem('ds-c-surface')) setCustomSurface(localStorage.getItem('ds-c-surface')!);
    if (localStorage.getItem('ds-c-text')) setCustomText(localStorage.getItem('ds-c-text')!);
  }, []);

  // Update root element styles and localStorage whenever theme properties change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      applyThemeToElement(document.documentElement, {
        preset,
        fontFamily,
        fontWeight,
        letterSpacing,
        lineHeight,
        componentStyle,
        animationSpeed,
        density
      });

      localStorage.setItem('ds-preset', preset);
      localStorage.setItem('ds-mode', themeMode);
      localStorage.setItem('ds-font', fontFamily);
      localStorage.setItem('ds-weight', fontWeight);
      localStorage.setItem('ds-spacing', letterSpacing);
      localStorage.setItem('ds-lineheight', lineHeight);
      localStorage.setItem('ds-comp-style', componentStyle);
      localStorage.setItem('ds-anim-speed', animationSpeed);
      localStorage.setItem('ds-sidebar-style', sidebarStyle);
      localStorage.setItem('ds-card-style', cardStyle);
      localStorage.setItem('ds-btn-style', buttonStyle);
      localStorage.setItem('ds-icon-style', iconStyle);
      localStorage.setItem('ds-density', density);
      localStorage.setItem('ds-c-primary', customPrimary);
      localStorage.setItem('ds-c-bg', customBg);
      localStorage.setItem('ds-c-surface', customSurface);
      localStorage.setItem('ds-c-text', customText);
    }
  }, [
    preset, themeMode, fontFamily, fontWeight, letterSpacing, lineHeight,
    componentStyle, animationSpeed, sidebarStyle, cardStyle, buttonStyle,
    iconStyle, density, customPrimary, customBg, customSurface, customText
  ]);

  return (
    <ThemeContext.Provider value={{
      preset, setPreset,
      themeMode, setThemeMode,
      fontFamily, setFontFamily,
      fontWeight, setFontWeight,
      letterSpacing, setLetterSpacing,
      lineHeight, setLineHeight,
      componentStyle, setComponentStyle,
      animationSpeed, setAnimationSpeed,
      sidebarStyle, setSidebarStyle,
      cardStyle, setCardStyle,
      buttonStyle, setButtonStyle,
      iconStyle, setIconStyle,
      density, setDensity,
      customPrimary, setCustomPrimary,
      customBg, setCustomBg,
      customSurface, setCustomSurface,
      customText, setCustomText,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
