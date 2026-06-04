import Link from 'next/link';
import { Camera, Github, Twitter, Mail, Linkedin } from 'lucide-react';

const navLinks = {
  Platform: [
    { label: 'Events', href: '/events' },
    { label: 'Explore', href: '/explore' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Upload Media', href: '/dashboard/upload' },
  ],
  Features: [
    { label: 'Face Recognition', href: '#' },
    { label: 'AI Auto-Tagging', href: '#' },
    { label: 'Watermarked Downloads', href: '#' },
    { label: 'Real-time Updates', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="relative bg-[#0D1117] border-t border-[#27272A] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)' }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.06), transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-8">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center group-hover:bg-violet-600/30 transition-colors">
                <Camera className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-white font-semibold text-lg tracking-tight font-display">
                Event<span className="text-violet-400">Media</span>
              </span>
            </Link>
            <p className="text-[#71717A] text-sm leading-relaxed mb-6 max-w-xs">
              The all-in-one platform for clubs and societies to manage, share, and discover event media with AI-powered tools.
            </p>
            <div className="flex items-center gap-2">
              {[{ Icon: Github, label: 'GitHub' }, { Icon: Twitter, label: 'Twitter' }, { Icon: Linkedin, label: 'LinkedIn' }, { Icon: Mail, label: 'Email' }].map(({ Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-9 h-9 rounded-lg border border-[#27272A] flex items-center justify-center text-[#52525b] hover:text-white hover:border-[#3f3f46] hover:bg-white/5 transition-all duration-200">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(navLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-4 tracking-wide font-display">{category}</h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}><Link href={href} className="text-[#71717A] text-sm hover:text-white transition-colors duration-200">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div className="relative rounded-2xl border border-violet-500/20 bg-violet-500/5 p-8 mb-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{ background: 'radial-gradient(ellipse at right, rgba(124,58,237,0.08), transparent 60%)' }} />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-xl mb-1 font-display">Ready to capture your events?</h3>
              <p className="text-[#71717A] text-sm">Join thousands of clubs already using EventMedia. Free to get started.</p>
            </div>
            <Link href="/register"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-500 transition-all duration-200 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]">
              Get Started Free
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[#27272A]">
          <p className="text-[#52525b] text-xs">© {new Date().getFullYear()} EventMedia. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(t => (
              <Link key={t} href="#" className="text-[#52525b] hover:text-[#A1A1AA] text-xs transition-colors">{t}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}