import { Home, Search, Plus, User } from 'lucide-react';

export type Tab = 'home' | 'search' | 'upload' | 'profile' | 'dashboard';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs: { id: Tab; icon: typeof Home; label: string }[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'upload', icon: Plus, label: 'Upload' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-t border-white/10">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto px-2">
        {tabs.map(({ id, icon: Icon, label }) => {
          const active = activeTab === id;
          if (id === 'upload') {
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className="flex flex-col items-center justify-center gap-0.5"
                aria-label={label}
              >
                <div className="w-10 h-7 rounded-lg bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-center">
                  <Icon size={20} className="text-white" fill="white" />
                </div>
              </button>
            );
          }
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-90"
              aria-label={label}
            >
              <Icon
                size={24}
                className={active ? 'text-white' : 'text-gray-500'}
                fill={active ? 'currentColor' : 'none'}
              />
              <span className={`text-[10px] ${active ? 'text-white' : 'text-gray-500'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
