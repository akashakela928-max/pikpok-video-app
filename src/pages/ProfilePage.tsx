import { useEffect, useState } from 'react';
import {
  Settings, Video as VideoIcon, Heart, Grid3x3, Coins,
  ArrowDownToLine, Gift, TrendingUp, LogOut, CalendarCheck, X, Save, Plus, LayoutDashboard, User,
} from 'lucide-react';
import type { Profile, Video, Wallet, Transaction, Withdrawal } from '@/lib/types';
import {
  fetchProfile, fetchUserVideos, getFollowerCount, getFollowingCount,
  isFollowing, toggleFollow, formatCount, coinsToUsd,
  fetchTransactions, fetchWithdrawals, claimDailyBonus, updateProfile,
} from '@/lib/api';
import { useAuth } from '@/lib/identity';
import { formatTimeAgo } from '@/lib/utils';
import WithdrawModal from '@/components/WithdrawModal';

interface ProfilePageProps {
  userId: string | null;
  onOpenProfile: (userId: string) => void;
  onCreate: () => void;
  onOpenDashboard: () => void;
  wallet: Wallet | null;
  onWalletChange: () => void;
}

export default function ProfilePage({ userId, wallet, onWalletChange, onOpenProfile, onCreate, onOpenDashboard }: ProfilePageProps) {
  const { profile: authProfile, signOut } = useAuth();
  const myProfileId = authProfile?.id || null;
  const targetId = userId || myProfileId;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [tab, setTab] = useState<'grid' | 'liked' | 'earnings'>('grid');
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [hasMoreVideos, setHasMoreVideos] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [bonusMsg, setBonusMsg] = useState<string | null>(null);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [editorError, setEditorError] = useState('');

  useEffect(() => {
    if (!targetId) return;
    let active = true;
    setLoading(true);
    setProfileError('');
    setProfile(null);
    setVideos([]);
    setHasMoreVideos(false);

    const timeout = new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('profile_timeout')), 5000);
    });

    Promise.race([fetchProfile(targetId), timeout])
      .then((loadedProfile) => {
        if (!active) return;
        if (!loadedProfile) throw new Error('profile_not_found');
        setProfile(loadedProfile);
        setLoading(false);
        setLoadingVideos(true);
        fetchUserVideos(targetId, 5, 0).then((loadedVideos) => {
          if (!active) return;
          setVideos(loadedVideos);
          setHasMoreVideos(loadedVideos.length === 5);
          setLoadingVideos(false);
        }).catch(() => {
          if (active) setLoadingVideos(false);
        });

        Promise.all([
          getFollowerCount(targetId),
          getFollowingCount(targetId),
          isFollowing(targetId),
        ]).then(([f, fg, isFol]) => {
          if (!active) return;
          setFollowers(f);
          setFollowing(fg);
          setIsFollowingUser(isFol);
        });
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
        setProfileError('Profile could not be loaded.');
      });

    return () => {
      active = false;
    };
  }, [targetId, retryCount]);

  useEffect(() => {
    if (!targetId || targetId !== myProfileId) return;
    fetchTransactions(targetId).then(setTransactions);
    fetchWithdrawals(targetId).then(setWithdrawals);
  }, [targetId, myProfileId]);

  const loadMoreVideos = () => {
    if (!targetId || loadingVideos || !hasMoreVideos) return;
    setLoadingVideos(true);
    fetchUserVideos(targetId, 5, videos.length).then((moreVideos) => {
      setVideos((current) => [...current, ...moreVideos]);
      setHasMoreVideos(moreVideos.length === 5);
      setLoadingVideos(false);
    }).catch(() => setLoadingVideos(false));
  };

  const openEditor = () => {
    if (!profile) return;
    setEditName(profile.display_name);
    setEditUsername(profile.username);
    setEditBio(profile.bio || '');
    setEditPhoto(profile.avatar_url);
    setEditorError('');
    setEditOpen(true);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!profile || !editName.trim() || !editUsername.trim()) {
      setEditorError('Name and username are required.');
      return;
    }
    setSavingProfile(true);
    setEditorError('');
    const updated = await updateProfile(profile.id, {
      display_name: editName.trim(),
      username: editUsername.trim().replace(/^@/, '').replace(/[^a-zA-Z0-9_.]/g, '_'),
      bio: editBio.trim(),
      avatar_url: editPhoto || profile.avatar_url,
    });
    setSavingProfile(false);
    if (!updated) {
      setEditorError('Could not save your profile. Please try again.');
      return;
    }
    setProfile({ ...profile, ...updated });
    setEditOpen(false);
  };

  const handleFollow = async () => {
    if (!profile) return;
    const wasFollowing = isFollowingUser;
    setIsFollowingUser(!wasFollowing);
    setFollowers((c) => (wasFollowing ? c - 1 : c + 1));
    await toggleFollow(profile.id, wasFollowing);
  };

  const handleClaimBonus = async () => {
    setBonusLoading(true);
    const res = await claimDailyBonus();
    setBonusLoading(false);
    if (res.success) {
      setBonusMsg(`+50 coins claimed! You now have ${res.coins} coins.`);
      onWalletChange();
    } else if (res.error === 'not_authenticated') {
      setBonusMsg('Sign in with Google to claim daily bonuses.');
    } else if (res.error === 'already_claimed') {
      setBonusMsg('Already claimed today. Come back tomorrow!');
    } else {
      setBonusMsg('Failed to claim bonus.');
    }
    setTimeout(() => setBonusMsg(null), 3000);
  };

  const isOwnProfile = targetId === myProfileId;
  const availableEarnings = wallet ? wallet.total_earned - wallet.total_withdrawn : 0;
  const canClaimBonus = wallet ? wallet.last_bonus_claim !== new Date().toISOString().split('T')[0] : false;

  if (loading) {
    return (
      <div className="h-full overflow-hidden bg-black px-4 pt-6 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-zinc-800" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-5 w-32 rounded bg-zinc-800" />
            <div className="h-4 w-24 rounded bg-zinc-800" />
            <div className="h-3 w-48 rounded bg-zinc-900" />
          </div>
        </div>
        <div className="flex gap-6 mt-6">
          <div className="h-10 w-12 rounded bg-zinc-900" />
          <div className="h-10 w-12 rounded bg-zinc-900" />
          <div className="h-10 w-12 rounded bg-zinc-900" />
        </div>
        <div className="h-10 w-full rounded-lg bg-zinc-900 mt-5" />
        <div className="grid grid-cols-3 gap-1 mt-6">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[9/14] bg-zinc-900" />)}
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 bg-black px-6 text-center">
        <p className="text-gray-400 text-sm">{profileError || 'Profile not found'}</p>
        <button
          onClick={() => setRetryCount((count) => count + 1)}
          className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-black pb-2">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-start gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-20 h-20 rounded-full object-cover border-2 border-white/10"
            />
          ) : (
            <span className="w-20 h-20 rounded-full border-2 border-white/10 bg-zinc-800 flex items-center justify-center">
              <User size={32} className="text-gray-500" />
            </span>
          )}
          <div className="flex-1 pt-1">
            <h1 className="text-white font-bold text-lg">@{profile.username}</h1>
            <p className="text-gray-400 text-sm">{profile.display_name}</p>
            {profile.bio && <p className="text-gray-300 text-xs mt-1">{profile.bio}</p>}
          </div>
          {isOwnProfile ? (
            <div className="flex gap-2">
              <button onClick={signOut} className="text-gray-400 hover:text-white" title="Sign out">
                <LogOut size={20} />
              </button>
              <button className="text-gray-400 hover:text-white">
                <Settings size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenProfile(authProfile?.id || '')}
              className="text-gray-400 hover:text-white"
              title="Back to my profile"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="flex flex-col items-center">
            <span className="text-white font-bold text-lg">{formatCount(videos.length)}</span>
            <span className="text-gray-400 text-xs">Posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white font-bold text-lg">{formatCount(followers)}</span>
            <span className="text-gray-400 text-xs">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white font-bold text-lg">{formatCount(following)}</span>
            <span className="text-gray-400 text-xs">Following</span>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-4">
          {isOwnProfile ? (
            <div className="flex gap-2">
              <button
                onClick={openEditor}
                className="flex-1 py-2.5 rounded-lg border border-white/20 text-white text-sm font-semibold hover:bg-white/5"
              >
                Edit Profile
              </button>
              <button
                onClick={onCreate}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-orange-400 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus size={15} /> Create
              </button>
              <button
                onClick={onOpenDashboard}
                className="flex-1 py-2.5 rounded-lg border border-white/20 text-white text-sm font-semibold hover:bg-white/5 flex items-center justify-center gap-1.5"
              >
                <LayoutDashboard size={15} /> Dashboard
              </button>
            </div>
          ) : (
            <button
              onClick={handleFollow}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isFollowingUser
                  ? 'border border-white/20 text-white hover:bg-white/5'
                  : 'bg-gradient-to-r from-rose-500 to-orange-400 text-white'
              }`}
            >
              {isFollowingUser ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mt-4 sticky top-0 bg-black/90 backdrop-blur-lg z-10">
        <button
          onClick={() => setTab('grid')}
          className={`flex-1 flex items-center justify-center py-2.5 border-b-2 ${
            tab === 'grid' ? 'border-white text-white' : 'border-transparent text-gray-500'
          }`}
        >
          <Grid3x3 size={18} />
        </button>
        <button
          onClick={() => setTab('liked')}
          className={`flex-1 flex items-center justify-center py-2.5 border-b-2 ${
            tab === 'liked' ? 'border-white text-white' : 'border-transparent text-gray-500'
          }`}
        >
          <Heart size={18} />
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setTab('earnings')}
            className={`flex-1 flex items-center justify-center py-2.5 border-b-2 ${
              tab === 'earnings' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-gray-500'
            }`}
          >
            <TrendingUp size={18} />
          </button>
        )}
      </div>

      {/* Video grid */}
      {tab === 'grid' && (
        <>
          {loadingVideos && videos.length === 0 ? (
            <div className="grid grid-cols-3 gap-0.5 animate-pulse">
              {Array.from({ length: 5 }).map((_, index) => <div key={index} className="aspect-[9/14] bg-zinc-900" />)}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <VideoIcon size={40} className="text-gray-700 mb-2" />
              <p className="text-sm">No videos yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-0.5">
                {videos.map((v) => (
                  <div key={v.id} className="relative aspect-[9/14] bg-zinc-800 overflow-hidden">
                    {v.cover_url ? (
                      <img src={v.cover_url} alt={v.caption} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <video
                        src={v.video_url}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                        onLoadStart={(e) => { e.currentTarget.currentTime = 0.5; }}
                      />
                    )}
                    <div className="absolute bottom-1 left-1 flex items-center gap-0.5">
                      <span className="text-white text-[10px] font-semibold drop-shadow-lg">
                        {formatCount(v.views)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {hasMoreVideos && (
                <button
                  onClick={loadMoreVideos}
                  disabled={loadingVideos}
                  className="w-full py-3 text-gray-300 text-sm disabled:opacity-50"
                >
                  {loadingVideos ? 'Loading...' : 'Load more videos'}
                </button>
              )}
            </>
          )}
        </>
      )}

      {tab === 'liked' && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Heart size={40} className="text-gray-700 mb-2" />
          <p className="text-sm">Liked videos are private</p>
        </div>
      )}

      {/* Earnings tab */}
      {tab === 'earnings' && isOwnProfile && wallet && (
        <div className="px-4 py-4 space-y-4">
          {/* Wallet balance */}
          <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins size={20} className="text-amber-400" fill="currentColor" />
                <span className="text-white font-bold text-sm">Coin Wallet</span>
              </div>
              <span className="text-amber-400 font-black text-xl">{wallet.coins.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-black/30 rounded-lg p-2.5">
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Spendable Coins</p>
                <p className="text-white font-bold text-base">{wallet.coins.toLocaleString()}</p>
              </div>
              <div className="bg-black/30 rounded-lg p-2.5">
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Total Earned</p>
                <p className="text-emerald-400 font-bold text-base">{wallet.total_earned.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Earnings + Withdraw */}
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-400 text-xs">Available to Withdraw</p>
                <p className="text-emerald-400 font-black text-2xl">${coinsToUsd(availableEarnings)}</p>
                <p className="text-gray-500 text-xs">{availableEarnings.toLocaleString()} coins</p>
              </div>
              <button
                onClick={() => setShowWithdraw(true)}
                disabled={availableEarnings < 1000}
                className="flex items-center gap-2 bg-emerald-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl disabled:opacity-30 active:scale-95 transition-transform"
              >
                <ArrowDownToLine size={16} />
                Withdraw
              </button>
            </div>
            {availableEarnings < 1000 && (
              <p className="text-gray-500 text-xs">Minimum withdrawal: 1,000 coins ($10)</p>
            )}
          </div>

          {/* Daily bonus */}
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck size={18} className="text-amber-400" />
                <div>
                  <p className="text-white text-sm font-semibold">Daily Bonus</p>
                  <p className="text-gray-400 text-xs">Claim 50 free coins every day</p>
                </div>
              </div>
              <button
                onClick={handleClaimBonus}
                disabled={!canClaimBonus || bonusLoading}
                className="bg-amber-500 text-black font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-30"
              >
                {bonusLoading ? '...' : canClaimBonus ? 'Claim' : 'Claimed'}
              </button>
            </div>
            {bonusMsg && (
              <p className="text-amber-400 text-xs mt-2">{bonusMsg}</p>
            )}
          </div>

          {/* Recent transactions */}
          <div>
            <h3 className="text-white text-sm font-bold mb-2 flex items-center gap-1.5">
              <TrendingUp size={16} /> Recent Activity
            </h3>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-6">No transactions yet</p>
            ) : (
              <div className="space-y-1.5">
                {transactions.slice(0, 15).map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2.5 border border-white/5">
                    <div className="flex items-center gap-2">
                      {t.amount > 0 ? (
                        <Gift size={16} className="text-emerald-400" />
                      ) : (
                        <Coins size={16} className="text-gray-500" />
                      )}
                      <div>
                        <p className="text-white text-xs font-semibold">{t.description}</p>
                        <p className="text-gray-500 text-[10px]">{formatTimeAgo(t.created_at)}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${t.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.amount > 0 ? '+' : ''}{t.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Withdrawal history */}
          {withdrawals.length > 0 && (
            <div>
              <h3 className="text-white text-sm font-bold mb-2 flex items-center gap-1.5">
                <ArrowDownToLine size={16} /> Withdrawals
              </h3>
              <div className="space-y-1.5">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2.5 border border-white/5">
                    <div>
                      <p className="text-white text-xs font-semibold">${w.amount_usd} via {w.method}</p>
                      <p className="text-gray-500 text-[10px]">{formatTimeAgo(w.created_at)}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      w.status === 'pending'
                        ? 'bg-amber-500/15 text-amber-400'
                        : w.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-lg font-bold">Edit Profile</h2>
              <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-white" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center mb-5">
              <label className="relative cursor-pointer group">
                <img
                  src={editPhoto || profile.avatar_url}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-white/20 group-hover:opacity-70"
                />
                <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center border-2 border-zinc-950">
                  <Settings size={15} className="text-white" />
                </span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
              <p className="text-gray-500 text-xs mt-2">Tap the photo to change it</p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-gray-400 text-xs">Name</span>
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="mt-1 w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-white/30"
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="text-gray-400 text-xs">Username</span>
                <input
                  value={editUsername}
                  onChange={(event) => setEditUsername(event.target.value)}
                  className="mt-1 w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-white/30"
                  placeholder="username"
                />
              </label>
              <label className="block">
                <span className="text-gray-400 text-xs">Bio</span>
                <textarea
                  value={editBio}
                  onChange={(event) => setEditBio(event.target.value)}
                  rows={3}
                  className="mt-1 w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-white/30 resize-none"
                  placeholder="Tell people about yourself"
                />
              </label>
            </div>

            {editorError && <p className="text-rose-400 text-xs mt-3">{editorError}</p>}
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={17} /> {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {showWithdraw && wallet && (
        <WithdrawModal
          availableCoins={availableEarnings}
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => {
            onWalletChange();
            if (targetId) {
              fetchTransactions(targetId).then(setTransactions);
              fetchWithdrawals(targetId).then(setWithdrawals);
            }
          }}
        />
      )}
    </div>
  );
}
