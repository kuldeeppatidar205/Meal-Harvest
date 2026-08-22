'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import VerificationBanner from '@/components/VerificationBanner';
import { HeartHandshake, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <VerificationBanner />

      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-2xl mb-3">
              <HeartHandshake className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-xs text-slate-500 mt-1">Sign in to your Meal-Harvest account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
                className="w-full px-3.5 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-center text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link href="/register" className="text-emerald-600 font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
