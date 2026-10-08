'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SettingsPanel } from '@/views/SettingsPanel';
import { useTheme } from '@/components/layout/ThemeProvider';

function SettingsContent() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams ? searchParams.get('section') : null;
  const initialSection = sectionParam === 'account' ? 'account' : 'appearance';

  const theme = useTheme();

  return (
    <SettingsPanel
      initialSection={initialSection}
      activeWorkspace="BuildCorp Main Suite"
      onProfileUpdated={() => {}}
      preset={theme.preset}
      setPreset={theme.setPreset}
      setThemeMode={theme.setThemeMode}
      fontFamily={theme.fontFamily}
      setFontFamily={theme.setFontFamily}
      setFontWeight={theme.setFontWeight}
      setLetterSpacing={theme.setLetterSpacing}
      setLineHeight={theme.setLineHeight}
      setComponentStyle={theme.setComponentStyle}
      setAnimationSpeed={theme.setAnimationSpeed}
      setSidebarStyle={theme.setSidebarStyle}
      setCardStyle={theme.setCardStyle}
      setButtonStyle={theme.setButtonStyle}
      setIconStyle={theme.setIconStyle}
      density={theme.density}
      setDensity={theme.setDensity}
      setCustomPrimary={theme.setCustomPrimary}
      setCustomBg={theme.setCustomBg}
      setCustomSurface={theme.setCustomSurface}
      setCustomText={theme.setCustomText}
    />
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-xs">Loading preferences...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
