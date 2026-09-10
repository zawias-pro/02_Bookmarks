import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/Button/Button.tsx'
import { appUpdateEvent, appVersion, checkForUpdate, updateApp } from '../../pwa.ts'
import styles from './UpdateNotice.module.css'

const UpdateNotice = () => {
  const [availableVersion, setAvailableVersion] = useState<string | null>(null)
  const [isChecking, setChecking] = useState(true)

  const runUpdateCheck = async () => {
    setChecking(true)
    try {
      const version = await checkForUpdate()
      setAvailableVersion(version)
      if (version === appVersion) toast.success('No updates found.')
      else toast.info(`Update ${version} is available.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not check for updates.')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const version = (event as CustomEvent<{ version?: string }>).detail.version
      if (version) setAvailableVersion(version)
    }
    window.addEventListener(appUpdateEvent, handleUpdate)
    void checkForUpdate().then((version) => {
      setAvailableVersion(version)
      setChecking(false)
    }).catch(() => setChecking(false))
    return () => window.removeEventListener(appUpdateEvent, handleUpdate)
  }, [])

  const isUpdateAvailable = availableVersion !== null && availableVersion !== appVersion

  return (
    <section className={styles.notice} aria-label="App version">
      <dl>
        <div><dt>Installed</dt><dd>{appVersion}</dd></div>
        <div><dt>Available</dt><dd>{isChecking ? 'Checking...' : availableVersion ?? appVersion}</dd></div>
      </dl>
      {isUpdateAvailable ? (
        <Button onClick={updateApp}>Update app</Button>
      ) : (
        <Button onClick={() => void runUpdateCheck()} disabled={isChecking}>
          {isChecking ? 'Checking...' : 'Check for updates'}
        </Button>
      )}
    </section>
  )
}

export { UpdateNotice }
