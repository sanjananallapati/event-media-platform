'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  Heart,
  MessageCircle,
  Download,
  Share2,
  Bookmark,
  ArrowLeft,
  Send,
  Tag,
  Eye,
  Calendar,
  User,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function MediaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [media, setMedia] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [favourited, setFavourited] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchMedia();
  }, [id]);

  const fetchMedia = async () => {
    try {
      const response = await api.get(`/media/${id}`);
      const data = response.data.data;
      setMedia(data);
      setLiked(data.likes && data.likes.length > 0);
      setFavourited(data.favourites && data.favourites.length > 0);
      setLikeCount(data._count?.likes || 0);
    } catch (error) {
      toast.error('Media not found');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await api.post(`/media/${id}/like`);
      setLiked(response.data.data.liked);
      setLikeCount(response.data.data.count);
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const handleFavourite = async () => {
    try {
      const response = await api.post(`/media/${id}/favourite`);
      setFavourited(response.data.data.favourited);
      toast.success(response.data.data.favourited ? 'Added to favourites' : 'Removed from favourites');
    } catch (error) {
      toast.error('Failed to update favourites');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setCommenting(true);
    try {
      await api.post(`/media/${id}/comments`, { content: comment });
      setComment('');
      fetchMedia();
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const handleDownload = async () => {
    try {
      window.open(`${process.env.NEXT_PUBLIC_API_URL}/media/${id}/download`, '_blank');
      toast.success('Download started');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await api.post(`/media/${id}/share`, { platform: 'link' });
      if (navigator.share) {
        await navigator.share({ title: media?.caption || 'Check this out', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
      }
    } catch {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this media?')) return;
    try {
      await api.delete(`/media/${id}`);
      toast.success('Media deleted');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!media) return null;

  const isOwner = user?.userId === media.uploaderId || user?.role === 'ADMIN';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-secondary-500 hover:text-secondary-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:col-span-2 card overflow-hidden"
        >
          {media.type === 'IMAGE' ? (
            <img
              src={media.url}
              alt={media.caption || media.originalName}
              className="w-full max-h-[70vh] object-contain bg-black"
            />
          ) : (
            <video src={media.url} controls className="w-full max-h-[70vh]" />
          )}

          <div className="p-4 flex items-center justify-between border-t">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 transition-colors ${
                  liked ? 'text-red-500' : 'text-secondary-500 hover:text-red-500'
                }`}
              >
                <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
                <span className="text-sm">{likeCount}</span>
              </button>
              <div className="flex items-center gap-1 text-secondary-500">
                <MessageCircle className="w-6 h-6" />
                <span className="text-sm">{media._count?.comments || 0}</span>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 text-secondary-500 hover:text-primary-500"
              >
                <Download className="w-6 h-6" />
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-secondary-500 hover:text-primary-500"
              >
                <Share2 className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFavourite}
                className={`transition-colors ${
                  favourited ? 'text-amber-500' : 'text-secondary-500 hover:text-amber-500'
                }`}
              >
                <Bookmark className={`w-6 h-6 ${favourited ? 'fill-current' : ''}`} />
              </button>
              {isOwner && (
                <button onClick={handleDelete} className="text-secondary-500 hover:text-red-500">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                {media.uploader?.avatar ? (
                  <img src={media.uploader.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary-600" />
                )}
              </div>
              <div>
                <p className="font-medium">{media.uploader?.fullName}</p>
                <p className="text-sm text-secondary-500">@{media.uploader?.username}</p>
              </div>
            </div>
          </div>

          <div className="card p-4 space-y-3">
            {media.caption && <p className="text-sm">{media.caption}</p>}
            {media.aiCaption && (
          <div className="p-4 rounded-xl border border-primary-500/30 bg-primary-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-5 h-5 text-primary-400" />
              <h3 className="font-semibold text-white">
                AI Description
              </h3>
            </div>

            <p className="text-sm md:text-base text-gray-200 leading-relaxed">
              {media.aiCaption}
            </p>
          </div>
        )}
            <div className="flex flex-wrap gap-1">
              {media.aiTags?.map((tag: any) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 rounded-full text-xs bg-secondary-100 dark:bg-secondary-700"
                >
                  {tag.name}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-secondary-500 pt-2 border-t">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {media.viewCount} views
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {format(new Date(media.createdAt), 'MMM dd, yyyy')}
              </span>
            </div>
            {media.event && (
              <div className="pt-2 border-t">
                <p className="text-xs text-secondary-500">Event</p>
                <p className="text-sm font-medium">{media.event.name}</p>
              </div>
            )}
          </div>

          {media.userTags && media.userTags.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-medium mb-2">Tagged People</h3>
              <div className="space-y-2">
                {media.userTags.map((tag: any) => (
                  <div key={tag.id} className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-secondary-200 flex items-center justify-center overflow-hidden">
                      {tag.taggedUser?.avatar ? (
                        <img src={tag.taggedUser.avatar} alt="" className="w-6 h-6 object-cover" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                    </div>
                    <span>{tag.taggedUser?.fullName || tag.taggedUser?.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4">
            <h3 className="text-sm font-medium mb-3">Comments</h3>
            {user && (
              <form onSubmit={handleComment} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="input flex-1 text-sm"
                />
                <button
                  type="submit"
                  disabled={commenting || !comment.trim()}
                  className="btn-primary px-3"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {media.comments?.map((c: any) => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {c.user?.avatar ? (
                      <img src={c.user.avatar} alt="" className="w-8 h-8 object-cover" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{c.user?.username}</span>{' '}
                      {c.content}
                    </p>
                    <p className="text-xs text-secondary-400 mt-0.5">
                      {format(new Date(c.createdAt), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
              {(!media.comments || media.comments.length === 0) && (
                <p className="text-sm text-secondary-500 text-center py-4">No comments yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
