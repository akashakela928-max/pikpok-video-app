import { useEffect, useState, useCallback, useRef } from 'react';
import VideoCard from '@/components/VideoCard';
import AdCard from '@/components/AdCard';
import CommentsDrawer from '@/components/CommentsDrawer';
import type { Video, FeedItem } from '@/lib/types';
import { fetchVideos, fetchAds, buildFeed } from '@/lib/api';

interface HomePageProps {
  onOpenProfile: (userId: string) => void;
  onOpenGifts: (video: Video) => void;
  onGiftSent: () => void;
}

const PAGE_SIZE = 3;

export default function HomePage({ onOpenProfile, onOpenGifts }: HomePageProps) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [commentVideo, setCommentVideo] = useState<Video | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setFeed([]);
    setHasMore(true);
    Promise.all([fetchVideos(PAGE_SIZE, 0), fetchAds()]).then(([videos, ads]) => {
      setFeed(buildFeed(videos, ads));
      setHasMore(videos.length === PAGE_SIZE);
      setLoading(false);
    });
  }, [refreshKey]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    const videoCount = feed.filter((f) => f.type === 'video').length;
    fetchVideos(PAGE_SIZE, videoCount).then((moreVideos) => {
      if (moreVideos.length === 0) {
        setHasMore(false);
      } else {
        fetchAds().then((ads) => {
          setFeed((prev) => [...prev, ...buildFeed(moreVideos, ads)]);
        });
      }
      setHasMore(moreVideos.length === PAGE_SIZE);
      setLoadingMore(false);
    });
  }, [feed, loadingMore, hasMore, loading]);

  // Track which video card is centered in the feed via scroll position.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const idx = Math.round(el.scrollTop / el.clientHeight);
        setCurrentIndex(idx);
        // Load more when near the end
        if (idx >= feed.length - 2 && hasMore && !loadingMore) {
          loadMore();
        }
        ticking = false;
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [loading, feed.length, hasMore, loadingMore, loadMore]);

  const handleOpenComments = useCallback((video: Video) => {
    setCommentVideo(video);
  }, []);

  if (loading) {
    return (
      <div className="h-full bg-black flex flex-col">
        {/* Skeleton feed */}
        <div className="flex-1 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          <div className="absolute left-3 right-20 bottom-24 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-zinc-800" />
              <div className="h-4 w-24 bg-zinc-800 rounded" />
            </div>
            <div className="h-3 w-48 bg-zinc-800 rounded" />
            <div className="h-3 w-32 bg-zinc-800 rounded" />
          </div>
          <div className="absolute right-2 bottom-24 flex flex-col items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-zinc-800" />
            <div className="w-8 h-8 bg-zinc-800 rounded-full" />
            <div className="w-8 h-8 bg-zinc-800 rounded-full" />
            <div className="w-8 h-8 bg-zinc-800 rounded-full" />
            <div className="w-8 h-8 bg-zinc-800 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <p className="text-gray-400 text-sm">No videos yet. Upload the first one!</p>
      </div>
    );
  }

  return (
    <>
      <div ref={scrollRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">
        {feed.map((item, i) =>
          item.type === 'video' ? (
            <div key={item.data.id} className="h-full w-full">
              <VideoCard
                video={item.data}
                index={i}
                currentIndex={currentIndex}
                onOpenComments={handleOpenComments}
                onOpenProfile={onOpenProfile}
                onOpenGifts={onOpenGifts}
              />
            </div>
          ) : (
            <div key={`ad-${i}`} className="h-full w-full">
              <AdCard ad={item.data} />
            </div>
          )
        )}
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="h-full flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
        {!hasMore && feed.length > 0 && (
          <div className="h-full flex items-center justify-center bg-black">
            <p className="text-gray-500 text-sm">You're all caught up!</p>
          </div>
        )}
      </div>
      <CommentsDrawer
        video={commentVideo}
        onClose={() => {
          setCommentVideo(null);
          setRefreshKey((k) => k + 1);
        }}
      />
    </>
  );
}
