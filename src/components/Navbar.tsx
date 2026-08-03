import React from 'react';

interface NavbarProps {
  pbConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ pbConnected }) => {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon">BM</div>
        <div>
          <h1 className="brand-title">Bookmarks Starter</h1>
        </div>
      </div>
      <div className="badge-container">
        {pbConnected ? (
          <span className="badge badge-success">
            <span className="dot"></span> PocketBase Connected
          </span>
        ) : (
          <span className="badge badge-warning">
            <span className="dot"></span> PocketBase Offline (http://127.0.0.1:8090)
          </span>
        )}
      </div>
    </header>
  );
};
