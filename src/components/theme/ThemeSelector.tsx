'use client'

import { useTheme } from '@/components/providers/ThemeProvider'

import { DAISYUI_THEMES } from '@/config/themes'

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value
    setTheme(newTheme, true)
  }

  return (
    <select
      className="select select-ghost w-full max-w-xs"
      value={theme}
      onChange={handleThemeChange}
      aria-label="Select theme"
    >
      {DAISYUI_THEMES.map(theme => (
        <option key={theme.value} value={theme.value}>
          {theme.label}
        </option>
      ))}
    </select>
  )
}
