'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Chrome } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  onSuccess?: () => void;
  onToggleMode?: () => void;
  mode?: 'signin' | 'signup';
}

export function LoginForm({ onSuccess, onToggleMode, mode = 'signin' }: LoginFormProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);

    if (error) {
      setError(error.message);
    } else if (mode === 'signup') {
      setMessage('Check your email for a confirmation link!');
    } else {
      onSuccess?.();
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Don't set loading to false - redirect will happen
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-light text-white">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-neutral-400 mt-2">
          {mode === 'signin'
            ? 'Sign in to access your taste profile'
            : 'Join Subtaste to discover your aesthetic DNA'}
        </p>
      </div>

      {/* Google Sign In */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={cn(
          'w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl',
          'bg-white text-neutral-900 font-medium',
          'hover:bg-neutral-100 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Chrome className="w-5 h-5" />
        )}
        Continue with Google
      </button>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-neutral-800" />
        <span className="text-neutral-500 text-sm">or</span>
        <div className="flex-1 h-px bg-neutral-800" />
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className={cn(
              'w-full pl-12 pr-4 py-3 rounded-xl',
              'bg-neutral-900 border border-neutral-800',
              'text-white placeholder:text-neutral-500',
              'focus:outline-none focus:border-violet-500 transition-colors'
            )}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className={cn(
              'w-full pl-12 pr-4 py-3 rounded-xl',
              'bg-neutral-900 border border-neutral-800',
              'text-white placeholder:text-neutral-500',
              'focus:outline-none focus:border-violet-500 transition-colors'
            )}
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center"
          >
            {error}
          </motion.p>
        )}

        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-emerald-400 text-sm text-center"
          >
            {message}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full py-3 rounded-xl font-medium transition-all',
            'bg-gradient-to-r from-violet-600 to-fuchsia-600',
            'hover:from-violet-500 hover:to-fuchsia-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-2'
          )}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : mode === 'signin' ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Toggle mode */}
      <p className="text-center text-neutral-400 mt-6">
        {mode === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              onClick={onToggleMode}
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={onToggleMode}
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </motion.div>
  );
}
