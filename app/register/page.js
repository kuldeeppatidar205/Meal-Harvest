'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import VerificationBanner from '@/components/VerificationBanner';
import { HeartHandshake, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'PROVIDER',
    organizationName: '',
    registrationId: '',
    documentUrl: '',
    vehicleCapacity: 50,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          organizationDetails: {
            name: formData.organizationName,
            registrationId: formData.registrationId,
            documentUrl: formData.documentUrl,
          },
          vehicleCapacity: formData.vehicleCapacity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <VerificationBanner />

      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 py-8 sm:py-12">
        <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-2xl mb-3">
              <HeartHandshake className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Create an Account</h2>
            <p className="text-xs text-slate-500 mt-1">
              Join Meal-Harvest to connect surplus food to community need
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {[
                  { role: 'PROVIDER', label: 'Food Provider' },
                  { role: 'NGO', label: 'Verified NGO' },
                  { role: 'VOLUNTEER', label: 'Volunteer Driver' },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: item.role })}
                    className={`py-2.5 px-2 text-[11px] sm:text-xs font-semibold rounded-xl border transition text-center ${
                      formData.role === item.role
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name / Contact Person</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@org.com"
                  className="w-full px-3.5 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="•••••••• (Min 6 characters)"
                className="w-full px-3.5 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Optional Verification Details */}
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-800 mb-2">
                Organization Verification Details <span className="text-slate-400 font-normal">(Optional during signup)</span>
              </p>

              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  placeholder="Organization / Company Name"
                  className="w-full px-3.5 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                <input
                  type="text"
                  value={formData.registrationId}
                  onChange={(e) => setFormData({ ...formData, registrationId: e.target.value })}
                  placeholder="Gov / NGO Registration ID"
                  className="w-full px-3.5 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                {formData.role === 'VOLUNTEER' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Capacity (kg)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.vehicleCapacity}
                      onChange={(e) => setFormData({ ...formData, vehicleCapacity: e.target.value })}
                      placeholder="50"
                      className="w-full px-3.5 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>

          <p className="text-xs text-center text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
