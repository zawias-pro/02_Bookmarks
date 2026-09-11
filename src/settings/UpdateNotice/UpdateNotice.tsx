import { useEffect, useState } from 'react'
import { Button } from '../../components/Button/Button.tsx'
import { appUpdateEvent, appVersion, checkForUpdate, updateApp } from '../../pwa.ts'
import styles from './UpdateNotice.module.css'

const UpdateNotice = () => {
  const [availableVersion, setAvailableVersion] = useState<string | null>(null)

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const version = (event as CustomEvent<{ version?: string }>).detail.version
      if (version) setAvailableVersion(version)
    }
    window.addEventListener(appUpdateEvent, handleUpdate)
    void checkForUpdate().then((version) => {
      setAvailableVersion(version)
    }).catch(() => undefined)
    return () => window.removeEventListener(appUpdateEvent, handleUpdate)
  }, [])

  return (
    <section className={styles.notice} aria-label="App version">
      <dl>
        <div><dt>Installed</dt><dd>{appVersion}</dd></div>
        <div><dt>Available</dt><dd>{availableVersion ?? appVersion}</dd></div>
      </dl>
      <Button onClick={() => void updateApp()}>Update app</Button>
    </section>
  )
}

export { UpdateNotice }
