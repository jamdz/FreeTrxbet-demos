import { useState, useMemo } from 'react';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import Logo from '@/components/Logo';
import { useApp } from '@/context/AppContext';

type Strength = 'weak' | 'medium' | 'strong';

function getPasswordStrength(pw: string): Strength {
  if (!pw) return 'weak';
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score >= 4) return 'strong';
  if (score >= 2) return 'medium';
  return 'weak';
}

const STRENGTH_STYLES: Record<Strength, { bar: string; label: string; text: string }> = {
  weak: { bar: 'bg-gray-600', label: 'Weak', text: 'text-gray-500' },
  medium: { bar: 'bg-yellow-500', label: 'Medium', text: 'text-yellow-500' },
  strong: { bar: 'bg-green-500', label: 'Strong', text: 'text-green-500' },
};

export default function RegisterPage({ onNavigate }: { onNavigate: (p: 'login' | 'landing') => void }) {
  const { register } = useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreeToS, setAgreeToS] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthStyle = STRENGTH_STYLES[strength];
  const strengthPercent = strength === 'weak' ? 33 : strength === 'medium' ? 66 : 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!agreeToS) {
      setError('You must agree to the Terms of Service');
      return;
    }
    setLoading(true);
    const result = await register(username, email, password);
    if (!result.ok) setError(result.error || 'Registration failed');
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="card p-6 animate-slide-up">
          <h1 className="mb-1 text-xl font-bold text-white">Create your account</h1>
          <p className="mb-6 text-sm text-gray-500">Join FreeTrxBet and start playing</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="input-base pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

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
                  placeholder="At least 6 characters"
                  className="input-base pl-10"
                  required
                />
              </div>
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-nested">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthStyle.bar}`}
                      style={{ width: `${strengthPercent}%` }}
                    />
                  </div>
                  <p className={`mt-1 text-xs font-medium ${strengthStyle.text}`}>
                    {strengthStyle.label} password
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="input-base pl-10"
                  required
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={agreeToS}
                onChange={(e) => setAgreeToS(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-accent-red"
              />
              <span className="text-xs text-gray-400">
                I agree to the{' '}
                <span className="font-medium text-accent-salmon">Terms of Service</span> and acknowledge that this is a demo platform with no real cryptocurrency.
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 rounded-btn bg-status-error-dim px-3 py-2 text-sm text-status-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !agreeToS}
              className="btn-primary w-full disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="font-semibold text-accent-salmon hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
