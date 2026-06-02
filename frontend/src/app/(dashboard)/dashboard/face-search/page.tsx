'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { MediaGrid } from '@/components/media/MediaGrid';
import { Camera, Upload, Search, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FaceSearchPage() {
  const { user } = useAuthStore();
  const [myPhotos, setMyPhotos] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selfieUploading, setSelfieUploading] = useState(false);
  const [searchMode, setSearchMode] = useState<'my-photos' | 'search'>('my-photos');
  const [hasIndexedFace, setHasIndexedFace] = useState(false);

  useEffect(() => {
    checkFaceStatus();
  }, []);

  useEffect(() => {
    if (searchMode === 'my-photos' && hasIndexedFace) {
      fetchMyPhotos();
    }
  }, [searchMode, hasIndexedFace]);

  const checkFaceStatus = async () => {
    try {
      const response = await api.get('/auth/me');
      setHasIndexedFace(response.data.data?.rekognitionIndexed || false);
    } catch {}
  };

  const fetchMyPhotos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/face/my-photos');
      setMyPhotos(response.data.data?.photos || []);
    } catch (error) {
      toast.error('Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  };

  const onSelfieDropped = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setSelfieUploading(true);
    const formData = new FormData();
    formData.append('selfie', files[0]);

    try {
      const response = await api.post('/users/selfie', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(response.data.data?.message || 'Selfie uploaded!');
      setHasIndexedFace(response.data.data?.indexed || false);
      if (response.data.data?.indexed) {
        fetchMyPhotos();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Upload failed');
    } finally {
      setSelfieUploading(false);
    }
  }, []);

  const onSearchImageDropped = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', files[0]);

    try {
      const response = await api.post('/face/search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSearchResults(response.data.data?.photos || []);
      if (response.data.data?.photos?.length === 0) {
        toast('No matching faces found');
      } else {
        toast.success(`Found ${response.data.data?.photos?.length} matching photos`);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    getRootProps: getSelfieRootProps,
    getInputProps: getSelfieInputProps,
    isDragActive: isSelfieActive,
  } = useDropzone({
    onDrop: onSelfieDropped,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const {
    getRootProps: getSearchRootProps,
    getInputProps: getSearchInputProps,
    isDragActive: isSearchActive,
  } = useDropzone({
    onDrop: onSearchImageDropped,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Face Recognition Search</h1>
        <p className="text-secondary-500">Find photos of yourself or search by face</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSearchMode('my-photos')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            searchMode === 'my-photos' ? 'bg-primary-600 text-white' : 'btn-secondary'
          }`}
        >
          <Camera className="w-4 h-4 inline mr-2" />
          Find My Photos
        </button>
        <button
          onClick={() => setSearchMode('search')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            searchMode === 'search' ? 'bg-primary-600 text-white' : 'btn-secondary'
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
          Search by Image
        </button>
      </div>

      {searchMode === 'my-photos' && (
        <>
          {/* Selfie Upload Section */}
          {!hasIndexedFace && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Upload a Selfie to Enable Face Recognition</h3>
                  <p className="text-sm text-secondary-500 mt-1">
                    We'll use your selfie to find photos where you appear. Your face data is securely stored.
                  </p>
                  <div
                    {...getSelfieRootProps()}
                    className={`mt-4 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                      isSelfieActive
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                        : 'border-secondary-300 hover:border-primary-400'
                    }`}
                  >
                    <input {...getSelfieInputProps()} />
                    {selfieUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-secondary-400 mb-2" />
                        <p className="text-sm">
                          {isSelfieActive ? 'Drop your selfie here' : 'Drop a clear selfie or click to select'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {hasIndexedFace && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-4 flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Face recognition is enabled! Showing photos where you appear.
              </p>
            </motion.div>
          )}

          {/* My Photos Grid */}
          {hasIndexedFace && (
            <div>
              <h2 className="text-lg font-medium mb-4">Photos of You ({myPhotos.length})</h2>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : myPhotos.length > 0 ? (
                <MediaGrid media={myPhotos} />
              ) : (
                <div className="card p-12 text-center">
                  <Camera className="w-12 h-12 mx-auto text-secondary-400 mb-4" />
                  <h3 className="font-medium">No photos found yet</h3>
                  <p className="text-sm text-secondary-500 mt-1">
                    We haven't found any photos with your face. Check back after more photos are uploaded!
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {searchMode === 'search' && (
        <>
          {/* Search Image Upload */}
          <div className="card p-6">
            <h3 className="font-medium mb-4">Upload an image to search for matching faces</h3>
            <div
              {...getSearchRootProps()}
              className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                isSearchActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                  : 'border-secondary-300 hover:border-primary-400'
              }`}
            >
              <input {...getSearchInputProps()} />
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  Searching...
                </div>
              ) : (
                <>
                  <Search className="w-10 h-10 mx-auto text-secondary-400 mb-3" />
                  <p>{isSearchActive ? 'Drop the image here' : 'Drop an image or click to select'}</p>
                  <p className="text-sm text-secondary-500 mt-1">
                    We'll find photos containing faces from your uploaded image
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <h2 className="text-lg font-medium mb-4">Search Results ({searchResults.length})</h2>
              <MediaGrid media={searchResults} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
