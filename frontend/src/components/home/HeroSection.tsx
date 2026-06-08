'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Star } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] } },
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* ── Base ── */}
      <div className="absolute inset-0 bg-[#0A0A0F]" />

      {/* ── Aurora layer 1: Primary violet bloom — vast, top-center ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] max-w-[1400px] h-[85vh] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 72% 80% at 50% -8%, rgba(109,40,217,0.42) 0%, rgba(124,58,237,0.18) 38%, rgba(99,102,241,0.05) 60%, transparent 76%)',
        }}
      />

      {/* ── Aurora layer 2: Indigo — upper left ── */}
      <div
        className="absolute -top-24 -left-24 w-[750px] h-[700px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 18% 18%, rgba(79,70,229,0.30) 0%, rgba(67,56,202,0.13) 36%, transparent 62%)',
        }}
      />

      {/* ── Aurora layer 3: Fuchsia — upper right ── */}
      <div
        className="absolute -top-16 -right-16 w-[720px] h-[650px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 82% 14%, rgba(192,132,252,0.26) 0%, rgba(168,85,247,0.11) 38%, transparent 63%)',
        }}
      />

      {/* ── Aurora layer 4: Deep purple — bottom left depth (animated) ── */}
      <motion.div
        animate={{ scale: [1, 1.07, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        className="absolute -bottom-36 -left-40 w-[640px] h-[560px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 12% 88%, rgba(91,33,182,0.24) 0%, rgba(79,70,229,0.09) 40%, transparent 65%)',
        }}
      />

      {/* ── Aurora layer 5: Soft violet — mid right (animated) ── */}
      <motion.div
        animate={{ scale: [1, 1.09, 1], opacity: [0.65, 0.9, 0.65] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="absolute top-1/3 -right-28 w-[560px] h-[560px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 88% 50%, rgba(168,85,247,0.18) 0%, rgba(139,92,246,0.07) 42%, transparent 66%)',
        }}
      />

      {/* ── Dot grid ── */}
      <div className="absolute inset-0 dot-pattern opacity-[0.30] pointer-events-none" />

      {/* ── Noise grain ── */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* ── Floating accent dots (kept at existing animation level) ── */}
      <motion.div
        animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 right-1/4 w-2.5 h-2.5 rounded-full bg-violet-400/45 blur-[1px]"
      />
      <motion.div
        animate={{ y: [8, -8, 8] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-1/3 left-1/4 w-2 h-2 rounded-full bg-indigo-400/35 blur-[1px]"
      />
      <motion.div
        animate={{ y: [-6, 6, -6], x: [3, -3, 3] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
        className="absolute top-[58%] right-[34%] w-1.5 h-1.5 rounded-full bg-purple-300/35 blur-[1px]"
      />

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl w-full">

          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
              style={{
                background: 'rgba(109,40,217,0.13)',
                border: '1px solid rgba(167,139,250,0.30)',
                color: '#c4b5fd',
                boxShadow: '0 0 22px rgba(109,40,217,0.22), inset 0 1px 0 rgba(255,255,255,0.07)',
              }}
            >
              <Sparkles className="w-3 h-3" />
              AI-Powered Media Management
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-extrabold tracking-tight leading-[1.04] mb-7 font-display"
          >
            <span className="block text-white">Your Events,</span>
            <span
              className="block text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #ddd6fe 0%, #a78bfa 28%, #7c3aed 55%, #c084fc 80%, #e879f9 100%)',
              }}
            >
              Perfectly Captured
            </span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl max-w-[520px] mx-auto mb-12 leading-relaxed font-light"
            style={{ color: '#8B8BA8' }}
          >
            The ultimate platform for clubs and societies to manage, share, and discover event
            photos with AI-powered face recognition and auto-tagging.
          </motion.p>

          {/* Single premium CTA */}
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-5 mb-14">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-3 px-9 py-4 rounded-xl font-semibold text-[15px] text-white overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.99]"
              style={{
                background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 48%, #8b5cf6 100%)',
                boxShadow:
                  '0 0 0 1px rgba(167,139,250,0.25), 0 8px 40px rgba(109,40,217,0.50), 0 2px 12px rgba(0,0,0,0.45)',
              }}
            >
              {/* Inner top highlight line */}
              <span
                className="absolute inset-x-0 top-0 h-px pointer-events-none"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 5%, rgba(221,214,254,0.55) 50%, transparent 95%)',
                }}
                aria-hidden="true"
              />
              {/* Shimmer sweep on hover */}
              <span
                className="absolute inset-y-0 left-0 w-2/3 -skew-x-12 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out pointer-events-none"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.09) 50%, transparent 100%)',
                }}
                aria-hidden="true"
              />
              <span className="relative z-10">Get Started Free</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>

            {/* Secondary text link */}
            <p className="text-sm text-[#4a4a5a]">
              Free to start ·{' '}
              <Link
                href="/login"
                className="text-violet-500 hover:text-violet-400 transition-colors duration-200"
              >
                Sign in instead
              </Link>
            </p>
          </motion.div>

          {/* Social proof */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-16"
          >
            <div className="flex -space-x-2">
              {[
                'bg-violet-500',
                'bg-purple-600',
                'bg-fuchsia-500',
                'bg-indigo-500',
                'bg-violet-400',
              ].map((color, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full ${color} border-2 border-[#0A0A0F] flex items-center justify-center text-white text-[9px] font-bold`}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div className="w-px h-4 bg-[#2d2d2d]" aria-hidden="true" />
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm text-[#71717A]">
              Loved by <span className="text-white font-medium">2,000+</span> members
            </span>
          </motion.div>
        </motion.div>

        {/* Stats panel — gradient border treatment */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="w-full max-w-2xl"
        >
          {/* Gradient border wrapper */}
          <div
            className="p-[1px] rounded-2xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(139,92,246,0.60) 0%, rgba(99,102,241,0.25) 40%, rgba(168,85,247,0.50) 100%)',
            }}
          >
            <div
              className="grid grid-cols-3 rounded-[15px] overflow-hidden backdrop-blur-xl"
              style={{ background: 'rgba(9,9,18,0.86)' }}
            >
              {[
                { value: '10K+', label: 'Photos Shared', sub: 'and growing' },
                { value: '500+', label: 'Events', sub: 'hosted this year' },
                { value: '2K+', label: 'Happy Users', sub: 'across clubs' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className="py-7 px-4 text-center"
                  style={{
                    borderRight: i < 2 ? '1px solid rgba(39,39,42,0.55)' : 'none',
                  }}
                >
                  <p
                    className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text mb-1.5 font-display"
                    style={{
                      backgroundImage:
                        'linear-gradient(135deg, #ddd6fe 0%, #a78bfa 45%, #8b5cf6 100%)',
                    }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-white text-sm font-medium mb-0.5">{stat.label}</p>
                  <p className="text-xs text-[#3f3f46]">{stat.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, #0A0A0F 0%, rgba(10,10,15,0.88) 38%, transparent 100%)',
        }}
      />
    </section>
  );
}
