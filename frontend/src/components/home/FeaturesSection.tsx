'use client';

import { motion } from 'framer-motion';
import { Scan, Tag, Download, Bell, Cloud, Shield } from 'lucide-react';

const features = [
  {
    icon: Scan,
    title: 'Face Recognition',
    description: 'Find photos of yourself automatically using advanced AI face detection.',
    color: 'bg-blue-500',
  },
  {
    icon: Tag,
    title: 'AI Auto-Tagging',
    description: 'Photos are automatically tagged with relevant keywords using AWS Rekognition.',
    color: 'bg-purple-500',
  },
  {
    icon: Download,
    title: 'Watermarked Downloads',
    description: 'Download high-quality images with automatic club branding watermarks.',
    color: 'bg-green-500',
  },
  {
    icon: Bell,
    title: 'Real-time Notifications',
    description: 'Get instant updates when new photos are uploaded or you get tagged.',
    color: 'bg-amber-500',
  },
  {
    icon: Cloud,
    title: 'Secure Cloud Storage',
    description: 'All media securely stored on AWS S3 with automatic backups.',
    color: 'bg-cyan-500',
  },
  {
    icon: Shield,
    title: 'Access Control',
    description: 'Granular permissions for public, club-only, and private content.',
    color: 'bg-rose-500',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-white dark:bg-secondary-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Features for Event Management
          </h2>
          <p className="text-secondary-500 max-w-2xl mx-auto">
            Everything you need to organize, share, and discover event photos in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card p-6 hover:shadow-lg transition-shadow"
            >
              <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-secondary-500 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
