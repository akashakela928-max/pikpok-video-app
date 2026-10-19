import { useState } from 'react';
import { X, Wallet, ArrowDownToLine, Loader2, Check } from 'lucide-react';
import { requestWithdrawal, coinsToUsd } from '@/lib/api';

interface WithdrawModalProps {
  availableCoins: number;
  onClose: () => void;
  onSuccess: () => void;
}

const METHODS = [
  { id: 'upi', label: 'UPI ID' },
  { id: 'paypal', label: 'PayPal Email' },
  { id: 'bank', label: 'Bank Account' },
];

export default function WithdrawModal({ availableCoins, onClose, onSuccess }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; usd?: string } | null>(null);

  const minWithdraw = 1000;
  const amountNum = parseInt(amount) || 0;
  const canSubmit = amountNum >= minWithdraw && amountNum <= availableCoins && details.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    const res = await requestWithdrawal(amountNum, method, details.trim());
    setSubmitting(false);
    if (res.success) {
      setResult({ ok: true, msg: 'Withdrawal requested!', usd: res.amount_usd });
      onSuccess();
      setTimeout(onClose, 2000);
    } else {
      const errMap: Record<string, string> = {
        insufficient_earnings: 'Not enough earnings available.',
        minimum_1000_coins: 'Minimum withdrawal is 1,000 coins ($10).',
        not_authenticated: 'Please sign in to withdraw.',
      };
      setResult({ ok: false, msg: errMap[res.error || ''] || 'Failed to request withdrawal' });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ArrowDownToLine size={20} className="text-emerald-400" />
              <h3 className="text-white font-bold text-base">Withdraw Earnings</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="px-5 py-4">
            {result?.ok ? (
              <div className="flex flex-col items-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
                  <Check size={28} className="text-white" />
                </div>
                <p className="text-white font-bold text-lg">Withdrawal Requested!</p>
                <p className="text-gray-400 text-sm mt-1">${result.usd} will be sent to your account</p>
              </div>
            ) : (
              <>
                {/* Available balance */}
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet size={18} className="text-emerald-400" />
                    <span className="text-gray-300 text-xs">Available</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold text-lg">{availableCoins.toLocaleString()}</span>
                    <span className="text-gray-400 text-xs ml-1">coins</span>
                    <p className="text-gray-500 text-xs">${coinsToUsd(availableCoins)}</p>
                  </div>
                </div>

                {/* Amount input */}
                <label className="text-gray-400 text-xs block mb-1.5">Amount (coins)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ${minWithdraw.toLocaleString()}`}
                  className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 outline-none border border-white/5 focus:border-white/20 placeholder-gray-500 mb-1"
                />
                <p className="text-gray-500 text-xs mb-3">
                  = ${coinsToUsd(amountNum || 0)} USD (100 coins = $1)
                </p>

                {/* Method */}
                <label className="text-gray-400 text-xs block mb-1.5">Withdrawal Method</label>
                <div className="flex gap-1.5 mb-3">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        method === m.id
                          ? 'bg-white text-black border-white'
                          : 'bg-zinc-800 text-gray-400 border-white/5'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Details */}
                <label className="text-gray-400 text-xs block mb-1.5">
                  {METHODS.find((m) => m.id === method)?.label}
                </label>
                <input
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={method === 'upi' ? 'yourname@upi' : method === 'paypal' ? 'email@example.com' : 'Account number'}
                  className="w-full bg-zinc-800 text-white text-sm rounded-lg px-3 py-2.5 outline-none border border-white/5 focus:border-white/20 placeholder-gray-500 mb-4"
                />

                {result && !result.ok && (
                  <p className="text-rose-400 text-sm mb-3">{result.msg}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Processing...
                    </>
                  ) : (
                    `Withdraw $${coinsToUsd(amountNum || 0)}`
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
