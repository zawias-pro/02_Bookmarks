import { useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal/Modal.tsx';
import { pb } from '../persistence/pocketbase.ts';
import { useAppStore } from "../store/appStore.ts";
import { toast } from 'sonner';

const AuthForm = () => {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const setAuthFormOpen = useAppStore((state) => state.setAuthFormOpen);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await pb.collection('users').authWithPassword(identity, password);
      setPassword('');
      setAuthFormOpen(false);
      toast.success('Signed in');
    } catch {
      toast.success('Sign in failed');
    }
  };

  return (
    <Modal titleId="auth-title" onClose={() => {setAuthFormOpen(false)}}>
      <div>
      <h2 id="auth-title">
        Login
      </h2>
      <form onSubmit={submit}>
        <div>
          <label htmlFor="identity">Email or Username</label>
          <input
            id="identity"
            type="text"
            value={identity}
            onChange={(event) => setIdentity(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button type="submit">
          Log in
        </button>
      </form>
      </div>
    </Modal>
  );
};

export { AuthForm };
