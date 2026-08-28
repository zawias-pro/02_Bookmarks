import { useEffect } from 'react';
import { pb } from '../persistence/pocketbase.ts';
import { useAppStore } from '../store/appStore.ts';

const useAuthValidation = () => {
  const setAuthChecked = useAppStore((state) => state.setAuthChecked);

  useEffect(() => {
    const validateAuth = async () => {
      if (!pb.authStore.isValid || !pb.authStore.record) {
        setAuthChecked(true);
        return;
      }

      try {
        await pb.collection('users').authRefresh();
      } catch (error) {
        const status = error && typeof error === 'object' && 'status' in error ? error.status : null;
        if (typeof status === 'number' && status >= 400 && status < 500) {
          pb.authStore.clear();
        }
      } finally {
        setAuthChecked(true);
      }
    };

    void validateAuth();
  }, [setAuthChecked]);
};

export { useAuthValidation };
