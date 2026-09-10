import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../../store/appStore.ts';
import { pb } from '../../persistence/pocketbase.ts';
import { db } from '../../persistence/database.ts';
import { Button } from '../../components/Button/Button.tsx';
import { toast } from 'sonner';
import { useOnlineStatus } from '../useOnlineStatus.ts';
import styles from './SyncControls.module.css';

const SyncControls = () => {
  const setAuthFormOpen = useAppStore((state) => state.setAuthFormOpen);
  const authUser = useAppStore((state) => state.authUser);
  const isAuthChecked = useAppStore((state) => state.isAuthChecked);
  const realtimeStatus = useAppStore((state) => state.realtimeStatus);
  const isOnline = useOnlineStatus();
  const pending =
    useLiveQuery(async () => {
      return db.outbox.count();
    }, []) ?? 0;

  if (!isAuthChecked) {
    return <div className={styles.status}>Checking sign-in...</div>;
  }

  if (authUser === null) {
    return (
      <div>
        <span className={styles.status}>Sync off. Changes stay on this device.</span>
        <div className={styles.actions}>
          <Button onClick={() => setAuthFormOpen(true)}>Enable sync</Button>
        </div>
      </div>
    );
  }

  const userName = authUser.username || authUser.email || 'your account';
  const pendingText =
    pending === 0 ? 'Everything is synced.' : `${pending} change(s) waiting to sync. Will send automatically.`;

  if (!isOnline) {
    return (
      <div>
        <div className={styles.user}>Syncing as {userName}</div>
        <span className={styles.status}>
          You&apos;re offline. Changes save on this device and sync when you reconnect.{' '}
          {pending > 0 ? `${pending} change(s) waiting.` : 'Nothing waiting.'}
        </span>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => { pb.authStore.clear(); toast.success('Signed out'); }}>Sign out</Button>
        </div>
      </div>
    );
  }

  if (realtimeStatus === 'connecting') {
    return (
      <div>
        <div className={styles.user}>Syncing as {userName}</div>
        <span className={styles.status}>Connecting live sync... {pendingText}</span>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => { pb.authStore.clear(); toast.success('Signed out'); }}>Sign out</Button>
        </div>
      </div>
    );
  }

  if (realtimeStatus === 'reconnecting') {
    return (
      <div>
        <div className={styles.user}>Syncing as {userName}</div>
        <span className={styles.status}>
          Live connection lost. Reconnecting and re-syncing automatically. Nothing is lost, changes stay on this
          device. {pending > 0 ? `${pending} change(s) waiting.` : ''}
        </span>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => { pb.authStore.clear(); toast.success('Signed out'); }}>Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.user}>Live sync on as {userName}</div>
      <span className={styles.status}>{pendingText}</span>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => { pb.authStore.clear(); toast.success('Signed out'); }}>Sign out</Button>
      </div>
    </div>
  );
};

export { SyncControls };
