'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldAlert, ShieldCheck, Upload, X } from 'lucide-react';

export default function VerificationBanner() {
  const { data: session, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    organizationName: session?.user?.organizationDetails?.name || '',
    registrationId: session?.user?.organizationDetails?.registrationId || '',
    documentUrl: session?.user?.organizationDetails?.documentUrl || '',
    vehicleCapacity: session?.user?.vehicleCapacity || 50,
  });

  if (!session?.user || session.user.isVerified) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/user/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit verification details.');
      }

      setSuccess('Verification credentials submitted successfully! You are now verified.');
      // Trigger session update client-side
      await update({
        isVerified: true,
        organizationDetails: data.user.organizationDetails,
        vehicleCapacity: data.user.vehicleCapacity,
      });

      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-amber-500 text-slate-900 px-4 py-3 text-xs sm:text-sm font-medium shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-amber-600">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 flex-shrink-0 animate-pulse" />
          <span>
            <strong>Account Unverified:</strong> You need a verified account to post or claim food donations.
          </span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition shadow text-center flex-shrink-0"
        >
          Upload Verification Credentials
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 relative border border-slate-200 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">User Verification Workflow</h3>
                <p className="text-xs text-slate-500">Provide official identity or NGO details for security audit</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization / User Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData({ ...formData, organizationName: e.target.value })
                  }
                  placeholder="e.g. Hope Food Foundation / City Hotel"
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Government / NGO Registration ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.registrationId}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationId: e.target.value })
                  }
                  placeholder="e.g. NGO-REG-884920"
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verification Document URL
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="url"
                    value={formData.documentUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, documentUrl: e.target.value })
                    }
                    placeholder="https://example.com/certificate.pdf"
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg text-xs flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {session?.user?.role === 'VOLUNTEER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vehicle Capacity (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.vehicleCapacity}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicleCapacity: e.target.value })
                    }
                    placeholder="50"
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Submit Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
