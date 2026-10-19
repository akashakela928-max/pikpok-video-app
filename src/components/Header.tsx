import { Coins } from 'lucide-react';
import Logo from './Logo';
import { formatCount } from '@/lib/api';

interface HeaderProps {
  coins: number;
  showCoins: boolean;
  onCoinsClick: () => void;
}

export default function Header({ coins, showCoins, onCoinsClick }: HeaderProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 pt-2">
      <div className="relative flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/60 to-transparent">
        <div className="absolute left-1/2 -translate-x-1/2">
          <Logo size="md" />
        </div>
        {showCoins && (
          <button
            onClick={onCoinsClick}
            className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10 active:scale-95 transition-transform"
          >
            <Coins size={16} className="text-amber-400" fill="currentColor" />
            <span className="text-white text-sm font-bold">{formatCount(coins)}</span>
          </button>
        )}
      </div>
    </header>
  );
}
