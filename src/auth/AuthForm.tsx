import { useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal/Modal.tsx';
import { pb } from '../persistence/pocketbase.ts';
import { useAppStore } from "../store/appStore.ts";

const AuthForm = () => {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const setAuthFormOpen = useAppStore((state) => state.setAuthFormOpen);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    try {
      await pb.collection('users').authWithPassword(identity, password);
      setPassword('');
    } catch {
      setMessage('Authentication failed.');
    }
  };

  const content = pb.authStore.isValid ? (
    <div>
      <h2 id="auth-title" className="card-title">PocketBase Account</h2>
      <p>Signed in as {pb.authStore.record?.email || pb.authStore.record?.username}.</p>
      <button type="button" onClick={() => {
        pb.authStore.clear();
      }}>
        Sign out
      </button>
    </div>
  ) : (
    <div>
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

  return (
    <Modal titleId="auth-title" onClose={() => {setAuthFormOpen(false)}}>
      {content}
    </Modal>
  );
};

export { AuthForm };
