import { useState } from 'react';
import {
  ArrowLeft, BarChart3, CalendarDays, Sparkles, Lightbulb, Megaphone,
  Trophy, Film, Music2, BookOpen, DollarSign, ChevronRight, TrendingUp,
  Gift, Coins, CheckCircle2, Clock, X,
} from 'lucide-react';
import type { Wallet, Transaction } from '@/lib/types';
import { formatCount, coinsToUsd } from '@/lib/api';
import { formatTimeAgo } from '@/lib/utils';

interface DashboardPageProps {
  wallet: Wallet | null;
  transactions: Transaction[];
  onBack: () => void;
}

type DateRange = '7d' | '30d' | '90d';

export default function DashboardPage({ wallet, transactions, onBack }: DashboardPageProps) {
  const [range, setRange] = useState<DateRange>('30d');
  const [showMonetisation, setShowMonetisation] = useState(false);

  const totalEarned = wallet?.total_earned ?? 0;
  const totalWithdrawn = wallet?.total_withdrawn ?? 0;
  const availableCoins = totalEarned - totalWithdrawn;
  const spendableCoins = wallet?.coins ?? 0;

  const recentEarnings = transactions.filter((t) => t.amount > 0).slice(0, 8);
  const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const rangeTransactions = transactions.filter((t) => {
    const daysAgo = (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= rangeDays;
  });
  const rangeEarnings = rangeTransactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  const tools = [
    { icon: CalendarDays, label: 'Monthly recap', desc: 'Your performance this month', color: 'text-rose-400' },
    { icon: Lightbulb, label: 'Best practices', desc: 'Tips to grow your audience', color: 'text-amber-400' },
    { icon: Sparkles, label: 'Inspiration', desc: 'Ideas from trending creators', color: 'text-fuchsia-400' },
    { icon: Megaphone, label: 'Ad tools', desc: 'Promote your content', color: 'text-sky-400' },
    { icon: Trophy, label: 'Competitive insights', desc: 'See how you compare', color: 'text-emerald-400' },
    { icon: Film, label: 'Trial reels', desc: 'Experiment with new formats', color: 'text-indigo-400' },
  ];

  const tips = [
    { icon: Music2, label: 'Trending audio', desc: 'Use popular sounds to boost reach', color: 'text-rose-400' },
    { icon: BookOpen, label: 'Other helpful resources', desc: 'Guides and creator support', color: 'text-sky-400' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-black pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-gray-300 hover:text-white active:scale-90 transition-transform">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white font-bold text-lg">Your dashboard</h1>
        </div>
      </div>

      {/* Insights */}
      <section className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-base font-bold flex items-center gap-2">
            <BarChart3 size={18} className="text-rose-400" /> Insights
          </h2>
          <div className="flex bg-zinc-900 rounded-full p-0.5 border border-white/10">
            {(['7d', '30d', '90d'] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  range === r ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {r === '7d' ? '7d' : r === '30d' ? '30d' : '90d'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={14} className="text-sky-400" />
              <p className="text-gray-400 text-[10px] uppercase tracking-wide">Views</p>
            </div>
            <p className="text-white font-black text-lg">{formatCount(rangeTransactions.length * 42)}</p>
            <p className="text-emerald-400 text-[10px] font-semibold mt-0.5">+12.4%</p>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={14} className="text-rose-400" />
              <p className="text-gray-400 text-[10px] uppercase tracking-wide">Followers</p>
            </div>
            <p className="text-white font-black text-lg">{formatCount(Math.round(rangeTransactions.length * 0.8))}</p>
            <p className="text-emerald-400 text-[10px] font-semibold mt-0.5">+5.1%</p>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Film size={14} className="text-amber-400" />
              <p className="text-gray-400 text-[10px] uppercase tracking-wide">Shared</p>
            </div>
            <p className="text-white font-black text-lg">{formatCount(rangeTransactions.length)}</p>
            <p className="text-emerald-400 text-[10px] font-semibold mt-0.5">+2.8%</p>
          </div>
        </div>
      </section>

      {/* Your tools */}
      <section className="px-4 pt-6">
        <h2 className="text-white text-base font-bold mb-3">Your tools</h2>
        <div className="space-y-2">
          {tools.map((tool) => (
            <button
              key={tool.label}
              className="w-full flex items-center gap-3 bg-zinc-900 border border-white/10 rounded-2xl p-3.5 hover:bg-zinc-800 transition-colors text-left active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <tool.icon size={20} className={tool.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{tool.label}</p>
                <p className="text-gray-400 text-xs truncate">{tool.desc}</p>
              </div>
              <ChevronRight size={18} className="text-gray-600 shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* Monetisation */}
      <section className="px-4 pt-6">
        <h2 className="text-white text-base font-bold mb-3">Monetisation</h2>
        <button
          onClick={() => setShowMonetisation(true)}
          className="w-full flex items-center gap-3 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 hover:from-emerald-500/20 hover:to-teal-500/15 transition-colors text-left active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <DollarSign size={22} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold">Monetisation tools</p>
            <p className="text-emerald-400/80 text-xs">View status and earnings</p>
          </div>
          <ChevronRight size={18} className="text-gray-500 shrink-0" />
        </button>
      </section>

      {/* Tips and resources */}
      <section className="px-4 pt-6">
        <h2 className="text-white text-base font-bold mb-3">Tips and resources</h2>
        <div className="space-y-2">
          {tips.map((tip) => (
            <button
              key={tip.label}
              className="w-full flex items-center gap-3 bg-zinc-900 border border-white/10 rounded-2xl p-3.5 hover:bg-zinc-800 transition-colors text-left active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <tip.icon size={20} className={tip.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{tip.label}</p>
                <p className="text-gray-400 text-xs truncate">{tip.desc}</p>
              </div>
              <ChevronRight size={18} className="text-gray-600 shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* Monetisation detail sheet */}
      {showMonetisation && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setShowMonetisation(false)}
        >
          <div
            className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-zinc-950 z-10">
              <h2 className="text-white text-lg font-bold flex items-center gap-2">
                <DollarSign size={20} className="text-emerald-400" /> Monetisation
              </h2>
              <button onClick={() => setShowMonetisation(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Status */}
              <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <p className="text-white text-sm font-bold">Monetisation status</p>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-xs">Gifts and tips</span>
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 size={13} /> Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-xs">Daily bonus</span>
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 size={13} /> Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-xs">Ad revenue share</span>
                    <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                      <Clock size={13} /> Pending
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-xs">Subscriptions</span>
                    <span className="flex items-center gap-1 text-gray-500 text-xs font-semibold">
                      <Clock size={13} /> Not eligible
                    </span>
                  </div>
                </div>
              </div>

              {/* Earnings summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Coins size={15} className="text-amber-400" fill="currentColor" />
                    <p className="text-gray-400 text-[10px] uppercase tracking-wide">Spendable</p>
                  </div>
                  <p className="text-white font-black text-xl">{formatCount(spendableCoins)}</p>
                  <p className="text-gray-500 text-[10px]">coins</p>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={15} className="text-emerald-400" />
                    <p className="text-gray-400 text-[10px] uppercase tracking-wide">Total earned</p>
                  </div>
                  <p className="text-emerald-400 font-black text-xl">{formatCount(totalEarned)}</p>
                  <p className="text-gray-500 text-[10px]">coins</p>
                </div>
              </div>

              {/* Withdrawable */}
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs">Available to withdraw</p>
                    <p className="text-emerald-400 font-black text-2xl">${coinsToUsd(availableCoins)}</p>
                    <p className="text-gray-500 text-xs">{formatCount(availableCoins)} coins</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">Withdrawn</p>
                    <p className="text-white font-bold text-sm">{formatCount(totalWithdrawn)}</p>
                    <p className="text-gray-500 text-xs">coins</p>
                  </div>
                </div>
                {availableCoins < 1000 && (
                  <p className="text-gray-500 text-xs mt-2">Minimum withdrawal: 1,000 coins ($10)</p>
                )}
              </div>

              {/* Recent earnings */}
              <div>
                <h3 className="text-white text-sm font-bold mb-2 flex items-center gap-1.5">
                  <Gift size={15} className="text-emerald-400" /> Recent earnings
                </h3>
                {recentEarnings.length === 0 ? (
                  <div className="bg-zinc-900 rounded-xl p-6 text-center">
                    <p className="text-gray-500 text-xs">No earnings yet. Keep creating to earn coins from gifts!</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {recentEarnings.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2.5 border border-white/5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Gift size={15} className="text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{t.description}</p>
                            <p className="text-gray-500 text-[10px]">{formatTimeAgo(t.created_at)}</p>
                          </div>
                        </div>
                        <span className="text-emerald-400 text-xs font-bold shrink-0">+{t.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-3">
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Earnings from gifts and daily bonuses are calculated in coins. 100 coins = $1 USD. Withdrawals are processed within 3-5 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
