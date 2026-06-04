import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../../shared/api';
import { setToken } from '../../../shared/auth';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('All fields required.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/admin/login', { email, password });
      setToken(res.data.token);
      navigate('/admin/dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Login failed.');
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
          <p className="text-xs tracking-[0.3em]" style={{ color: 'var(--text-dim)' }}>ADMIN PANEL</p>
        </div>
        <div className="p-8 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <Input label="EMAIL" type="email" placeholder="admin@fraghub.com" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="PASSWORD" type="password" placeholder="••••••••" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <p className="text-xs tracking-widest" style={{ color: '#f87171' }}>{error}</p>}
          <Button onClick={handleLogin} loading={loading} className="w-full mt-2" size="lg">ACCESS PANEL</Button>
        </div>
      </div>
    </div>
  );
};
