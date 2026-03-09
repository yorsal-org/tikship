'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useEffect, useState } from 'react'

export function ThemeToggler() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Use setTimeout to avoid setState during render
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  // Handle theme toggle
  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    const newTheme = checked ? 'dark' : 'light'
    setTheme(newTheme)
  }

  if (!mounted) return null

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
