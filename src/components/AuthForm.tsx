import { useState } from 'react';

const AuthForm = ({ readOnly }: { readOnly: boolean }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="card">
      <h2 className="card-title">
        Default Auth Scaffold ({isLogin ? 'Login' : 'Sign Up'})
      </h2>
      {readOnly && (
        <div className="offline-banner">
          Offline &mdash; authentication is read-only
        </div>
      )}
      <p>
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

        <button
          type="button"
          className="btn btn-primary"
          disabled={readOnly}
        >
          {readOnly ? 'Unavailable Offline' : `${isLogin ? 'Sign In' : 'Create Account'} (Scaffold)`}
        </button>
      </form>

      <div>
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Need an account? Toggle Sign Up scaffold" : "Have an account? Toggle Login scaffold"}
        </button>
      </div>
    </div>
  );
};

export { AuthForm };
