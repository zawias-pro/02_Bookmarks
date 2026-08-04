const Navbar = ({ isOnline, onPull, onPush, syncMessage }: { isOnline: boolean; onPull: () => void; onPush: () => void; syncMessage: string }) => {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon">BM</div>
        <div>
          <h1 className="brand-title">Bookmarks Starter</h1>
        </div>
      </div>
      <div className="badge-container">
        {!isOnline && (
          <span className="badge badge-danger">
            Offline
          </span>
        )}
        <button type="button" onClick={onPull} disabled={!isOnline}>Force pull</button>
        <button type="button" onClick={onPush} disabled={!isOnline}>Force push</button>
        {syncMessage && <span className="badge">{syncMessage}</span>}
      </div>
    </header>
  );
};

export { Navbar };
