'use client';

import { motion } from 'framer-motion';
import { Camera, Users, Calendar, Heart } from 'lucide-react';

const stats = [
  { icon: Camera, value: '50K+', label: 'Photos Uploaded', color: 'text-blue-500' },
  { icon: Users, value: '5K+', label: 'Active Users', color: 'text-green-500' },
  { icon: Calendar, value: '1K+', label: 'Events Created', color: 'text-purple-500' },
  { icon: Heart, value: '100K+', label: 'Likes Given', color: 'text-red-500' },
];

export function StatsSection() {
  return (
    <section className="py-20 bg-primary-600">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center text-white"
            >
              <stat.icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
              <p className="text-3xl md:text-4xl font-bold">{stat.value}</p>
              <p className="text-primary-100 text-sm mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
