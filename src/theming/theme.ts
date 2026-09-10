type Theme = 'light' | 'dark'

type ThemeSetting = 'light' | 'dark' | 'auto'

const themeStorageKey = '02-bookmarks-theme'

const themeMediaQuery = '(prefers-color-scheme: dark)'

const readThemeSetting = (): ThemeSetting => {
  const stored = localStorage.getItem(themeStorageKey)
  if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored
  return 'auto'
}

const resolveThemeSetting = (setting: ThemeSetting): Theme => {
  if (setting !== 'auto') return setting
  return window.matchMedia(themeMediaQuery).matches ? 'dark' : 'light'
}

const nextThemeSetting = (setting: ThemeSetting): ThemeSetting => {
  if (setting === 'light') return 'dark'
  if (setting === 'dark') return 'auto'
  return 'light'
}

const applyTheme = (theme: Theme): void => {
  document.documentElement.dataset.theme = theme
}

export { readThemeSetting, resolveThemeSetting, nextThemeSetting, applyTheme, themeStorageKey, themeMediaQuery }
export type { Theme, ThemeSetting }
