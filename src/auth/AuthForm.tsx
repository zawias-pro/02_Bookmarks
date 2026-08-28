import { useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal/Modal.tsx';
import { Field } from '../components/Field/Field.tsx';
import { Button } from '../components/Button/Button.tsx';
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
    <Modal titleId="auth-title" onClose={() => { setAuthFormOpen(false) }}>
      <h2 id="auth-title">Login</h2>
      <form onSubmit={submit}>
        <Field label="Email or Username" htmlFor="identity">
          <input id="identity" type="text" value={identity} onChange={(event) => setIdentity(event.target.value)} autoFocus />
        </Field>
        <Field label="Password" htmlFor="password">
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <Button type="submit">Log in</Button>
      </form>
    </Modal>
  );
};

export { AuthForm };