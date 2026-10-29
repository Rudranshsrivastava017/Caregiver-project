import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext(null);

export const FONT_SCALES = {
  normal: { id: 'normal', label: '100%', scale: 1, title: 'Normal Text (100%)' },
  large: { id: 'large', label: '115%', scale: 1.15, title: 'Large Text (115%)' },
  xlarge: { id: 'xlarge', label: '130%', scale: 1.3, title: 'Extra Large Text (130%)' },
};

export const AccessibilityProvider = ({ children }) => {
  // 1. Font Scale State
  const [fontScale, setFontScaleState] = useState(() => {
    try {
      const saved = localStorage.getItem('careelderly_font_scale');
      return FONT_SCALES[saved] ? saved : 'normal';
    } catch {
      return 'normal';
    }
  });

  // 2. High Contrast State
  const [isHighContrast, setIsHighContrastState] = useState(() => {
    try {
      return localStorage.getItem('careelderly_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  // Apply font scale to documentElement CSS variable
  useEffect(() => {
    const config = FONT_SCALES[fontScale] || FONT_SCALES.normal;
    document.documentElement.style.setProperty('--app-font-scale', String(config.scale));
    try {
      localStorage.setItem('careelderly_font_scale', fontScale);
    } catch (e) {
      console.warn('[Accessibility] Unable to persist font scale:', e);
    }
  }, [fontScale]);

  // Apply high contrast class to document.body
  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    try {
      localStorage.setItem('careelderly_high_contrast', String(isHighContrast));
    } catch (e) {
      console.warn('[Accessibility] Unable to persist high contrast:', e);
    }
  }, [isHighContrast]);

  const setFontScale = (scaleKey) => {
    if (FONT_SCALES[scaleKey]) {
      setFontScaleState(scaleKey);
    }
  };

  const cycleFontScale = () => {
    const keys = ['normal', 'large', 'xlarge'];
    const nextIndex = (keys.indexOf(fontScale) + 1) % keys.length;
    setFontScaleState(keys[nextIndex]);
  };

  const toggleHighContrast = () => {
    setIsHighContrastState((prev) => !prev);
  };

  const resetAccessibility = () => {
    setFontScaleState('normal');
    setIsHighContrastState(false);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontScale,
        setFontScale,
        cycleFontScale,
        fontScaleConfig: FONT_SCALES[fontScale],
        isHighContrast,
        toggleHighContrast,
        resetAccessibility,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
