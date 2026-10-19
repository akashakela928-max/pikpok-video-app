import { useState, useEffect } from 'react';
import { X, Coins, Sparkles } from 'lucide-react';
import type { Video, Gift } from '@/lib/types';
import { fetchGifts, sendGift, fetchWallet, formatCount } from '@/lib/api';
import { getMyProfileId } from '@/lib/api';

interface GiftsDrawerProps {
  video: Video | null;
  onClose: () => void;
  onSent: () => void;
}

export default function GiftsDrawer({ video, onClose, onSent }: GiftsDrawerProps) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [myCoins, setMyCoins] = useState(0);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!video) return;
    fetchGifts().then(setGifts);
    const myId = getMyProfileId();
    if (myId) {
      fetchWallet(myId).then((w) => w && setMyCoins(w.coins));
    }
  }, [video?.id]);

  if (!video) return null;

  const handleSend = async (gift: Gift) => {
    setSending(true);
    setResult(null);
    const res = await sendGift(video.id, gift.id);
    setSending(false);
    if (res.success) {
      setMyCoins((c) => c - gift.coin_value);
      setResult({ ok: true, msg: `${gift.emoji} ${gift.name} sent!` });
      onSent();
      setTimeout(() => setResult(null), 2000);
    } else {
      const errMap: Record<string, string> = {
        insufficient_coins: 'Not enough coins. Claim your daily bonus!',
        not_authenticated: 'Please sign in to send gifts.',
        cannot_gift_self: "You can't gift your own video!",
      };
      setResult({ ok: false, msg: errMap[res.error || ''] || 'Failed to send gift' });
      setTimeout(() => setResult(null), 3000);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 h-[55%] bg-zinc-900 rounded-t-2xl border-t border-white/10 flex flex-col max-w-md mx-auto animate-slide-up">
        {/* Pull indicator */}
        <div className="flex justify-center pt-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <h3 className="text-white font-semibold text-sm">Send a Gift</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1">
              <Coins size={14} className="text-amber-400" fill="currentColor" />
              <span className="text-amber-400 text-xs font-bold">{formatCount(myCoins)}</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Result banner */}
        {result && (
          <div
            className={`mx-4 mb-2 px-3 py-2 rounded-lg text-center text-sm font-semibold ${
              result.ok
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
            }`}
          >
            {result.msg}
          </div>
        )}

        {/* Gifts grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-4 gap-3">
            {gifts.map((gift) => {
              const canAfford = myCoins >= gift.coin_value;
              return (
                <button
                  key={gift.id}
                  onClick={() => canAfford && !sending && handleSend(gift)}
                  disabled={!canAfford || sending}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                    canAfford
                      ? `bg-gradient-to-br ${gift.color} border-transparent active:scale-90`
                      : 'bg-zinc-800 border-white/5 opacity-50'
                  }`}
                >
                  <span className="text-3xl">{gift.emoji}</span>
                  <span className="text-white text-xs font-bold">{gift.name}</span>
                  <span className="flex items-center gap-0.5 text-white/90 text-[10px] font-semibold">
                    <Coins size={10} fill="currentColor" className="text-amber-300" />
                    {gift.coin_value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
