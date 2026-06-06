'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Play, Star } from 'lucide-react';

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
      {/* Base */}
      <div className="absolute inset-0 bg-[#0A0A0F]" />

      {/* Dot grid */}
      <div className="absolute inset-0 dot-pattern opacity-40" />

      {/* Purple orb — top left */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.55) 0%, rgba(124,58,237,0.08) 50%, transparent 70%)' }}
      />

      {/* Purple orb — bottom right */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute -bottom-48 -right-48 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.45) 0%, rgba(168,85,247,0.06) 50%, transparent 70%)' }}
      />

      {/* Floating dots */}
      <motion.div animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 right-1/4 w-3 h-3 rounded-full bg-violet-500/40 blur-sm" />
      <motion.div animate={{ y: [8, -8, 8] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-1/3 left-1/4 w-2 h-2 rounded-full bg-purple-400/30 blur-sm" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl">

          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/25 bg-violet-500/8 text-violet-400 text-xs font-semibold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Media Management
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants}
            className="ttext-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 font-display">
            <span className="text-white">Your Events,</span>
            <br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 40%, #c084fc 70%, #a855f7 100%)' }}>
              Perfectly Captured
            </span>
          </motion.h1>

          {/* Subline */}
          <motion.p variants={itemVariants}
            className="text-lg md:text-xl text-[#71717A] max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            The ultimate platform for clubs and societies to manage, share, and discover event
            photos with AI-powered face recognition and auto-tagging.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register"
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-violet-600 text-white font-semibold text-base transition-all duration-300 hover:bg-violet-500 hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] shadow-[0_0_25px_rgba(124,58,237,0.3)]">
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link href="/events"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl border border-[#27272A] bg-[#161B22]/60 text-[#A1A1AA] font-semibold text-base hover:border-[#3f3f46] hover:text-white hover:bg-[#1C2230] transition-all duration-300 backdrop-blur-sm">
              <Play className="w-4 h-4 fill-current opacity-70" />
              Explore Events
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 mb-16">
            <div className="flex -space-x-2">
              {['bg-violet-500', 'bg-purple-600', 'bg-fuchsia-500', 'bg-indigo-500', 'bg-violet-400'].map((color, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${color} border-2 border-[#0A0A0F] flex items-center justify-center text-white text-[9px] font-bold`}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 ml-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
            </div>
            <span className="text-[#71717A] text-sm ml-1">
              Loved by <span className="text-white font-medium">2,000+</span> members
            </span>
          </motion.div>
        </motion.div>

        {/* Stats panel */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="w-full max-w-3xl"
        >
          <div className="grid grid-cols-3 divide-x divide-[#27272A] border border-[#27272A] rounded-2xl bg-[#161B22]/40 backdrop-blur-sm overflow-hidden">
            {[
              { value: '10K+', label: 'Photos Shared',  sub: 'and growing' },
              { value: '500+', label: 'Events',         sub: 'hosted this year' },
              { value: '2K+',  label: 'Happy Users',    sub: 'across clubs' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 + i * 0.1 }}
                className="py-6 px-4 text-center">
                <p className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text mb-1 font-display"
                  style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
                  {stat.value}
                </p>
                <p className="text-white text-sm font-medium">{stat.label}</p>
                <p className="text-[#52525b] text-xs mt-0.5">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0F] to-transparent pointer-events-none" />
    </section>
  );
}