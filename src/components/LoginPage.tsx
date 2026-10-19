import { useState } from 'react';
import { Lock, Loader2, User, Mail, Eye, EyeOff } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '@/lib/identity';

export default function LoginPage() {
  const { signInWithName, signUpWithName } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (next: 'login' | 'signup') => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (mode === 'signup' && !email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = mode === 'login'
        ? await signInWithName(name.trim(), password)
        : await signUpWithName(name.trim(), email.trim(), password);
      if (res.error) {
        setError(res.error);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center px-6 relative overflow-y-auto py-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-black to-orange-500/10" />
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-rose-500/10 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-xs">
        {/* Logo */}
        <Logo size="xl" className="mb-2" />

        {/* Heading */}
        <h1 className="text-white text-xl font-bold mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>

        {/* Tagline */}
        <p className="text-gray-400 text-sm mb-6 text-center">
          {mode === 'login'
            ? 'Sign in to watch, create, and earn'
            : 'Join PikPok to watch, create, and earn'}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3">
          {/* Name */}
          <div className="flex items-center gap-2 bg-zinc-900 rounded-xl px-3 py-3.5 border border-white/10 focus-within:border-white/30 transition-colors">
            <User size={18} className="text-gray-500 shrink-0" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600 min-w-0"
              autoComplete="name"
              autoFocus
            />
          </div>

          {/* Email — only on signup */}
          {mode === 'signup' && (
            <div className="flex items-center gap-2 bg-zinc-900 rounded-xl px-3 py-3.5 border border-white/10 focus-within:border-white/30 transition-colors">
              <Mail size={18} className="text-gray-500 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600 min-w-0"
                autoComplete="email"
              />
            </div>
          )}

          {/* Password */}
          <div className="flex items-center gap-2 bg-zinc-900 rounded-xl px-3 py-3.5 border border-white/10 focus-within:border-white/30 transition-colors">
            <Lock size={18} className="text-gray-500 shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600 min-w-0"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-gray-500 hover:text-white shrink-0"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-rose-400 text-xs text-center px-2">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-sm py-3.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : mode === 'login' ? (
              <>
                <User size={18} /> Sign In
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Toggle login/signup */}
        <button
          onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
          className="text-gray-400 text-sm mt-5 hover:text-white transition-colors text-center"
        >
          {mode === 'login'
            ? "Don't have an account? Sign Up"
            : 'Already have an account? Sign In'}
        </button>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-gray-600 text-xs text-center px-6">
        By continuing you agree to PikPok's Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
