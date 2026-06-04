'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Camera, ArrowRight, Lock, Mail, User, AtSign, Info } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((state) => state.register);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: formData.email,
        username: formData.username,
        fullName: formData.fullName,
        password: formData.password,
        // role is always VIEWER – enforced server-side
      });
      toast.success('Account created! Welcome.');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch =
    formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen flex bg-[#0a0a0f]">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-2/5 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-bold">CIG Media</span>
        </div>

        <div className="relative z-10 space-y-4">
          <p className="text-sm font-semibold text-violet-400 uppercase tracking-widest">Join the platform</p>
          <h1 className="text-3xl font-bold text-white leading-snug">
            Start your journey<br />with the club.
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Create your account and browse event photos, request role upgrades, and connect with your community.
          </p>
        </div>

        <div className="relative z-10">
          <div className="space-y-3">
            {[
              { step: '1', text: 'Sign up as Viewer' },
              { step: '2', text: 'Request a role upgrade' },
              { step: '3', text: 'Admin approves your request' },
              { step: '4', text: 'Access unlocked!' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 text-xs font-bold flex-shrink-0">
                  {step}
                </div>
                <p className="text-gray-400 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="text-white text-lg font-bold">CIG Media</span>
          </div>

          <div>
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-1">Join the CIG Media Platform</p>
            <h2 className="text-2xl font-bold text-white">Create your account</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username + Full Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">
                  Username <span className="text-violet-400">*</span>
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="john_doe"
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="[a-zA-Z0-9_]+"
                    className="w-full bg-[#111118] border border-[#2a2a3a] text-white placeholder-gray-600 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="w-full bg-[#111118] border border-[#2a2a3a] text-white placeholder-gray-600 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                Email <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#111118] border border-[#2a2a3a] text-white placeholder-gray-600 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                Password <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  className="w-full bg-[#111118] border border-[#2a2a3a] text-white placeholder-gray-600 rounded-xl py-3 pl-10 pr-11 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                Confirm Password <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                  className={`w-full bg-[#111118] border text-white placeholder-gray-600 rounded-xl py-3 pl-10 pr-11 text-sm focus:outline-none focus:ring-1 transition-all ${
                    formData.confirmPassword
                      ? passwordsMatch
                        ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/30'
                        : 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-[#2a2a3a] focus:border-violet-500 focus:ring-violet-500/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Viewer notice */}
            <div className="flex items-start gap-2.5 bg-[#111118] border border-[#2a2a3a] rounded-xl p-3.5">
              <Info className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                You'll join as a <span className="text-white font-semibold">Viewer</span>. To get upload or
                member access, request a role upgrade after registering.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
