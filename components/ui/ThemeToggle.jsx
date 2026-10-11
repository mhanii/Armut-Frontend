'use client';
import React from 'react';
import { Icon } from './Icon.jsx';
import { readTheme, applyTheme, systemPrefersDark } from '@/lib/theme.js';

// Both icons are rendered and CSS shows whichever matches the active theme.
// The server cannot know the visitor's choice, so deciding in JavaScript meant
// either a hydration mismatch or a blank gap where the control should be —
// CSS already knows the theme, so let it choose.
export function ThemeToggle({ className = '' }) {
  const onClick = () => {
    const current = readTheme();
    const isDark = current === 'dark' || (current === 'system' && systemPrefersDark());
    applyTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      className={`icon-btn theme-toggle ${className}`.trim()}
      onClick={onClick}
      aria-label="Switch between light and dark theme"
      title="Switch theme"
    >
      <Icon name="moon" size={18} className="theme-toggle__moon" />
      <Icon name="sun" size={18} className="theme-toggle__sun" />
    </button>
  );
}
