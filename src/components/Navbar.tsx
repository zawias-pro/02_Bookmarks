import React from 'react';

interface NavbarProps {
  pbConnected: boolean;
  isOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ pbConnected, isOnline }) => {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon">BM</div>
        <div>
          <h1 className="brand-title">Bookmarks Starter</h1>
        </div>
      </div>
      <div className="badge-container" style={{ display: 'flex', gap: '0.5rem' }}>
        {!isOnline && (
          <span className="badge badge-danger">
            <span className="dot"></span> Offline
          </span>
        )}
        {pbConnected ? (
          <span className="badge badge-success">
            <span className="dot"></span> PocketBase Connected
          </span>
        ) : (
          <span className="badge badge-warning">
            <span className="dot"></span> PocketBase Offline
          </span>
        )}
      </div>
    </header>
  );
};
