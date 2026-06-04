'use client';

import { motion } from 'framer-motion';
import { Scan, Tag, Download, Bell, Cloud, Shield } from 'lucide-react';

const features = [
  { icon: Scan,     title: 'Face Recognition',       description: 'Find every photo of yourself automatically using state-of-the-art AWS Rekognition AI face detection.',           iconBg: 'bg-blue-500/15 border-blue-500/25',    iconColor: 'text-blue-400',    glow: 'rgba(59,130,246,0.12)' },
  { icon: Tag,      title: 'AI Auto-Tagging',         description: 'Photos are instantly tagged with relevant keywords powered by intelligent scene and object recognition.',        iconBg: 'bg-violet-500/15 border-violet-500/25', iconColor: 'text-violet-400',  glow: 'rgba(124,58,237,0.12)' },
  { icon: Download, title: 'Watermarked Downloads',   description: 'Download full-resolution images with automatic club branding, preserving credit and identity.',                  iconBg: 'bg-emerald-500/15 border-emerald-500/25', iconColor: 'text-emerald-400', glow: 'rgba(16,185,129,0.10)' },
  { icon: Bell,     title: 'Real-time Notifications', description: 'Get instant alerts when new photos are uploaded, you are tagged, or albums are shared with your club.',         iconBg: 'bg-amber-500/15 border-amber-500/25',  iconColor: 'text-amber-400',   glow: 'rgba(245,158,11,0.10)' },
  { icon: Cloud,    title: 'Secure Cloud Storage',    description: 'All media securely stored on AWS S3 with automatic backups, CDN delivery, and zero data loss.',                iconBg: 'bg-cyan-500/15 border-cyan-500/25',    iconColor: 'text-cyan-400',    glow: 'rgba(6,182,212,0.10)'  },
  { icon: Shield,   title: 'Access Control',          description: 'Granular permissions for public, club-only, and private content — you decide who sees what.',                   iconBg: 'bg-rose-500/15 border-rose-500/25',    iconColor: 'text-rose-400',    glow: 'rgba(244,63,94,0.10)'  },
];

export function FeaturesSection() {
  return (
    <section className="relative py-28 bg-[#0A0A0F] overflow-hidden">
      {/* Top separator glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)' }} />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          className="text-center mb-16">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/8 text-violet-400 text-xs font-semibold tracking-widest uppercase mb-5">
            Platform Features
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight font-display">
            Everything you need,{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
              nothing you don't
            </span>
          </h2>
          <p className="text-[#71717A] max-w-2xl mx-auto text-lg leading-relaxed">
            A complete suite of tools to organise, share, and discover event media — built for clubs and societies.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <motion.div key={feature.title}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: index * 0.08, duration: 0.55 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl border border-[#27272A] bg-[#161B22] overflow-hidden"
            >
              {/* Per-card glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(ellipse at top left, ${feature.glow}, transparent 65%)` }} />
              <div className="relative p-7">
                <div className={`w-11 h-11 rounded-xl border ${feature.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2.5 tracking-tight font-display">{feature.title}</h3>
                <p className="text-[#71717A] text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom separator glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)' }} />
    </section>
  );
}