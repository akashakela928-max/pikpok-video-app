import { Link2, Check } from 'lucide-react';
import { useState } from 'react';
import type { Video } from '@/lib/types';

interface ShareSheetProps {
  video: Video | null;
  onClose: () => void;
}

export default function ShareSheet({ video, onClose }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  if (!video) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(video.video_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-2xl border-t border-white/10 max-w-md mx-auto animate-slide-up">
        <div className="flex justify-center pt-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>
        <div className="px-6 py-5">
          <h3 className="text-white font-semibold text-sm text-center mb-4">Share</h3>
          <div className="grid grid-cols-4 gap-4">
            <button onClick={handleCopy} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                {copied ? <Check size={20} className="text-emerald-400" /> : <Link2 size={20} className="text-white" />}
              </div>
              <span className="text-gray-400 text-xs">{copied ? 'Copied' : 'Copy link'}</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full mt-5 py-2.5 text-gray-400 text-sm border border-white/10 rounded-lg hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
