import { useAppStore, type RealtimeStatus } from '../../store/appStore.ts';
import { useOnlineStatus } from '../useOnlineStatus.ts';
import styles from './SyncButton.module.css';

const SyncButton = () => {
  const authUser = useAppStore((state) => state.authUser);
  const isAuthChecked = useAppStore((state) => state.isAuthChecked);
  const realtimeStatus = useAppStore((state) => state.realtimeStatus);
  const setSyncModalOpen = useAppStore((state) => state.setSyncModalOpen);
  const isOnline = useOnlineStatus();
  let state: 'off' | 'offline' | RealtimeStatus = realtimeStatus;
  if (!isAuthChecked || authUser === null) state = 'off';
  else if (!isOnline) state = 'offline';
  const labels = {
    off: 'Sync is off',
    offline: 'You are offline. Changes will sync when you reconnect',
    connecting: 'Sync is connecting',
    live: 'Sync is live',
    reconnecting: 'Sync is reconnecting',
  } as const;
  const label = `${labels[state]}. Open sync details`;

  const renderIcon = () => {
    if (state === 'live') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
    );
    if (state === 'connecting') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.64 5.64l2.83 2.83M15.53 15.53l2.83 2.83M18.36 5.64l-2.83 2.83M8.47 15.53l-2.83 2.83" />
    </svg>
    );
    if (state === 'reconnecting') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path d="M12 12v3M12 18h.01" />
    </svg>
    );
    if (state === 'offline') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path d="m4 4 16 16" />
    </svg>
    );
    if (state === 'off') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
    );
    return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
    );
  };

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => setSyncModalOpen(true)}
      aria-label={label}
      title={label}
    >
      {renderIcon()}
    </button>
  );
};

export { SyncButton };
