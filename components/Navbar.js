'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  HeartHandshake,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  PlusCircle,
  MapPin,
  Heart,
  Menu,
  X,
  User,
} from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <Link href="/" onClick={closeMenu} className="flex items-center gap-2 group">
            <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-md group-hover:bg-emerald-700 transition">
              <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Meal<span className="text-emerald-600">-Harvest</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-emerald-600 transition">
              Home
            </Link>

            {/* Request Food: hidden from PROVIDER */}
            {session?.user?.role !== 'PROVIDER' && (
              <Link
                href="/request-food"
                className="flex items-center gap-1 text-pink-600 hover:text-pink-700 transition font-semibold"
              >
                <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                Request Food
              </Link>
            )}

            {/* Post Surplus Food: only for PROVIDER */}
            {session?.user?.role === 'PROVIDER' && (
              <Link href="/provider" className="flex items-center gap-1 hover:text-emerald-600 transition">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Post Surplus Food
              </Link>
            )}

            {/* Dashboard: only for NGO and VOLUNTEER */}
            {(session?.user?.role === 'NGO' || session?.user?.role === 'VOLUNTEER') && (
              <Link href="/dashboard" className="flex items-center gap-1 hover:text-emerald-600 transition">
                <MapPin className="w-4 h-4 text-emerald-600" />
                NGO &amp; Driver Dashboard
              </Link>
            )}
          </nav>

          {/* Desktop Session State & Role / Verification Badges */}
          <div className="hidden md:flex items-center gap-3">
            {session?.user ? (
              <div className="flex items-center gap-3">
                {/* Role Badge */}
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {session.user.role}
                </span>

                {/* Verification Status Badge */}
                {session.user.isVerified ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Unverified
                  </span>
                )}

                {/* Profile Info */}
                <div className="hidden lg:flex flex-col text-right text-xs">
                  <span className="font-semibold text-slate-800">{session.user.name}</span>
                  <span className="text-slate-500">{session.user.email}</span>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition"
                >
                  Register Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            {session?.user && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {session.user.role}
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-xl animate-in slide-in-from-top duration-200">
          {session?.user && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 line-clamp-1">{session.user.name}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">{session.user.email}</div>
                </div>
              </div>
              <div>
                {session.user.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                    Unverified
                  </span>
                )}
              </div>
            </div>
          )}

          <nav className="flex flex-col space-y-1">
            <Link
              href="/"
              onClick={closeMenu}
              className="px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition flex items-center gap-2.5"
            >
              Home
            </Link>

            {/* Request Food: hidden from PROVIDER */}
            {session?.user?.role !== 'PROVIDER' && (
              <Link
                href="/request-food"
                onClick={closeMenu}
                className="px-3.5 py-2.5 text-sm font-semibold text-pink-600 hover:bg-pink-50 rounded-xl transition flex items-center gap-2.5"
              >
                <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                Request Food Support
              </Link>
            )}

            {/* Post Surplus Food: only for PROVIDER */}
            {session?.user?.role === 'PROVIDER' && (
              <Link
                href="/provider"
                onClick={closeMenu}
                className="px-3.5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 rounded-xl transition flex items-center gap-2.5"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Post Surplus Food
              </Link>
            )}

            {/* Dashboard: only for NGO and VOLUNTEER */}
            {(session?.user?.role === 'NGO' || session?.user?.role === 'VOLUNTEER') && (
              <Link
                href="/dashboard"
                onClick={closeMenu}
                className="px-3.5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 rounded-xl transition flex items-center gap-2.5"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                NGO &amp; Driver Dashboard
              </Link>
            )}
          </nav>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {session?.user ? (
              <button
                onClick={() => {
                  closeMenu();
                  signOut({ callbackUrl: '/' });
                }}
                className="w-full py-2.5 px-4 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="py-2.5 text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="py-2.5 text-center text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
