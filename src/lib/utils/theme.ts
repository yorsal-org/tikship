import { siteConfig } from '@/config/site'

// This script runs before React hydration to prevent theme flash
export const themeInitScript = `
(function() {
  const LIGHT_THEME = '${siteConfig.theme.lightTheme}';
  const DARK_THEME = '${siteConfig.theme.darkTheme}';
  const DEFAULT_THEME = '${siteConfig.theme.default}';
  
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  function resolveTheme(theme) {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme || 'light';
  }
  
  try {
    const storedTheme = localStorage.getItem('theme');
    const initialTheme = storedTheme || DEFAULT_THEME;
    const resolved = resolveTheme(initialTheme);
    const themeValue = resolved === 'dark' ? DARK_THEME : LIGHT_THEME;
    
    document.documentElement.setAttribute('data-theme', themeValue);
  } catch (e) {
    console.error('Failed to initialize theme:', e);
  }
})();
`
