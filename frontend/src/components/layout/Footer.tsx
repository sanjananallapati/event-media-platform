import Link from 'next/link';
import { Camera, Github, Twitter, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-secondary-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-400">
              <Camera className="w-6 h-6" />
              EventMedia
            </Link>
            <p className="mt-4 text-secondary-400 text-sm">
              Centralized event media management for clubs and societies.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-secondary-400 text-sm">
              <li><Link href="/events" className="hover:text-white">Events</Link></li>
              <li><Link href="/explore" className="hover:text-white">Explore</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-secondary-400 text-sm">
              <li>Face Recognition</li>
              <li>AI Auto-Tagging</li>
              <li>Watermarked Downloads</li>
              <li>Real-time Updates</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="text-secondary-400 hover:text-white">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-secondary-400 hover:text-white">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-secondary-400 hover:text-white">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-secondary-800 text-center text-secondary-500 text-sm">
          <p>© {new Date().getFullYear()} EventMedia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
