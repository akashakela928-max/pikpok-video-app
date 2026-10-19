import { supabase } from './supabase';
import type { Video, Comment, Profile, Wallet, Gift, VideoGift, Transaction, Withdrawal, Ad, FeedItem } from './types';

const PROFILE_CACHE_PREFIX = 'pikpok_profile_cache_';
const profileCache = new Map<string, Profile | null>();

export function getMyProfileId(): string | null {
  return localStorage.getItem('pikpok_auth_profile_id');
}

export async function fetchVideos(limit = 3, offset = 0): Promise<Video[]> {
  const myId = getMyProfileId();
  const { data, error } = await supabase
    .from('videos')
    .select('*, profile:profiles!videos_user_id_fkey(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return [];

  const videos = data as Video[];

  if (myId && videos.length > 0) {
    const videoIds = videos.map((v) => v.id);
    const [{ data: likes }, { data: myLikes }, { data: commentCounts }, { data: giftCounts }] = await Promise.all([
      supabase.from('likes').select('video_id').in('video_id', videoIds),
      supabase.from('likes').select('video_id').eq('user_id', myId).in('video_id', videoIds),
      supabase.from('comments').select('video_id').in('video_id', videoIds),
      supabase.from('video_gifts').select('video_id').in('video_id', videoIds),
    ]);

    const likeMap = new Map<string, number>();
    (likes || []).forEach((l: { video_id: string }) => likeMap.set(l.video_id, (likeMap.get(l.video_id) || 0) + 1));
    const myLikeSet = new Set<string>();
    (myLikes || []).forEach((l: { video_id: string }) => myLikeSet.add(l.video_id));
    const commentMap = new Map<string, number>();
    (commentCounts || []).forEach((c: { video_id: string }) => commentMap.set(c.video_id, (commentMap.get(c.video_id) || 0) + 1));
    const giftMap = new Map<string, number>();
    (giftCounts || []).forEach((g: { video_id: string }) => giftMap.set(g.video_id, (giftMap.get(g.video_id) || 0) + 1));

    videos.forEach((v) => {
      v.like_count = likeMap.get(v.id) || 0;
      v.liked_by_me = myLikeSet.has(v.id);
      v.comment_count = commentMap.get(v.id) || 0;
      v.gift_count = giftMap.get(v.id) || 0;
    });
  } else {
    videos.forEach((v) => {
      v.like_count = 0;
      v.liked_by_me = false;
      v.comment_count = 0;
      v.gift_count = 0;
    });
  }

  return videos;
}

export async function fetchAds(): Promise<Ad[]> {
  const { data, error } = await supabase.from('ads').select('*');
  if (error || !data) return [];
  return data as Ad[];
}

export function buildFeed(videos: Video[], ads: Ad[]): FeedItem[] {
  const items: FeedItem[] = [];
  videos.forEach((v, i) => {
    items.push({ type: 'video', data: v });
    // Insert an ad after every 3rd video
    if ((i + 1) % 3 === 0 && ads.length > 0) {
      const ad = ads[(Math.floor((i + 1) / 3) - 1) % ads.length];
      items.push({ type: 'ad', data: ad });
    }
  });
  return items;
}

export async function fetchUserVideos(userId: string, limit = 5, offset = 0): Promise<Video[]> {
  const { data, error } = await supabase
    .from('videos')
    .select('*, profile:profiles!videos_user_id_fkey(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error || !data) return [];
  return data as Video[];
}

export async function toggleLike(videoId: string, liked: boolean): Promise<boolean> {
  const myId = getMyProfileId();
  if (!myId) return false;
  if (liked) {
    const { error } = await supabase.from('likes').delete().eq('user_id', myId).eq('video_id', videoId);
    return !error;
  } else {
    const { error } = await supabase.from('likes').insert({ user_id: myId, video_id: videoId });
    return !error;
  }
}

export async function fetchComments(videoId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profile:profiles!comments_user_id_fkey(*)')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Comment[];
}

export async function addComment(videoId: string, text: string): Promise<Comment | null> {
  const myId = getMyProfileId();
  if (!myId || !text.trim()) return null;
  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: myId, video_id: videoId, text: text.trim() })
    .select('*, profile:profiles!comments_user_id_fkey(*)')
    .single();
  if (error || !data) return null;
  return data as Comment;
}

export async function toggleFollow(followingId: string, isFollowing: boolean): Promise<boolean> {
  const myId = getMyProfileId();
  if (!myId) return false;
  if (isFollowing) {
    const { error } = await supabase.from('follows').delete().eq('follower_id', myId).eq('following_id', followingId);
    return !error;
  } else {
    const { error } = await supabase.from('follows').insert({ follower_id: myId, following_id: followingId });
    return !error;
  }
}

export async function isFollowing(userId: string): Promise<boolean> {
  const myId = getMyProfileId();
  if (!myId) return false;
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', myId)
    .eq('following_id', userId)
    .maybeSingle();
  return !!data;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (profileCache.has(userId)) return profileCache.get(userId) || null;
  const cached = localStorage.getItem(`${PROFILE_CACHE_PREFIX}${userId}`);
  if (cached) {
    try {
      const cachedProfile = JSON.parse(cached) as Profile;
      profileCache.set(userId, cachedProfile);
      return cachedProfile;
    } catch {
      localStorage.removeItem(`${PROFILE_CACHE_PREFIX}${userId}`);
    }
  }
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  const profile = data as Profile | null;
  profileCache.set(userId, profile);
  if (profile) localStorage.setItem(`${PROFILE_CACHE_PREFIX}${userId}`, JSON.stringify(profile));
  return profile;
}

