import { useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, Share2, Music2, Play, Gift, User, Link2, Check } from 'lucide-react';
import type { Video } from '@/lib/types';
import { toggleLike, incrementViews, formatCount } from '@/lib/api';
import { getMyProfileId } from '@/lib/api';

interface VideoCardProps {
  video: Video;
  index: number;
  currentIndex: number;
  onOpenComments: (video: Video) => void;
  onOpenProfile: (userId: string) => void;
  onOpenGifts: (video: Video) => void;
  likedOverride?: boolean;
  likeCountOverride?: number;
}

export default function VideoCard({
  video,
  index,
  currentIndex,
  onOpenComments,
  onOpenProfile,
  onOpenGifts,
  likedOverride,
  likeCountOverride,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [liked, setLiked] = useState(likedOverride ?? video.liked_by_me ?? false);
  const [likeCount, setLikeCount] = useState(likeCountOverride ?? video.like_count ?? 0);
  const [viewIncremented, setViewIncremented] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Only mount the <video src> for the current card or the next one (preload 1 ahead).
  const distance = Math.abs(index - currentIndex);
  const shouldLoadSrc = distance <= 1;
  const isCurrent = index === currentIndex;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const v = videoRef.current;
        if (!v) return;
        if (entry.intersectionRatio >= 0.6) {
          v.play().then(() => setIsPlaying(true)).catch(() => {});
          if (!viewIncremented) {
            incrementViews(video.id);
            setViewIncremented(true);
          }
        } else {
          v.pause();
          setIsPlaying(false);
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [video.id, viewIncremented]);

  // Keep playback in sync with the active index: only the current card plays.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isCurrent) {
      v.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }, [isCurrent]);

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleLike = async () => {
    const myId = getMyProfileId();
    if (!myId) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    await toggleLike(video.id, wasLiked);
  };

  const handleShare = async () => {
    const shareUrl = video.video_url;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PikPok', text: video.caption, url: shareUrl });
        return;
      } catch { /* user cancelled — fall through to copy */ }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full snap-start snap-always overflow-hidden bg-black flex items-center justify-center"
    >
      {/* Low-quality poster shows immediately, video src loads lazily */}
      <img
        src={video.cover_url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: loaded ? 'none' : 'blur(6px)', transform: 'scale(1.04)' }}
      />
      {shouldLoadSrc && (
        <video
          ref={videoRef}
          src={video.video_url}
          poster={video.cover_url}
          loop
          muted
          playsInline
          autoPlay={isCurrent}
          preload={distance === 0 ? 'auto' : 'metadata'}
          onLoadedData={() => setLoaded(true)}
          onClick={handlePlayPause}
          className="relative h-full w-full object-cover"
        />
      )}

      {!isPlaying && isCurrent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Play size={64} className="text-white/70" fill="white" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {/* Right action bar */}
      <div className="absolute right-2 bottom-24 flex flex-col items-center gap-3.5 z-20">
        <button
          onClick={() => onOpenProfile(video.user_id)}
          className="relative mb-1"
          aria-label="View profile"
        >
          <span className="w-11 h-11 rounded-full border-2 border-white overflow-hidden bg-zinc-800 flex items-center justify-center">
            {video.profile?.avatar_url ? (
              <img
                src={video.profile.avatar_url}
                alt={video.profile?.display_name || 'Creator'}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={18} className="text-white/70" />
            )}
          </span>
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center leading-none font-bold">
            +
          </span>
        </button>

        <button onClick={handleLike} className="flex flex-col items-center gap-1 transition-transform active:scale-90">
          <Heart
            size={34}
            strokeWidth={2}
            className={liked ? 'text-rose-500' : 'text-white'}
            fill={liked ? 'currentColor' : 'white'}
            fillOpacity={liked ? 1 : 0.25}
          />
          <span className="text-white text-xs font-semibold">{formatCount(likeCount)}</span>
        </button>

        <button onClick={() => onOpenComments(video)} className="flex flex-col items-center gap-1 transition-transform active:scale-90">
          <MessageCircle size={34} className="text-white" fill="white" fillOpacity={0.9} />
          <span className="text-white text-xs font-semibold">{formatCount(video.comment_count ?? 0)}</span>
        </button>

        {/* Gift button */}
        <button onClick={() => onOpenGifts(video)} className="flex flex-col items-center gap-1 transition-transform active:scale-90">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Gift size={20} className="text-white" />
          </div>
          <span className="text-white text-xs font-semibold">{formatCount(video.gift_count ?? 0)}</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1 transition-transform active:scale-90">
          {linkCopied ? (
            <Check size={32} className="text-emerald-400" />
          ) : (
            <Share2 size={32} className="text-white" />
          )}
          <span className="text-white text-xs font-semibold">{linkCopied ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {/* Bottom-left info */}
      <div className="absolute left-3 right-20 bottom-24 z-20">
        <button
          onClick={() => onOpenProfile(video.user_id)}
          className="flex items-center gap-2 mb-1 group"
        >
          <span className="w-9 h-9 rounded-full border-2 border-white/80 overflow-hidden bg-zinc-800 shrink-0">
            {video.profile?.avatar_url ? (
              <img
                src={video.profile.avatar_url}
                alt={video.profile?.display_name || 'Creator'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="w-full h-full flex items-center justify-center">
                <User size={18} className="text-white/70" />
              </span>
            )}
          </span>
          <span className="text-white font-bold text-base group-hover:opacity-80 transition-opacity">
            @{video.profile?.username}
          </span>
        </button>
        <p className="text-white text-sm leading-snug mb-2 line-clamp-3">{video.caption}</p>
        {video.music && (
          <div className="flex items-center gap-1.5 text-white/90 text-xs overflow-hidden">
            <Music2 size={14} className="shrink-0 animate-[spin_3s_linear_infinite]" />
            <span className="truncate">{video.music}</span>
          </div>
        )}
      </div>
    </div>
  );
}
