import { useState, useEffect } from 'react';
import { Search as SearchIcon, Users, Video as VideoIcon, Music2, User } from 'lucide-react';
import type { Video, Profile } from '@/lib/types';
import { searchVideos, searchUsers, searchByMusic, formatCount } from '@/lib/api';

interface SearchPageProps {
  onOpenProfile: (userId: string) => void;
}

type Tab = 'all' | 'videos' | 'users' | 'music';

export default function SearchPage({ onOpenProfile }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [results, setResults] = useState<{ videos: Video[]; users: Profile[]; musicVideos: Video[] }>({
    videos: [],
    users: [],
    musicVideos: [],
  });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Debounced search: fires 400ms after the user stops typing.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearched(false);
      setResults({ videos: [], users: [], musicVideos: [] });
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      runSearch(q);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const runSearch = async (q: string) => {
    try {
      const [videos, users, musicVideos] = await Promise.all([
        searchVideos(q).catch(() => [] as Video[]),
        searchUsers(q).catch(() => [] as Profile[]),
        searchByMusic(q).catch(() => [] as Video[]),
      ]);
      setResults({ videos, users, musicVideos });
    } catch {
      setResults({ videos: [], users: [], musicVideos: [] });
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    runSearch(q);
  };

  const tabs: { id: Tab; label: string; icon: typeof VideoIcon }[] = [
    { id: 'all', label: 'All', icon: SearchIcon },
    { id: 'videos', label: 'Videos', icon: VideoIcon },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'music', label: 'Music', icon: Music2 },
  ];

  const showUsers = tab === 'all' || tab === 'users';
  const showVideos = tab === 'all' || tab === 'videos';
  const showMusic = tab === 'all' || tab === 'music';

  const hasResults = results.videos.length > 0 || results.users.length > 0 || results.musicVideos.length > 0;

  return (
    <div className="h-full overflow-y-auto bg-black pb-2">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="sticky top-0 z-10 bg-black/90 backdrop-blur-lg px-3 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-zinc-800 rounded-full px-3 py-2">
            <SearchIcon size={18} className="text-gray-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creators, videos, music..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-gray-500 hover:text-white"
                aria-label="Clear"
              >
                <SearchIcon size={15} className="rotate-45" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Tabs */}
      {searched && hasResults && (
        <div className="flex gap-1 px-3 py-2 sticky top-[57px] bg-black/90 backdrop-blur-lg z-10 border-b border-white/10">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                tab === id ? 'bg-white text-black' : 'bg-zinc-800 text-gray-400'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="px-3 py-3">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {!loading && !searched && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <SearchIcon size={48} className="text-gray-700 mb-3" />
            <p className="text-sm">Search for creators, videos, or music</p>
          </div>
        )}

        {!loading && searched && !hasResults && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <SearchIcon size={40} className="text-gray-700 mb-2" />
            <p className="text-sm">No results found for "{query}"</p>
          </div>
        )}

        {!loading && showUsers && results.users.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white text-sm font-semibold mb-3">Users</h3>
            <div className="space-y-3">
              {results.users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onOpenProfile(user.id)}
                  className="flex items-center gap-3 w-full hover:bg-white/5 p-2 rounded-lg transition-colors"
                >
                  <span className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} className="text-gray-500" />
                    )}
                  </span>
                  <div className="text-left">
                    <p className="text-white text-sm font-semibold">@{user.username}</p>
                    <p className="text-gray-400 text-xs">{user.display_name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && showVideos && results.videos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white text-sm font-semibold mb-3">Videos</h3>
            <div className="grid grid-cols-2 gap-2">
              {results.videos.map((v) => (
                <div key={v.id} className="relative aspect-[9/14] rounded-lg overflow-hidden bg-zinc-800">
                  {v.cover_url && <img src={v.cover_url} alt={v.caption} className="w-full h-full object-cover" />}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-xs line-clamp-2">{v.caption}</p>
                    <p className="text-gray-300 text-xs mt-1">{formatCount(v.views)} views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && showMusic && results.musicVideos.length > 0 && (
          <div>
            <h3 className="text-white text-sm font-semibold mb-3">Music</h3>
            <div className="space-y-2">
              {results.musicVideos.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50">
                  <Music2 size={20} className="text-rose-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{v.music}</p>
                    <p className="text-gray-400 text-xs truncate">{v.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
