export interface PresetColors {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  hover: string;
  success: string;
  warning: string;
  danger: string;
}

export const THEME_PRESETS: Record<string, PresetColors> = {
  "dark-professional": {
    primary: "#4F46E5", secondary: "#334155", accent: "#818CF8",
    bg: "#0B1120", surface: "#111827", card: "#1E293B", border: "#334155",
    text: "#F8FAFC", muted: "#94A3B8", hover: "#6366F1",
    success: "#10B981", warning: "#F59E0B", danger: "#EF4444"
  },
  "light-professional": {
    primary: "#2563EB", secondary: "#E2E8F0", accent: "#2563EB",
    bg: "#F8FAFC", surface: "#FFFFFF", card: "#F1F5F9", border: "#CBD5E1",
    text: "#0F172A", muted: "#475569", hover: "#1D4ED8",
    success: "#047857", warning: "#B45309", danger: "#B91C1C"
  },
  "graphite-gray": {
    primary: "#A1A1AA", secondary: "#3F3F46", accent: "#A1A1AA",
    bg: "#18181B", surface: "#202023", card: "#27272A", border: "#3F3F46",
    text: "#FAFAFA", muted: "#A1A1AA", hover: "#D4D4D8",
    success: "#34D399", warning: "#FBBF24", danger: "#F87171"
  }
};

export const generateShades = (hexColor: string) => {
  const c = hexColor.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;

  const blend = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, ratio: number) => {
    const nr = Math.round(r1 + (r2 - r1) * ratio);
    const ng = Math.round(g1 + (g2 - g1) * ratio);
    const nb = Math.round(b1 + (b2 - b1) * ratio);
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  };

  return {
    100: blend(r, g, b, 255, 255, 255, 0.8),
    200: blend(r, g, b, 255, 255, 255, 0.6),
    300: blend(r, g, b, 255, 255, 255, 0.4),
    400: blend(r, g, b, 255, 255, 255, 0.2),
    500: hexColor,
    600: blend(r, g, b, 0, 0, 0, 0.2),
    700: blend(r, g, b, 0, 0, 0, 0.4),
    800: blend(r, g, b, 0, 0, 0, 0.6),
    900: blend(r, g, b, 0, 0, 0, 0.8)
  };
};

export function applyThemeToElement(root: HTMLElement, settings: {
  preset: string;
  fontFamily: string;
  fontWeight: string;
  letterSpacing: string;
  lineHeight: string;
  componentStyle: string;
  animationSpeed: string;
  density: string;
}) {
  const activePreset = THEME_PRESETS[settings.preset] || THEME_PRESETS['dark-professional'];

  root.style.setProperty('--bg-color', activePreset.bg);
  root.style.setProperty('--surface-color', activePreset.surface);
  root.style.setProperty('--card-color', activePreset.card);
  root.style.setProperty('--border-color', activePreset.border);
  root.style.setProperty('--text-color', activePreset.text);
  root.style.setProperty('--text-secondary', activePreset.muted);
  root.style.setProperty('--accent-color', activePreset.accent);
  root.style.setProperty('--success-color', activePreset.success);
  root.style.setProperty('--warning-color', activePreset.warning);
  root.style.setProperty('--danger-color', activePreset.danger);

  const shades = generateShades(activePreset.accent);
  Object.entries(shades).forEach(([sh, hex]) => {
    root.style.setProperty(`--accent-${sh}`, hex);
  });

  const selectedFont = settings.fontFamily === 'SF Pro'
    ? '-apple-system, BlinkMacSystemFont'
    : settings.fontFamily === 'System UI'
      ? 'system-ui'
      : settings.fontFamily;
  root.style.setProperty('--font-family', selectedFont);
  root.style.setProperty('--font-weight', settings.fontWeight);
  
  const letterSp = settings.letterSpacing === 'tight' ? '-0.02em' : settings.letterSpacing === 'wide' ? '0.04em' : 'normal';
  root.style.setProperty('--letter-spacing', letterSp);

  const lineHt = settings.lineHeight === 'relaxed' ? '1.6' : settings.lineHeight === 'snug' ? '1.3' : '1.5';
  root.style.setProperty('--line-height', lineHt);

  let rad = '12px';
  if (settings.componentStyle === 'square') rad = '0px';
  else if (settings.componentStyle === 'minimal') rad = '6px';
  else if (settings.componentStyle === 'corporate') rad = '8px';
  else if (settings.componentStyle === 'modern') rad = '16px';
  root.style.setProperty('--border-radius', rad);

  let spd = '250ms';
  if (settings.animationSpeed === 'none') spd = '0ms';
  else if (settings.animationSpeed === 'fast') spd = '120ms';
  else if (settings.animationSpeed === 'smooth') spd = '400ms';
  else if (settings.animationSpeed === 'luxury') spd = '650ms';
  root.style.setProperty('--transition-speed', spd);

  let pad = '20px';
  if (settings.density === 'compact') pad = '12px';
  else if (settings.density === 'ultra-compact') pad = '8px';
  else if (settings.density === 'large') pad = '28px';
  root.style.setProperty('--density-padding', pad);
}
