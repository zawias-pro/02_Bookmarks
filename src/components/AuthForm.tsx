import { useState, type FormEvent } from 'react';
import { pb } from '../lib/pocketbase';

const AuthForm = ({ onAuthChange }: { onAuthChange: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

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

  if (pb.authStore.isValid) {
    return (
      <div className="card">
        <h2 className="card-title">PocketBase Account</h2>
        <p>Signed in as {pb.authStore.record?.email || pb.authStore.record?.username}.</p>
        <button type="button" onClick={() => { pb.authStore.clear(); onAuthChange(); }}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">
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
};

export { AuthForm };
