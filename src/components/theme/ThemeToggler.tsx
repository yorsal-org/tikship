'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

export function ThemeToggler() {
  const { resolvedTheme, setTheme } = useTheme()

  // Handle theme toggle
  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    const newTheme = checked ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <label className="swap swap-rotate">
      {/* Hidden checkbox that controls the theme */}
      <input
        type="checkbox"
        className="theme-controller"
        checked={isDark}
        onChange={handleThemeChange}
        aria-label="Toggle theme"
      />
      {/* Sun icon - visible when dark theme is active (click to go light) */}
      <Sun className="swap-off h-6 w-6" />
      {/* Moon icon - visible when light theme is active (click to go dark) */}
      <Moon className="swap-on h-6 w-6" />
    </label>
  )
}
