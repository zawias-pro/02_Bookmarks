import type { ReactNode } from 'react'
import { useAppStore } from '../../store/appStore.ts'
import type { ThemeSetting } from '../theme.ts'
import styles from './ThemeToggle.module.css'

const themeLabels: Record<ThemeSetting, string> = {
  light: 'Switch to dark mode',
  dark: 'Switch to automatic theme',
  auto: 'Switch to light mode',
}

const themeIcons: Record<ThemeSetting, ReactNode> = {
  light: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  auto: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
    </svg>
  ),
}

const ThemeToggle = () => {
  const themeSetting = useAppStore((state) => state.themeSetting)
  const cycleThemeSetting = useAppStore((state) => state.cycleThemeSetting)
  const themeLabel = themeLabels[themeSetting]

  return (
    <button type="button" className={styles.toggle} onClick={cycleThemeSetting} aria-label={themeLabel} title={themeLabel}>
      {themeIcons[themeSetting]}
    </button>
  )
}

export { ThemeToggle }
