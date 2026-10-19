import { useState, useCallback, useEffect } from 'react';
import BottomNav, { type Tab } from '@/components/BottomNav';
import LoginPage from '@/components/LoginPage';
import GiftsDrawer from '@/components/GiftsDrawer';
import HomePage from '@/pages/HomePage';
import SearchPage from '@/pages/SearchPage';
import UploadPage from '@/pages/UploadPage';
import ProfilePage from '@/pages/ProfilePage';
import DashboardPage from '@/pages/DashboardPage';
import { useAuth } from '@/lib/identity';
import { getMyProfileId, fetchWallet, fetchTransactions } from '@/lib/api';
import type { Wallet, Transaction, Video } from '@/lib/types';

export default function App() {
  const { session, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [giftVideo, setGiftVideo] = useState<Video | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletTick, setWalletTick] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const isAuthenticated = !!session && !!profile;

  const refreshWallet = useCallback(async () => {
    const id = getMyProfileId();
    if (!id) return;
    const w = await fetchWallet(id);
    setWallet(w);
  }, []);

  useEffect(() => {
    if (isAuthenticated) refreshWallet();
  }, [isAuthenticated, profile?.id, walletTick]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const id = getMyProfileId();
    if (!id) return;
    fetchTransactions(id).then(setTransactions);
  }, [isAuthenticated, profile?.id, walletTick]);

  const handleOpenProfile = useCallback((userId?: string) => {
    setProfileUserId(userId || null);
    setActiveTab('profile');
  }, []);

  const handleTabChange = useCallback((tab: Tab) => {
    if (tab === 'profile') setProfileUserId(null);
    setActiveTab(tab);
  }, []);

  const handleBackToOwnProfile = useCallback(() => {
    setProfileUserId(null);
    setActiveTab('profile');
  }, []);

  const handleGiftSent = useCallback(() => {
    setWalletTick((t) => t + 1);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/WhatsApp_Image_2026-10-16_at_9.16.39_PM.jpeg"
            alt="PikPok"
            className="h-44 w-44 rounded-full object-contain"
          />
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen w-full bg-black overflow-hidden flex flex-col">
      <div className="flex-1 relative max-w-md mx-auto w-full overflow-hidden">
        {activeTab === 'home' && (
          <HomePage
            onOpenProfile={handleOpenProfile}
            onOpenGifts={setGiftVideo}
            onGiftSent={handleGiftSent}
          />
        )}
        {activeTab === 'search' && <SearchPage onOpenProfile={handleOpenProfile} />}
        {activeTab === 'upload' && (
          <UploadPage onUploaded={() => setWalletTick((t) => t + 1)} onGoHome={() => setActiveTab('home')} />
        )}
        {activeTab === 'profile' && (
          <ProfilePage
            userId={profileUserId}
            onOpenProfile={handleOpenProfile}
            onCreate={() => setActiveTab('upload')}
            onOpenDashboard={() => setActiveTab('dashboard')}
            wallet={wallet}
            onWalletChange={() => setWalletTick((t) => t + 1)}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardPage
            wallet={wallet}
            transactions={transactions}
            onBack={() => setActiveTab('profile')}
          />
        )}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <GiftsDrawer
        video={giftVideo}
        onClose={() => setGiftVideo(null)}
        onSent={handleGiftSent}
      />
    </div>
  );
}
