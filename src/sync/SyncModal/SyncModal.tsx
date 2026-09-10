import { Modal } from '../../components/Modal/Modal.tsx';
import { useAppStore } from '../../store/appStore.ts';
import { SyncControls } from '../SyncControls/SyncControls.tsx';

const SyncModal = () => {
  const isSyncModalOpen = useAppStore((state) => state.isSyncModalOpen);
  const setSyncModalOpen = useAppStore((state) => state.setSyncModalOpen);

  if (!isSyncModalOpen) return null;

  return (
    <Modal titleId="sync-modal-title" onClose={() => setSyncModalOpen(false)}>
      <h2 id="sync-modal-title">Sync</h2>
      <SyncControls />
    </Modal>
  );
};

export { SyncModal };
