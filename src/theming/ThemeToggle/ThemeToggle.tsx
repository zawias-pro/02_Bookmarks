import { useAppStore } from '../../store/appStore.ts'
import { SegmentedRadio } from '../../components/SegmentedRadio/SegmentedRadio.tsx'
import type { ThemeSetting } from '../theme.ts'

const ThemeToggle = () => {
  const themeSetting = useAppStore((state) => state.themeSetting)
  const setThemeSetting = useAppStore((state) => state.setThemeSetting)
  const options: Array<{ value: ThemeSetting; label: string }> = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto' },
  ]

  return <SegmentedRadio name="theme" ariaLabel="Theme" options={options} value={themeSetting} onChange={setThemeSetting} />
}

export { ThemeToggle }
