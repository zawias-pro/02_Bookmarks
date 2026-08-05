import { useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal/Modal.tsx';
import { pb } from '../persistence/pocketbase.ts';
import { useAppStore } from "../store/appStore.ts";
import { toast } from 'sonner';

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
      setAuthFormOpen(false);
      toast.success('Signed in');
    } catch {
      setMessage('Authentication failed.');
    }
  };

  return (
    <Modal titleId="auth-title" onClose={() => {setAuthFormOpen(false)}}>
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
    </Modal>
  );
};

export { AuthForm };
