import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { pb } from '../persistence/pocketbase.ts';

const AuthForm = ({ onAuthChange, onClose }: { onAuthChange: () => void; onClose: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    try {
      if (isLogin) {
        await pb.collection('users').authWithPassword(identity, password);
      } else {
        await pb.collection('users').create({ email: identity, password, passwordConfirm: password });
        await pb.collection('users').authWithPassword(identity, password);
      }
      setPassword('');
      onAuthChange();
    } catch {
      setMessage('PocketBase authentication failed. Local bookmarks remain available.');
    }
  };

  const content = pb.authStore.isValid ? (
      <div className="modal-card card">
        <h2 id="auth-title" className="card-title">PocketBase Account</h2>
        <p>Signed in as {pb.authStore.record?.email || pb.authStore.record?.username}.</p>
        <button type="button" onClick={() => { pb.authStore.clear(); onAuthChange(); }}>
          Sign out
        </button>
      </div>
    ) : (
    <div className="modal-card card">
        <h2 id="auth-title" className="card-title">
        PocketBase Sync Account ({isLogin ? 'Login' : 'Sign Up'})
      </h2>
      <p>
        Authentication is optional. Your bookmarks are stored locally first.
      </p>

      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label" htmlFor="identity">Email or Username</label>
          <input
            id="identity"
            type="text"
            className="form-input"
            placeholder="user@example.com"
            value={identity}
            onChange={(event) => setIdentity(event.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
        >
          {`${isLogin ? 'Sign In' : 'Create Account'} for Sync`}
        </button>
      </form>

      {message && <p role="alert">{message}</p>}

      <div>
        <button
          type="button"
          onClick={() => setIsLogin((current) => !current)}
        >
          {isLogin ? 'Need an account? Create one' : 'Have an account? Sign in'}
        </button>
      </div>
    </div>
  );

  return createPortal(
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" type="button" aria-label="Close authentication" onClick={onClose}>Close</button>
        {content}
      </div>
    </div>,
    document.body,
  );
};

export { AuthForm };
