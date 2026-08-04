import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { pb } from '../persistence/pocketbase.ts';

const AuthForm = ({ onAuthChange, onClose }: { onAuthChange: () => void; onClose: () => void }) => {
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
      await pb.collection('users').authWithPassword(identity, password);
      setPassword('');
      onAuthChange();
    } catch {
      setMessage('Authentication failed.');
    }
  };

  const content = pb.authStore.isValid ? (
    <div className="modal-card card">
      <h2 id="auth-title" className="card-title">PocketBase Account</h2>
      <p>Signed in as {pb.authStore.record?.email || pb.authStore.record?.username}.</p>
      <button type="button" onClick={() => {
        pb.authStore.clear();
        onAuthChange();
      }}>
        Sign out
      </button>
    </div>
  ) : (
    <div className="modal-card card">
      <h2 id="auth-title" className="card-title">
        Login
      </h2>
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label" htmlFor="identity">Email or Username</label>
          <input
            id="identity"
            type="text"
            className="form-input"
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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
        >
          Log in
        </button>
      </form>

      {message && <p role="alert">{message}</p>}
    </div>
  );

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" type="button" aria-label="Close authentication" onClick={onClose}>Close</button>
        {content}
      </div>
    </div>,
    document.body,
  );
};

export { AuthForm };
