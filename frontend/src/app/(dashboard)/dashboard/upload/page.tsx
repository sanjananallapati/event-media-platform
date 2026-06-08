'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Upload, X, Check, Image as ImageIcon, Film, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eventId, setEventId] = useState('');
  const [accessLevel, setAccessLevel] = useState('PUBLIC');
  const [caption, setCaption] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events', { params: { limit: 50 } });
      setEvents(res.data.data || []);
    } catch {}
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi'],
    },
    maxSize: 100 * 1024 * 1024,
    multiple: true,
    maxFiles: 50,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadResults([]);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (eventId) formData.append('eventId', eventId);
    formData.append('accessLevel', accessLevel);
    if (caption) formData.append('caption', caption);

    try {
      const response = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(pct);
        },
      });

      setUploadResults(response.data.data);
      setFiles([]);
      toast.success(`${response.data.data.length} file(s) uploaded successfully!`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Media</h1>
        <p className="text-secondary-500">Upload photos and videos to events and albums</p>
      </div>

      {/* Options */}
      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event (optional)</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="input"
            >
              <option value="">No Event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Access Level</label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="input"
            >
              <option value="PUBLIC">Public</option>
              <option value="CLUB_ONLY">Club Only</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Caption (optional)</label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption for all files..."
            className="input"
          />
        </div>
      </div>

      {/* Dropzone */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card overflow-hidden"
      >
        <div
          {...getRootProps()}
          className={`p-12 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-center
            ${isDragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
              : 'border-secondary-300 dark:border-secondary-600 hover:border-primary-400'
            }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto text-secondary-400 mb-4" />
          <p className="text-lg font-medium">
            {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
          </p>
          <p className="text-sm text-secondary-500 mt-2">
            Supports: JPEG, PNG, WebP, GIF, MP4, WebM, MOV • Max 100MB per file • Up to 50 files
          </p>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">{files.length} file(s) selected</h3>
              <button
                onClick={() => setFiles([])}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-secondary-50 dark:bg-secondary-700"
                >
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <Film className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  )}
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-secondary-500">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Upload Button */}
            <div className="mt-4">
              {uploading && (
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-secondary-200 dark:bg-secondary-600 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary w-full py-3"
              >
                {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Results */}
      <AnimatePresence>
        {uploadResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Check className="w-5 h-5 text-green-500" />
              <h3 className="font-medium">Successfully uploaded {uploadResults.length} file(s)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {uploadResults.map((result) => (
                <div key={result.id} className="relative aspect-square rounded-lg overflow-hidden">
                  <img
                    src={result.thumbnailUrl || result.url}
                    alt={result.originalName}
                    className="w-full h-full object-cover"
                  />
                  {result.aiTags && result.aiTags.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                      <p className="text-[10px] text-white truncate">
                        AI: {result.aiTags.map((t: any) => t.name).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
