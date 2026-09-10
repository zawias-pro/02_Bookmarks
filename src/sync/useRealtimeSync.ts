import { useEffect } from 'react';
import type { UnsubscribeFunc } from 'pocketbase';
import { toast } from 'sonner';
import { pb } from '../persistence/pocketbase.ts';
import { useAppStore } from '../store/appStore.ts';
import { syncNow } from './sync.ts';

const useRealtimeSync = () => {
  const authUserId = useAppStore((state) => state.authUser?.id);
  const isAuthChecked = useAppStore((state) => state.isAuthChecked);
  const setRealtimeStatus = useAppStore((state) => state.setRealtimeStatus);

  useEffect(() => {
    if (!isAuthChecked || !authUserId) return;
    let cancelled = false;
    let unsubscribeBookmarks: UnsubscribeFunc | undefined;
    let unsubscribeCategories: UnsubscribeFunc | undefined;
    let unsubscribeConnect: UnsubscribeFunc | undefined;
    let retryTimer: number | undefined;
    let retryAttempt = 0;
    let retryNoticeShown = false;
    const scheduleRetry = () => {
      if (cancelled || retryTimer !== undefined) return;
      const delay = Math.min(30_000, 1_000 * 2 ** retryAttempt);
      retryAttempt += 1;
      retryTimer = window.setTimeout(() => {
        retryTimer = undefined;
        void run();
      }, delay);
      setRealtimeStatus('reconnecting');
    };
    const run = async (showError = true) => {
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
        retryTimer = undefined;
      }
      try {
        await syncNow();
        retryAttempt = 0;
        retryNoticeShown = false;
        return true;
      } catch {
        if (cancelled) return;
        if (showError && !retryNoticeShown) {
          retryNoticeShown = true;
          toast.warning('Sync is temporarily unavailable. Retrying automatically; local changes are safe.');
        }
        scheduleRetry();
        return false;
      }
    };
    const handleOnline = () => run();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void run();
    };
    const handleNotice = (event: Event) => {
      const notice = (event as CustomEvent<{ kind: 'info' | 'conflict'; message: string }>).detail;
      if (notice.kind === 'conflict') toast.warning(notice.message);
      else toast.info(notice.message);
    };
    const start = async () => {
      setRealtimeStatus('connecting');
      void run();
      try {
        const filter = { filter: `user = "${authUserId}"` };
         unsubscribeBookmarks = await pb.collection('bookmarks').subscribe('*', () => { void run(false); }, filter);
         unsubscribeCategories = await pb.collection('categories').subscribe('*', () => { void run(false); }, filter);
          unsubscribeConnect = await pb.realtime.subscribe('PB_CONNECT', () => {
            void run(false).then((synced) => {
              if (synced && !cancelled) setRealtimeStatus('live');
            });
          });
        if (!cancelled) setRealtimeStatus('live');
      } catch (error) {
        if (!cancelled) { setRealtimeStatus('reconnecting'); toast.error(error instanceof Error ? error.message : 'Live sync connection failed.'); }
      }
    };
    pb.realtime.onDisconnect = () => { if (!cancelled) setRealtimeStatus('reconnecting'); };
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('sync-notice', handleNotice);
    void start();
    return () => {
      cancelled = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('sync-notice', handleNotice);
      pb.realtime.onDisconnect = undefined;
      void unsubscribeBookmarks?.();
      void unsubscribeCategories?.();
      void unsubscribeConnect?.();
      setRealtimeStatus('off');
    };
  }, [authUserId, isAuthChecked, setRealtimeStatus]);
};

export { useRealtimeSync };