export async function updateProfile(userId: string, changes: Pick<Profile, 'display_name' | 'username' | 'bio' | 'avatar_url'>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(changes)
    .eq('id', userId)
    .select()
    .maybeSingle();
  if (error || !data) return null;
  profileCache.set(userId, data as Profile);
  localStorage.setItem(`${PROFILE_CACHE_PREFIX}${userId}`, JSON.stringify(data));
  return data as Profile;
}

export async function getFollowerCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);
  return count || 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);
  return count || 0;
}

export async function incrementViews(videoId: string): Promise<void> {
  await supabase.rpc('increment_views', { video_id: videoId });
}

export async function searchVideos(query: string): Promise<Video[]> {
  const cleanQuery = query.trim().replace(/^@/, '');
  if (!cleanQuery) return [];
  const { data, error } = await supabase
    .from('videos')
    .select('*, profile:profiles!videos_user_id_fkey(*)')
    .ilike('caption', `%${cleanQuery}%`)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return data as Video[];
}

export async function searchUsers(query: string): Promise<Profile[]> {
  const cleanQuery = query.trim().replace(/^@/, '');
  if (!cleanQuery) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%`)
    .limit(20);
  if (error || !data) return [];
  return data as Profile[];
}

export async function searchByMusic(query: string): Promise<Video[]> {
  const cleanQuery = query.trim().replace(/^@/, '');
  if (!cleanQuery) return [];
  const { data, error } = await supabase
    .from('videos')
    .select('*, profile:profiles!videos_user_id_fkey(*)')
    .ilike('music', `%${cleanQuery}%`)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return data as Video[];
}

export async function insertVideo(video: {
  user_id: string;
  video_url: string;
  cover_url: string;
  caption: string;
  music: string;
}): Promise<{ data: Video | null; error: string | null }> {
  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: video.user_id,
      video_url: video.video_url,
      cover_url: video.cover_url || '',
      caption: video.caption,
      music: video.music,
    })
    .select('*, profile:profiles!videos_user_id_fkey(*)')
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  return { data: data as Video, error: null };
}

export async function uploadVideoFile(
  file: File,
  userId: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; path: string } | { error: string }> {
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 50MB.` };
  }
  const allowed = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
  if (!allowed.includes(file.type) && !file.name.match(/\.(mp4|mov|webm)$/i)) {
    return { error: 'Only MP4, MOV, and WEBM files are supported.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('videos')
    .upload(fileName, file, {
      contentType: file.type || 'video/mp4',
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName);
  return { url: urlData.publicUrl, path: fileName };
}

export async function uploadCoverImage(
  blob: Blob,
  userId: string
): Promise<string | null> {
  const fileName = `${userId}/${Date.now()}_cover.jpg`;
  const { error } = await supabase.storage
    .from('videos')
    .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) return null;
  const { data } = supabase.storage.from('videos').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function generateThumbnail(videoUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    video.src = videoUrl;

    const timeout = setTimeout(() => resolve(null), 8000);

    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(1, video.duration / 3);
    });

    video.addEventListener('seeked', () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 360;
        canvas.height = Math.round(360 * (video.videoHeight / video.videoWidth)) || 560;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => resolve(blob ? URL.createObjectURL(blob) : null),
          'image/jpeg',
          0.7
        );
      } catch {
        resolve(null);
      }
    });

    video.addEventListener('error', () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

export async function blobUrlToBlob(blobUrl: string): Promise<Blob | null> {
  try {
    const res = await fetch(blobUrl);
    return await res.blob();
  } catch {
    return null;
  }
}

// --- Earnings system ---

export async function fetchWallet(userId: string): Promise<Wallet | null> {
  const { data } = await supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle();
  return data as Wallet | null;
}

export async function fetchGifts(): Promise<Gift[]> {
  const { data, error } = await supabase.from('gifts').select('*').order('coin_value', { ascending: true });
  if (error || !data) return [];
  return data as Gift[];
}

export async function fetchVideoGifts(videoId: string): Promise<VideoGift[]> {
  const { data, error } = await supabase
    .from('video_gifts')
    .select('*, gift:gifts(*), sender:profiles!video_gifts_sender_id_fkey(*)')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data as VideoGift[];
}

export async function sendGift(videoId: string, giftId: string): Promise<{ success?: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('send_gift', {
    p_video_id: videoId,
    p_gift_id: giftId,
  });
  if (error) return { error: error.message };
  return data as { success?: boolean; error?: string };
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data as Transaction[];
}

export async function fetchWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Withdrawal[];
}

export async function requestWithdrawal(
  amountCoins: number,
  method: string,
  details: string
): Promise<{ success?: boolean; amount_usd?: string; error?: string }> {
  const { data, error } = await supabase.rpc('request_withdrawal', {
    p_amount_coins: amountCoins,
    p_method: method,
    p_details: details,
  });
  if (error) return { error: error.message };
  return data as { success?: boolean; amount_usd?: string; error?: string };
}

export async function claimDailyBonus(): Promise<{ success?: boolean; coins?: number; error?: string }> {
  const { data, error } = await supabase.rpc('claim_daily_bonus');
  if (error) return { error: error.message };
  return data as { success?: boolean; coins?: number; error?: string };
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export function coinsToUsd(coins: number): string {
  return (coins / 100).toFixed(2);
}
