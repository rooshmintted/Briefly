/**
 * Theme Management Hook
 * Handles light/dark/auto theme switching based on system preferences and user settings
 */

import { useEffect } from 'react'

/**
 * Custom hook to manage application theme
 * @param theme - Theme preference: 'light', 'dark', or 'auto'
 */
export function useTheme(theme: 'light' | 'dark' | 'auto') {
  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    body.classList.remove('light', 'dark')

    if (theme === 'auto') {
      // Use system preference
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      const themeClass = isDarkMode ? 'dark' : 'light'
      
      root.classList.add(themeClass)
      body.classList.add(themeClass)

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleThemeChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark')
        body.classList.remove('light', 'dark')
        
        const newThemeClass = e.matches ? 'dark' : 'light'
        root.classList.add(newThemeClass)
        body.classList.add(newThemeClass)
      }

      mediaQuery.addEventListener('change', handleThemeChange)
      return () => mediaQuery.removeEventListener('change', handleThemeChange)
    } else {
      // Use explicit theme
      root.classList.add(theme)
      body.classList.add(theme)
    }
  }, [theme])
} 