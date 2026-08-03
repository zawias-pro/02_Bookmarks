import React, { useState } from 'react';

export const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="card">
      <h2 className="card-title">
        🔑 Default Auth Scaffold ({isLogin ? 'Login' : 'Sign Up'})
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
        PocketBase password authentication provider scaffold.
      </p>
      
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <label className="form-label" htmlFor="identity">Email or Username</label>
          <input
            id="identity"
            type="text"
            className="form-input"
            placeholder="user@example.com"
            disabled
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-input"
            placeholder="••••••••"
            disabled
          />
        </div>

        <button type="button" className="btn btn-primary" style={{ opacity: 0.8, cursor: 'default' }}>
          {isLogin ? 'Sign In (Scaffold)' : 'Create Account (Scaffold)'}
        </button>
      </form>

      <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: 'inherit' }}
        >
          {isLogin ? "Need an account? Toggle Sign Up scaffold" : "Have an account? Toggle Login scaffold"}
        </button>
      </div>
    </div>
  );
};
