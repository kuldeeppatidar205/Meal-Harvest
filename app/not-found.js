import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
        <h2 className="text-4xl font-extrabold text-slate-900">404</h2>
        <p className="text-base text-slate-600 mt-2">Page Not Found</p>
        <p className="text-xs text-slate-500 mt-1">The requested page could not be located on Meal-Harvest.</p>
        <Link
          href="/"
          className="mt-6 inline-block px-5 py-2.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-700 transition"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
