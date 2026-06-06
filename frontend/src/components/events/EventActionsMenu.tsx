'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Pencil, Trash2, FolderOpen, FolderX } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EditEventModal } from './EditEventModal';
import toast from 'react-hot-toast';

interface EventActionsMenuProps {
  event: any;
  onRefresh: () => void;
  /** called after a delete so the parent can navigate away */
  afterDelete?: () => void;
}

export function EventActionsMenu({ event, onRefresh, afterDelete }: EventActionsMenuProps) {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [open,           setOpen]           = useState(false);
  const [showEdit,       setShowEdit]       = useState(false);
  const [showDelEvent,   setShowDelEvent]   = useState(false);
  const [showDelAlbum,   setShowDelAlbum]   = useState(false);
  const [deletingEvent,  setDeletingEvent]  = useState(false);
  const [deletingAlbum,  setDeletingAlbum]  = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.id === event.createdById;
  const isAdmin = user?.role === 'ADMIN';
  const canManage = isOwner || isAdmin;

  // Find the first album linked to this event (if any)
  const firstAlbum = event.albums?.[0] ?? null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!canManage) return null;

  const handleDeleteEvent = async () => {
    setDeletingEvent(true);
    try {
      await api.delete(`/events/${event.id}`);
      toast.success('Event deleted successfully');
      setShowDelEvent(false);
      if (afterDelete) afterDelete();
      else onRefresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete event');
    } finally {
      setDeletingEvent(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!firstAlbum) return;
    setDeletingAlbum(true);
    try {
      await api.delete(`/albums/${firstAlbum.id}`);
      toast.success('Album deleted successfully');
      setShowDelAlbum(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete album');
    } finally {
      setDeletingAlbum(false);
    }
  };

  const menuItems = [
    {
      label:  'Edit Event',
      icon:   <Pencil className="w-4 h-4" />,
      action: () => { setOpen(false); setShowEdit(true); },
    },
    {
      label:  'Delete Event',
      icon:   <Trash2 className="w-4 h-4" />,
      danger: true,
      action: () => { setOpen(false); setShowDelEvent(true); },
    },
    ...(firstAlbum
      ? [
          {
            label:  'View Album',
            icon:   <FolderOpen className="w-4 h-4" />,
            action: () => { setOpen(false); router.push(`/dashboard/events/${event.slug}#albums`); },
          },
          {
            label:  'Delete Album',
            icon:   <FolderX className="w-4 h-4" />,
            danger: true,
            action: () => { setOpen(false); setShowDelAlbum(true); },
          },
        ]
      : []),
  ];

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((o) => !o); }}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-[#71717a] hover:text-white hover:bg-[#27272A] transition-colors"
          title="Event actions"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-[#27272A] bg-[#161B22] shadow-xl overflow-hidden"
            >
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); item.action(); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    item.danger
                      ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                      : 'text-[#a1a1aa] hover:bg-[#1C2230] hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <EditEventModal
            event={event}
            onClose={() => setShowEdit(false)}
            onUpdated={() => { setShowEdit(false); onRefresh(); }}
          />
        )}
      </AnimatePresence>

      {/* Delete Event Confirm */}
      <AnimatePresence>
        {showDelEvent && (
          <ConfirmDialog
            title="Delete Event"
            message={`Are you sure you want to permanently delete "${event.name}"? All associated media and albums will also be deleted. This action cannot be undone.`}
            confirmText="Delete Event"
            loading={deletingEvent}
            onConfirm={handleDeleteEvent}
            onCancel={() => setShowDelEvent(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete Album Confirm */}
      <AnimatePresence>
        {showDelAlbum && firstAlbum && (
          <ConfirmDialog
            title="Delete Album"
            message={`Are you sure you want to permanently delete the album "${firstAlbum.name}"? All media inside will be removed. This action cannot be undone.`}
            confirmText="Delete Album"
            loading={deletingAlbum}
            onConfirm={handleDeleteAlbum}
            onCancel={() => setShowDelAlbum(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
