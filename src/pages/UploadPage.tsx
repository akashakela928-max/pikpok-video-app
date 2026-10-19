import { useRef, useState } from 'react';
import { Upload, Film, X, Loader2, Check, Music2, Search, ChevronRight, Volume2 } from 'lucide-react';
import { insertVideo, uploadVideoFile, uploadCoverImage, generateThumbnail, blobUrlToBlob } from '@/lib/api';
import { getMyProfileId } from '@/lib/identity';
import { MUSIC_LIBRARY, type Song } from '@/lib/music';

interface UploadPageProps {
  onUploaded: () => void;
  onGoHome: () => void;
}

const SAMPLE_VIDEOS = [
  { url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', label: 'ForBigger Blazes' },
  { url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', label: 'ForBigger Escapes' },
  { url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', label: 'ForBigger Fun' },
  { url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', label: 'ForBigger Joyrides' },
  { url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', label: 'Elephants Dream' },
  { url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', label: 'Big Buck Bunny' },
];

const SAMPLE_COVERS = [
  'https://images.pexels.com/photos/8928887/pexels-photo-8928887.jpeg?auto=compress&cs=tinysrgb&h=400&w=225',
  'https://images.pexels.com/photos/17718741/pexels-photo-17718741.jpeg?auto=compress&cs=tinysrgb&h=400&w=225',
  'https://images.pexels.com/photos/30641513/pexels-photo-30641513.jpeg?auto=compress&cs=tinysrgb&h=400&w=225',
  'https://images.pexels.com/photos/39595895/pexels-photo-39595895.jpeg?auto=compress&cs=tinysrgb&h=400&w=225',
  'https://images.pexels.com/photos/8821332/pexels-photo-8821332.jpeg?auto=compress&cs=tinysrgb&h=400&w=225',
  'https://images.pexels.com/photos/11808109/pexels-photo-11808109.jpeg?auto=compress&cs=tinysrgb&h=400&w=225',
];

function songLabel(song: Song): string {
  return `${song.title} - ${song.artist}`;
}

export default function UploadPage({ onUploaded, onGoHome }: UploadPageProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [musicSearch, setMusicSearch] = useState('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file (MP4, MOV, or WEBM).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 50MB.`);
      return;
    }
    setSelectedFile(file);
    setSelectedUrl(URL.createObjectURL(file));
    setCoverUrl('');
    setError('');
  };

  const handleSelectSample = (url: string, idx: number) => {
    setSelectedFile(null);
    setSelectedUrl(url);
    setCoverUrl(SAMPLE_COVERS[idx] || '');
    setError('');
  };

  const previewSong = (song: Song) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (previewingId === song.id) {
      audio.pause();
      setPreviewingId(null);
      return;
    }
    audio.src = song.url;
    audio.play().catch(() => {});
    setPreviewingId(song.id);
  };

  const filteredSongs = MUSIC_LIBRARY.filter((s) => {
    const q = musicSearch.trim().toLowerCase();
    if (!q) return true;
    return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    const myId = getMyProfileId();
    if (!myId) {
      setError('Profile not loaded yet. Please try again.');
      return;
    }
    if (!selectedUrl) {
      setError('Please select or upload a video first.');
      return;
    }
    setUploading(true);
    setError('');
    setProgress(0);

    try {
      let finalVideoUrl = selectedUrl;
      let finalCoverUrl = coverUrl;

      // If it's a real file upload, send to Storage
      if (selectedFile) {
        setProgress(10);
        const uploadResult = await uploadVideoFile(selectedFile, myId);
        if ('error' in uploadResult) {
          setError(uploadResult.error);
          setUploading(false);
          setProgress(0);
          return;
        }
        finalVideoUrl = uploadResult.url;
        setProgress(50);

        // Auto-generate thumbnail from video first frame
        if (!coverUrl) {
          const thumbBlobUrl = await generateThumbnail(selectedUrl);
          if (thumbBlobUrl) {
            const thumbBlob = await blobUrlToBlob(thumbBlobUrl);
            if (thumbBlob) {
              const uploadedCover = await uploadCoverImage(thumbBlob, myId);
              if (uploadedCover) finalCoverUrl = uploadedCover;
              URL.revokeObjectURL(thumbBlobUrl);
            }
          }
        }
        setProgress(80);
      }

      const musicName = selectedSong ? songLabel(selectedSong) : 'Original Sound';

      const result = await insertVideo({
        user_id: myId,
        video_url: finalVideoUrl,
        cover_url: finalCoverUrl || '',
        caption: caption || 'New PikPok video!',
        music: musicName,
      });

      setProgress(100);
      setUploading(false);

      if (result.data) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSelectedFile(null);
          setSelectedUrl('');
          setCoverUrl('');
          setCaption('');
          setSelectedSong(null);
          setProgress(0);
          onUploaded();
          onGoHome();
        }, 1500);
      } else {
        setError(result.error || 'Failed to upload. Please try again.');
        setProgress(0);
      }
    } catch (err) {
      setError('Something went wrong during upload. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-black pb-[120px] pb-safe">
      <audio ref={audioRef} onEnded={() => setPreviewingId(null)} />

      <div className="px-4 py-4">
        <h1 className="text-white text-xl font-bold mb-4">Upload Video</h1>

        {/* Success overlay */}
        {success && (
          <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
              <Check size={32} className="text-white" />
            </div>
            <p className="text-white font-semibold text-lg">Posted!</p>
          </div>
        )}

        {/* Video preview / selection */}
        {selectedUrl ? (
          <div className="relative aspect-[9/14] max-h-[40vh] mx-auto rounded-xl overflow-hidden bg-zinc-900 mb-4">
            <video src={selectedUrl} controls loop className="w-full h-full object-cover" />
            <button
              onClick={() => {
                setSelectedFile(null);
                setSelectedUrl('');
                setCoverUrl('');
              }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
            >
              <X size={18} className="text-white" />
            </button>
            {selectedSong && (
              <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-2 flex items-center gap-2">
                <Music2 size={14} className="text-rose-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate leading-tight">{selectedSong.title}</p>
                  <p className="text-gray-300 text-[10px] truncate leading-tight">{selectedSong.artist}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[9/14] max-h-[35vh] mx-auto rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-white/30 hover:text-white transition-colors"
            >
              <Upload size={36} />
              <span className="text-sm">Tap to upload a video</span>
              <span className="text-xs text-gray-500">MP4, MOV, WEBM · Max 50MB</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Sample videos */}
        {!selectedUrl && (
          <div className="mb-4">
            <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
              <Film size={14} /> Or pick a sample video
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_VIDEOS.map((v, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSample(v.url, i)}
                  className="aspect-[9/14] rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center p-1 hover:border-rose-500/50 transition-colors"
                >
                  <span className="text-gray-400 text-[10px] text-center leading-tight">{v.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Caption */}
        <div className="mb-3">
          <label className="text-gray-400 text-xs block mb-1">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            rows={2}
            className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 outline-none border border-white/5 focus:border-white/20 resize-none placeholder-gray-500"
          />
        </div>

        {/* Music picker */}
        <div className="mb-3">
          <label className="text-gray-400 text-xs block mb-1">Music / Sound</label>
          <button
            onClick={() => setShowMusicPicker(true)}
            className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-3 outline-none border border-white/5 focus:border-white/20 flex items-center gap-2.5 hover:border-white/20 transition-colors"
          >
            <Music2 size={18} className={selectedSong ? 'text-rose-400' : 'text-gray-500'} />
            <span className={`flex-1 text-left truncate ${selectedSong ? 'text-white' : 'text-gray-500'}`}>
              {selectedSong ? songLabel(selectedSong) : 'Choose a trending song'}
            </span>
            <ChevronRight size={18} className="text-gray-500" />
          </button>
          {selectedSong && (
            <button
              onClick={() => setSelectedSong(null)}
              className="text-gray-500 text-xs mt-1.5 hover:text-rose-400"
            >
              Remove song
            </button>
          )}
        </div>

        {/* Cover URL — truly optional */}
        {selectedFile && (
          <div className="mb-4">
            <label className="text-gray-400 text-xs block mb-1">Cover image URL (optional — auto-generated if empty)</label>
            <input
              type="text"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 outline-none border border-white/5 focus:border-white/20 placeholder-gray-500"
            />
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-xs">Uploading...</span>
              <span className="text-white text-xs font-semibold">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && <p className="text-rose-400 text-sm mb-3">{error}</p>}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={uploading || !selectedUrl}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Uploading...
            </>
          ) : (
            'Post Video'
          )}
        </button>
      </div>

      {/* Music library modal */}
      {showMusicPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-white text-lg font-bold flex items-center gap-2">
                <Music2 size={20} className="text-rose-400" /> Trending Songs
              </h2>
              <button onClick={() => { setShowMusicPicker(false); setMusicSearch(''); }} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-3 py-2">
                <Search size={16} className="text-gray-500" />
                <input
                  type="text"
                  value={musicSearch}
                  onChange={(e) => setMusicSearch(e.target.value)}
                  placeholder="Search songs or artists..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2">
              {filteredSongs.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No songs match "{musicSearch}"</p>
              ) : (
                <div className="space-y-1">
                  {filteredSongs.map((song) => {
                    const isPreviewing = previewingId === song.id;
                    const isSelected = selectedSong?.id === song.id;
                    return (
                      <div
                        key={song.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                          isSelected ? 'bg-rose-500/15 border border-rose-500/30' : 'hover:bg-zinc-900 border border-transparent'
                        }`}
                      >
                        <button
                          onClick={() => previewSong(song)}
                          className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0"
                        >
                          <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                          <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Volume2 size={18} className={`text-white ${isPreviewing ? 'text-rose-400' : ''}`} />
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSong(song);
                            setShowMusicPicker(false);
                            setMusicSearch('');
                            if (audioRef.current) {
                              audioRef.current.pause();
                              setPreviewingId(null);
                            }
                          }}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="text-white text-sm font-semibold truncate">{song.title}</p>
                          <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                        </button>
                        {isSelected && <Check size={18} className="text-rose-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-white/10">
              <p className="text-gray-500 text-[11px] text-center">
                {MUSIC_LIBRARY.length} royalty-free tracks · Tap the speaker to preview
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
