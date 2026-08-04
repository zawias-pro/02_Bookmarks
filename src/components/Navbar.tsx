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
      <div className="badge-container">
        {!isOnline && (
          <span className="badge badge-danger">
            Offline
          </span>
        )}
        {pbConnected ? (
          <span className="badge badge-success">
            PocketBase Connected
          </span>
        ) : (
          <span className="badge badge-warning">
            PocketBase Offline
          </span>
        )}
      </div>
    </header>
  );
};
