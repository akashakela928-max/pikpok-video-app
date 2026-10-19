import { useEffect, useState } from 'react';
import { X, Send, User } from 'lucide-react';
import type { Video, Comment } from '@/lib/types';
import { fetchComments, addComment } from '@/lib/api';
import { formatTimeAgo } from '@/lib/utils';
import { formatCount } from '@/lib/api';

interface CommentsDrawerProps {
  video: Video | null;
  onClose: () => void;
}

export default function CommentsDrawer({ video, onClose }: CommentsDrawerProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!video) return;
    setLoading(true);
    fetchComments(video.id).then((c) => {
      setComments(c);
      setLoading(false);
    });
  }, [video?.id]);

  if (!video) return null;

  const handleSubmit = async () => {
    if (!input.trim() || submitting) return;
    setSubmitting(true);
    const comment = await addComment(video.id, input);
    if (comment) {
      setComments((prev) => [comment, ...prev]);
      setInput('');
    }
    setSubmitting(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-[60%] bg-zinc-900 rounded-t-2xl border-t border-white/10 flex flex-col max-w-md mx-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="w-6" />
          <h3 className="text-white font-semibold text-sm">
            {formatCount(comments.length)} comments
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Pull indicator */}
        <div className="flex justify-center pt-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {loading && (
            <p className="text-gray-500 text-center text-sm">Loading comments...</p>
          )}
          {!loading && comments.length === 0 && (
            <p className="text-gray-500 text-center text-sm">No comments yet. Be the first!</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <span className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                {c.profile?.avatar_url ? (
                  <img
                    src={c.profile.avatar_url}
                    alt={c.profile?.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={16} className="text-gray-500" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-gray-400 text-xs font-semibold">
                  {c.profile?.username || 'Unknown'}
                </span>
                <p className="text-white text-sm leading-snug mt-0.5 break-words">{c.text}</p>
                <span className="text-gray-500 text-xs mt-1 block">
                  {formatTimeAgo(c.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2 pb-safe">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Add a comment..."
            className="flex-1 bg-zinc-800 text-white text-sm rounded-full px-4 py-2.5 placeholder-gray-500 outline-none border border-white/5 focus:border-white/20"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || submitting}
            className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center disabled:opacity-30 shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </>
  );
}
