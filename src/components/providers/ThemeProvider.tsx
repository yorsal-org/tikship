'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useThemeSettings } from '@/hooks/useSettings'

interface ThemeContextType {
  theme: string
  setTheme: (theme: string, custom?: boolean) => void
  resolvedTheme: string
  lightTheme: string
  darkTheme: string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: themeSettings } = useThemeSettings()

  const lightTheme = themeSettings.lightTheme
  const darkTheme = themeSettings.darkTheme
  const defaultTheme = themeSettings.default

  // Get system theme preference
  const getSystemTheme = (): string => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Resolve the actual theme to apply
  const resolveTheme = (currentTheme: string): string => {
    if (currentTheme === 'system') {
      return getSystemTheme()
    }
    return currentTheme
  }

  const [isCustom, setIsCustom] = useState<boolean | undefined>(false)

  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return defaultTheme
    const storedTheme = localStorage.getItem('theme') as string | null
    return storedTheme || defaultTheme
  })

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const storedTheme = localStorage.getItem('theme') as string | null
    const initialTheme = storedTheme || defaultTheme
    if (initialTheme === 'system') {
      return getSystemTheme()
    }
    return initialTheme
  })

  // Apply theme to document
  const applyTheme = (actualTheme: string) => {
    if (typeof window === 'undefined') return
    const themeValue = actualTheme === 'dark' ? darkTheme : lightTheme
    document.documentElement.setAttribute('data-theme', isCustom ? actualTheme : themeValue)
  }

  // Apply theme on mount and when theme settings change
  useEffect(() => {
    applyTheme(resolvedTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme, lightTheme, darkTheme])

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolvedTheme = e.matches ? 'dark' : 'light'
      setResolvedTheme(newResolvedTheme)
      applyTheme(newResolvedTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  // Set theme function
  const setTheme = (newTheme: string, custom?: boolean) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)

    const resolved = resolveTheme(newTheme)
    setResolvedTheme(resolved)
    setIsCustom(custom)
    applyTheme(resolved)
  }

  // Always provide context to avoid "useTheme must be used within ThemeProvider" error
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, lightTheme, darkTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
