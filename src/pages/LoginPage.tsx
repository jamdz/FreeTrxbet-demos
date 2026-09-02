import { useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import Logo from '@/components/Logo';
import { useApp } from '@/context/AppContext';

export default function LoginPage({ onNavigate }: { onNavigate: (p: 'register' | 'landing') => void }) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.ok) setError(result.error || 'Login failed');
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="card p-6 animate-slide-up">
          <h1 className="mb-1 text-xl font-bold text-white">Welcome back</h1>
          <p className="mb-6 text-sm text-gray-500">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-base pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-btn bg-status-error-dim px-3 py-2 text-sm text-status-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="font-semibold text-accent-salmon hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-600">
          Demo: admin@freetrxbet.com / admin123
        </p>
      </div>
    </div>
  );
}
