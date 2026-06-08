'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Camera, Users, Calendar, Heart } from 'lucide-react';

const stats = [
  { icon: Camera,   value: 50,  suffix: 'K+', label: 'Photos Uploaded', sub: 'Across all events',       iconBg: 'bg-blue-500/15 border-blue-500/20',    iconColor: 'text-blue-400' },
  { icon: Users,    value: 5,   suffix: 'K+', label: 'Active Members',  sub: 'In clubs & societies',    iconBg: 'bg-emerald-500/15 border-emerald-500/20', iconColor: 'text-emerald-400' },
  { icon: Calendar, value: 1,   suffix: 'K+', label: 'Events Created',  sub: 'And still growing',       iconBg: 'bg-violet-500/15 border-violet-500/20', iconColor: 'text-violet-400' },
  { icon: Heart,    value: 100, suffix: 'K+', label: 'Reactions Given', sub: 'Community engagement',    iconBg: 'bg-rose-500/15 border-rose-500/20',     iconColor: 'text-rose-400' },
];

function useCountUp(target: number, duration = 1800, trigger = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let val = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      val += step;
      if (val >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(val));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, trigger]);
  return count;
}

function StatCard({ stat, index }: { stat: typeof stats[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const count = useCountUp(stat.value, 1600, inView);
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }} transition={{ delay: index * 0.1, duration: 0.55 }}
      className="group relative rounded-2xl border border-[#27272A] bg-[#161B22] p-8 text-center overflow-hidden hover:border-[#3f3f46] transition-all duration-300"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.06), transparent 70%)' }} />
      <div className={`w-12 h-12 rounded-xl border ${stat.iconBg} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
        <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
      </div>
      <p className="text-4xl md:text-5xl font-extrabold mb-1.5 text-transparent bg-clip-text font-display"
        style={{ backgroundImage: 'linear-gradient(135deg, #c4b5fd, #7c3aed)' }}>
        {count}{stat.suffix}
      </p>
      <p className="text-white font-semibold text-sm mb-1">{stat.label}</p>
      <p className="text-[#52525b] text-xs">{stat.sub}</p>
    </motion.div>
  );
}

export function StatsSection() {
  return (
    <section className="relative py-28 bg-[#0A0A0F] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(124,58,237,0.07) 0%, transparent 65%)' }} />
      <div className="absolute inset-0 dot-pattern opacity-25" />
      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }} className="text-center mb-14">
          <span
            className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-5"
            style={{
              background: 'rgba(109,40,217,0.11)',
              border: '1px solid rgba(167,139,250,0.26)',
              color: '#c4b5fd',
              boxShadow: '0 0 18px rgba(109,40,217,0.16)',
            }}
          >
            By the Numbers
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight font-display">
            Trusted by{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>thousands</span>
            {' '}of members
          </h2>
          <p className="text-[#6B6B85] mt-3 max-w-xl mx-auto">Real numbers from a growing community of clubs and event organisers.</p>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => <StatCard key={stat.label} stat={stat} index={i} />)}
        </div>
      </div>
    </section>
  );
}