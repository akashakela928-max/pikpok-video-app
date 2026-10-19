import { ExternalLink } from 'lucide-react';
import type { Ad } from '@/lib/types';

interface AdCardProps {
  ad: Ad;
}

export default function AdCard({ ad }: AdCardProps) {
  return (
    <div className="relative h-full w-full snap-start snap-always overflow-hidden bg-black flex items-center justify-center">
      <div className={`absolute inset-0 bg-gradient-to-br ${ad.gradient}`} />
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 h-full w-full flex flex-col p-5">
        {/* Sponsored label */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/70 text-xs font-semibold bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
            Sponsored
          </span>
          <span className="text-white/60 text-xs">{ad.sponsor}</span>
        </div>

        {/* Image */}
        {ad.image_url && (
          <div className="flex-1 flex items-center justify-center my-4">
            <img
              src={ad.image_url}
              alt={ad.title}
              className="max-h-[45%] w-auto rounded-2xl shadow-2xl object-cover"
            />
          </div>
        )}

        {/* Text */}
        <div className="mt-auto mb-8">
          <h2 className="text-white text-2xl font-black leading-tight mb-2">{ad.title}</h2>
          <p className="text-white/90 text-sm leading-snug mb-4">{ad.description}</p>
          <button
            onClick={() => ad.cta_url !== '#' && window.open(ad.cta_url, '_blank')}
            className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-bold text-sm active:scale-95 transition-transform"
          >
            {ad.cta_label}
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
