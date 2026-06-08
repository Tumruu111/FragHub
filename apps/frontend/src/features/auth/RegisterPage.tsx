import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../shared/api';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { setError('All fields required.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      navigate('/login');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, var(--gold) 0px, var(--gold) 1px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, var(--gold) 0px, var(--gold) 1px, transparent 1px, transparent 80px)',
      }} />
      <div className="relative w-full max-w-sm fade-up space-y-8">
        <div className="text-center space-y-3">
          <Link to="/" className="font-display text-3xl tracking-[0.3em]" style={{ color: 'var(--gold)' }}>FRAGHUB</Link>
          <p className="text-xs tracking-[0.3em]" style={{ color: 'var(--text-dim)' }}>CREATE YOUR ACCOUNT</p>
        </div>
        <div className="p-8 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Input label="NAME" placeholder="Your name" value={form.name} onChange={set('name')} />
          <Input label="EMAIL" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
          <Input label="PASSWORD" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
          <Input label="CONFIRM PASSWORD" type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} />
          {error && <p className="text-xs tracking-widest" style={{ color: '#f87171' }}>{error}</p>}
          <Button onClick={handleRegister} loading={loading} className="w-full mt-2" size="lg">CREATE ACCOUNT</Button>
        </div>
        <p className="text-center text-xs tracking-widest" style={{ color: 'var(--text-dim)' }}>
          Have an account?{' '}<Link to="/login" style={{ color: 'var(--gold)' }}>SIGN IN</Link>
        </p>
      </div>
    </div>
  );
};
