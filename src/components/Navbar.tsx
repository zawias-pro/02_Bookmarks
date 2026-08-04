const Navbar = ({ isOnline, syncEnabled, onSyncAccountClick, onPull, onPush, syncMessage }: { isOnline: boolean; syncEnabled: boolean; onSyncAccountClick: () => void; onPull: () => void; onPush: () => void; syncMessage: string }) => {
  return (
    <header className="navbar">
      <div className="brand">
        <div>
          <h1 className="brand-title">Start Five</h1>
        </div>
      </div>
      <div className="badge-container">
        <button type="button" onClick={onSyncAccountClick}>
          {syncEnabled ? 'Sync enabled' : 'Enable sync'}
        </button>
        {!isOnline && (
          <span className="badge badge-danger">
            Offline
          </span>
        )}
        <button type="button" onClick={onPull} disabled={!isOnline || !syncEnabled}>Force pull</button>
        <button type="button" onClick={onPush} disabled={!isOnline || !syncEnabled}>Force push</button>
        {syncMessage && <span className="badge">{syncMessage}</span>}
      </div>
    </header>
  );
};

export { Navbar };
