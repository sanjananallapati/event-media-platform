'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { X, ImageIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditEventModalProps {
  event: any;
  onClose: () => void;
  onUpdated: () => void;
}

const CATEGORIES = [
  { value: 'PHOTOSHOOT',    label: 'Photoshoot' },
  { value: 'WORKSHOP',      label: 'Workshop' },
  { value: 'TRIP',          label: 'Trip' },
  { value: 'COMPETITION',   label: 'Competition' },
  { value: 'CULTURAL_FEST', label: 'Cultural Fest' },
  { value: 'PARTY',         label: 'Party' },
  { value: 'SPORTS',        label: 'Sports' },
  { value: 'SEMINAR',       label: 'Seminar' },
  { value: 'OTHER',         label: 'Other' },
];

function toLocalDatetimeValue(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditEventModal({ event, onClose, onUpdated }: EditEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name:        event.name        || '',
    description: event.description || '',
    albumName:   event.albumName   || '',
    category:    event.category    || 'OTHER',
    accessLevel: event.accessLevel || 'PUBLIC',
    startDate:   toLocalDatetimeValue(event.startDate),
    endDate:     toLocalDatetimeValue(event.endDate),
    location:    event.location    || '',
    clubName:    event.clubName    || '',
  });
  const [coverFile, setCoverFile]     = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(event.coverImage || null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCoverFile(file);
    if (file) setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Event name is required'); return; }
    if (!formData.startDate)   { toast.error('Start date is required'); return; }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (coverFile) data.append('cover', coverFile);

      await api.put(`/events/${event.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Event updated successfully!');
      onUpdated();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-[#27272A] bg-[#0D1117] shadow-2xl"
        style={{ boxShadow: '0 0 60px rgba(124,58,237,0.15)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Event</h2>
            <p className="text-xs text-[#71717a] mt-0.5">Update event details</p>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272A] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#a1a1aa]">Event Name <span className="text-violet-400">*</span></label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Annual Photography Workshop" className="input" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#a1a1aa]">Album Name</label>
            <input type="text" name="albumName" value={formData.albumName} onChange={handleChange} placeholder="e.g. Workshop 2026 – Day 1" className="input" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#a1a1aa]">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe the event..." className="input resize-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#a1a1aa]">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="input">
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#a1a1aa]">Access Level</label>
              <select name="accessLevel" value={formData.accessLevel} onChange={handleChange} className="input">
                <option value="PUBLIC">Public</option>
                <option value="CLUB_ONLY">Club Only</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#a1a1aa]">Start Date <span className="text-violet-400">*</span></label>
              <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} required className="input [color-scheme:dark]" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#a1a1aa]">End Date</label>
              <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} className="input [color-scheme:dark]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#a1a1aa]">Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Main Auditorium" className="input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#a1a1aa]">Club / Society</label>
              <input type="text" name="clubName" value={formData.clubName} onChange={handleChange} placeholder="Photography Club" className="input" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#a1a1aa]">Cover Image</label>
            <label className="relative flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-[#27272A] bg-[#161B22] cursor-pointer hover:border-violet-500/60 hover:bg-[#1a1f2a] transition-all duration-200 overflow-hidden group">
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <ImageIcon className="w-6 h-6 text-white" />
                    <span className="text-xs text-white font-medium">{coverFile?.name || 'Current cover'}</span>
                    <span className="text-[10px] text-[#a1a1aa]">Click to change</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#52525b] group-hover:text-[#a1a1aa] transition-colors">
                  <Upload className="w-7 h-7" />
                  <span className="text-sm">Click to upload cover image</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </label>
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-[#27272A] flex items-center gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
